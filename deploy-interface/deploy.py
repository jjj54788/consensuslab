#!/usr/bin/env python3
"""
One-Click Deploy Web Interface
Connects to remote server via SSH and runs deployment script
"""

import os
import sys
import time
import json
import queue
import threading
from datetime import datetime
from flask import Flask, render_template, Response, jsonify, request
from flask_cors import CORS
import paramiko
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration from .env
SSH_HOST = os.getenv('SSH_HOST', '10.218.163.144')
SSH_PORT = int(os.getenv('SSH_PORT', '22'))
SSH_USERNAME = os.getenv('SSH_USERNAME', 'ai4news')
SSH_PASSWORD = os.getenv('SSH_PASSWORD', '')
DEPLOY_PATH = os.getenv('DEPLOY_PATH', '/home/ai4news/Sen_Li/consensuslab/')
DEPLOY_SCRIPT = os.getenv('DEPLOY_SCRIPT', './update-state-standalone.sh')

# Global queue for log streaming
log_queue = queue.Queue()
deployment_status = {
    'running': False,
    'success': False,
    'error': None,
    'start_time': None,
    'end_time': None
}


def log_message(message, level='INFO'):
    """Add a log message to the queue with timestamp"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = {
        'timestamp': timestamp,
        'level': level,
        'message': message
    }
    log_queue.put(log_entry)
    print(f"[{timestamp}] [{level}] {message}")


def execute_deployment():
    """Execute the deployment script via SSH"""
    global deployment_status

    ssh_client = None

    try:
        deployment_status['running'] = True
        deployment_status['success'] = False
        deployment_status['error'] = None
        deployment_status['start_time'] = datetime.now().isoformat()

        log_message("🚀 开始部署流程...", "INFO")
        log_message(f"连接目标: {SSH_USERNAME}@{SSH_HOST}:{SSH_PORT}", "INFO")

        # Create SSH client
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        log_message("正在建立SSH连接...", "INFO")

        # Connect to server
        ssh_client.connect(
            hostname=SSH_HOST,
            port=SSH_PORT,
            username=SSH_USERNAME,
            password=SSH_PASSWORD,
            timeout=30,
            allow_agent=False,
            look_for_keys=False
        )

        log_message("✅ SSH连接成功！", "SUCCESS")
        log_message(f"切换目录: {DEPLOY_PATH}", "INFO")

        # Execute deployment script with bash login shell to load full environment
        # This ensures pnpm and other tools are in PATH
        command = f"bash -l -c 'cd {DEPLOY_PATH} && {DEPLOY_SCRIPT}'"
        log_message(f"执行命令: {command}", "INFO")
        log_message("=" * 60, "INFO")

        # Execute command and stream output
        stdin, stdout, stderr = ssh_client.exec_command(command, get_pty=True)

        # Read stdout line by line
        for line in iter(stdout.readline, ""):
            if line:
                line = line.strip()
                if line:
                    log_message(line, "OUTPUT")

        # Check exit status
        exit_status = stdout.channel.recv_exit_status()

        log_message("=" * 60, "INFO")

        if exit_status == 0:
            log_message("✅ 脚本执行成功！", "SUCCESS")
            deployment_status['success'] = True
        else:
            error_output = stderr.read().decode('utf-8').strip()
            if error_output:
                log_message(f"错误输出: {error_output}", "ERROR")
            log_message(f"❌ 脚本执行失败 (退出码: {exit_status})", "ERROR")
            deployment_status['error'] = f"脚本退出码: {exit_status}"

    except paramiko.AuthenticationException:
        error_msg = "❌ SSH认证失败：用户名或密码错误"
        log_message(error_msg, "ERROR")
        deployment_status['error'] = error_msg

    except paramiko.SSHException as e:
        error_msg = f"❌ SSH连接错误: {str(e)}"
        log_message(error_msg, "ERROR")
        deployment_status['error'] = error_msg

    except Exception as e:
        error_msg = f"❌ 部署失败: {str(e)}"
        log_message(error_msg, "ERROR")
        deployment_status['error'] = error_msg

    finally:
        if ssh_client:
            ssh_client.close()
            log_message("SSH连接已关闭", "INFO")

        deployment_status['running'] = False
        deployment_status['end_time'] = datetime.now().isoformat()

        if deployment_status['success']:
            log_message("🎉 一键部署成功！", "SUCCESS")
        else:
            log_message("⚠️ 部署流程结束", "WARNING")


@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')


@app.route('/api/deploy', methods=['POST'])
def start_deploy():
    """Start the deployment process"""
    global deployment_status

    if deployment_status['running']:
        return jsonify({
            'success': False,
            'message': '部署正在进行中，请等待完成'
        }), 400

    # Clear log queue
    while not log_queue.empty():
        log_queue.get()

    # Start deployment in background thread
    thread = threading.Thread(target=execute_deployment)
    thread.daemon = True
    thread.start()

    return jsonify({
        'success': True,
        'message': '部署已启动'
    })


@app.route('/api/status')
def get_status():
    """Get current deployment status"""
    return jsonify(deployment_status)


@app.route('/api/logs')
def stream_logs():
    """Stream logs to client using Server-Sent Events"""
    def generate():
        while True:
            try:
                # Wait for new log message with timeout
                log_entry = log_queue.get(timeout=1)
                # Use json.dumps instead of jsonify to avoid Flask context issues
                yield f"data: {json.dumps(log_entry)}\n\n"
            except queue.Empty:
                # Send heartbeat to keep connection alive
                yield f": heartbeat\n\n"
            except GeneratorExit:
                break

    return Response(generate(), mimetype='text/event-stream')


@app.route('/api/config')
def get_config():
    """Get configuration (without sensitive data)"""
    return jsonify({
        'host': SSH_HOST,
        'port': SSH_PORT,
        'username': SSH_USERNAME,
        'deploy_path': DEPLOY_PATH,
        'deploy_script': DEPLOY_SCRIPT,
        'has_password': bool(SSH_PASSWORD)
    })


if __name__ == '__main__':
    # Check if SSH password is configured
    if not SSH_PASSWORD:
        print("\n" + "=" * 60)
        print("⚠️  WARNING: SSH_PASSWORD not configured in .env file!")
        print("=" * 60 + "\n")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("🚀 ConsensusLab 一键部署服务")
    print("=" * 60)
    print(f"目标服务器: {SSH_USERNAME}@{SSH_HOST}:{SSH_PORT}")
    print(f"部署路径: {DEPLOY_PATH}")
    print(f"部署脚本: {DEPLOY_SCRIPT}")
    print("=" * 60 + "\n")

    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )
