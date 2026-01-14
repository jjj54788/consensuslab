import { getDb } from "./db";

interface ExportData {
  session: any;
  messages: any[];
  agents: any[];
}

/**
 * Generate Markdown format export
 */
export async function exportToMarkdown(sessionId: string): Promise<string> {
  const data = await getExportData(sessionId);
  if (!data) {
    throw new Error("Session not found");
  }

  const { session, messages, agents } = data;
  
  // Create agent lookup map
  const agentMap = new Map(agents.map(a => [a.id, a]));
  
  let markdown = `# ${session.topic}\n\n`;
  markdown += `## 讨论信息\n\n`;
  markdown += `- **创建时间**: ${new Date(session.createdAt).toLocaleString('zh-CN')}\n`;
  markdown += `- **状态**: ${session.status === 'completed' ? '已完成' : session.status === 'in_progress' ? '进行中' : '待开始'}\n`;
  markdown += `- **总轮数**: ${session.maxRounds}\n`;
  markdown += `- **当前轮数**: ${session.currentRound}\n`;
  
  const participatingAgents = Array.from(new Set(messages.map(m => m.sender)))
    .map(id => agentMap.get(id)?.name)
    .filter(Boolean);
  markdown += `- **参与智能体**: ${participatingAgents.join('、')}\n\n`;
  
  // Group messages by round
  const messagesByRound = messages.reduce((acc: any, msg: any) => {
    if (!acc[msg.round]) acc[msg.round] = [];
    acc[msg.round].push(msg);
    return acc;
  }, {});
  
  markdown += `## 讨论内容\n\n`;
  
  for (let round = 1; round <= session.currentRound; round++) {
    markdown += `### 第 ${round} 轮\n\n`;
    
    const roundMessages = messagesByRound[round] || [];
    for (const msg of roundMessages) {
      const agent = agentMap.get(msg.sender);
      if (!agent) continue;
      
      markdown += `#### ${agent.name}\n\n`;
      markdown += `${msg.content}\n\n`;
      
      if (msg.scores) {
        try {
          const scores = JSON.parse(msg.scores);
          markdown += `**评分**:\n`;
          if (scores.logic !== undefined) markdown += `- 逻辑: ${scores.logic}/10\n`;
          if (scores.innovation !== undefined) markdown += `- 创新: ${scores.innovation}/10\n`;
          if (scores.expression !== undefined) markdown += `- 表达: ${scores.expression}/10\n`;
          if (scores.total !== undefined) markdown += `- 总分: ${scores.total}/30\n`;
          markdown += `\n`;
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      markdown += `---\n\n`;
    }
  }
  
  // Add summary if available
  if (session.summary) {
    markdown += `## 讨论总结\n\n`;
    markdown += `${session.summary}\n\n`;
  }
  
  // Add highlights
  markdown += `## 讨论亮点\n\n`;
  
  if (session.bestViewpoint) {
    markdown += `### 最佳观点\n\n${session.bestViewpoint}\n\n`;
  }
  
  if (session.mostInnovative) {
    markdown += `### 最具创新观点\n\n${session.mostInnovative}\n\n`;
  }
  
  if (session.goldenQuotes && session.goldenQuotes.length > 0) {
    markdown += `### 精彩金句\n\n`;
    session.goldenQuotes.forEach((quote: string) => {
      markdown += `> ${quote}\n\n`;
    });
  }
  
  if (session.keyPoints && session.keyPoints.length > 0) {
    markdown += `### 关键观点\n\n`;
    session.keyPoints.forEach((point: string, index: number) => {
      markdown += `${index + 1}. ${point}\n`;
    });
    markdown += `\n`;
  }
  
  if (session.disagreements && session.disagreements.length > 0) {
    markdown += `### 主要分歧点\n\n`;
    session.disagreements.forEach((disagreement: string, index: number) => {
      markdown += `${index + 1}. ${disagreement}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `*导出时间: ${new Date().toLocaleString('zh-CN')}*\n`;
  
  return markdown;
}

/**
 * Generate PDF format export (returns HTML that can be converted to PDF)
 */
export async function exportToPDF(sessionId: string): Promise<string> {
  const data = await getExportData(sessionId);
  if (!data) {
    throw new Error("Session not found");
  }

  const { session, messages, agents } = data;
  
  // Create agent lookup map
  const agentMap = new Map(agents.map(a => [a.id, a]));
  
  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(session.topic)}</title>
  <style>
    body {
      font-family: "Microsoft YaHei", "SimSun", sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 5px;
    }
    h3 {
      color: #3b82f6;
      margin-top: 20px;
    }
    h4 {
      color: #60a5fa;
      margin-top: 15px;
      margin-bottom: 10px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .info-table td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    .info-table td:first-child {
      font-weight: bold;
      background-color: #f3f4f6;
      width: 120px;
    }
    .message {
      background-color: #f9fafb;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .scores {
      background-color: #eff6ff;
      padding: 10px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .scores ul {
      margin: 5px 0;
      padding-left: 20px;
    }
    .highlight-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    blockquote {
      border-left: 4px solid #9ca3af;
      padding-left: 15px;
      margin: 15px 0;
      font-style: italic;
      color: #6b7280;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #6b7280;
      font-size: 0.9em;
    }
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(session.topic)}</h1>
  
  <h2>讨论信息</h2>
  <table class="info-table">
    <tr>
      <td>创建时间</td>
      <td>${new Date(session.createdAt).toLocaleString('zh-CN')}</td>
    </tr>
    <tr>
      <td>状态</td>
      <td>${session.status === 'completed' ? '已完成' : session.status === 'in_progress' ? '进行中' : '待开始'}</td>
    </tr>
    <tr>
      <td>总轮数</td>
      <td>${session.maxRounds}</td>
    </tr>
    <tr>
      <td>当前轮数</td>
      <td>${session.currentRound}</td>
    </tr>
    <tr>
      <td>参与智能体</td>
      <td>${Array.from(new Set(messages.map((m: any) => m.sender)))
        .map((id: string) => agentMap.get(id)?.name)
        .filter(Boolean)
        .join('、')}</td>
    </tr>
  </table>
  
  <h2>讨论内容</h2>
`;

  // Group messages by round
  const messagesByRound = messages.reduce((acc: any, msg: any) => {
    if (!acc[msg.round]) acc[msg.round] = [];
    acc[msg.round].push(msg);
    return acc;
  }, {});
  
  for (let round = 1; round <= session.currentRound; round++) {
    html += `<h3>第 ${round} 轮</h3>\n`;
    
    const roundMessages = messagesByRound[round] || [];
    for (const msg of roundMessages) {
      const agent = agentMap.get(msg.sender);
      if (!agent) continue;
      
      html += `<div class="message">
        <h4>${escapeHtml(agent.name)}</h4>
        <p>${escapeHtml(msg.content).replace(/\n/g, '<br>')}</p>
`;
      
      if (msg.scores) {
        try {
          const scores = JSON.parse(msg.scores);
          html += `<div class="scores">
            <strong>评分:</strong>
            <ul>`;
          if (scores.logic !== undefined) html += `<li>逻辑: ${scores.logic}/10</li>`;
          if (scores.innovation !== undefined) html += `<li>创新: ${scores.innovation}/10</li>`;
          if (scores.expression !== undefined) html += `<li>表达: ${scores.expression}/10</li>`;
          if (scores.total !== undefined) html += `<li>总分: ${scores.total}/30</li>`;
          html += `</ul>
          </div>`;
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      html += `</div>\n`;
    }
  }
  
  // Add summary if available
  if (session.summary) {
    html += `<h2>讨论总结</h2>
    <p>${escapeHtml(session.summary).replace(/\n/g, '<br>')}</p>\n`;
  }
  
  // Add highlights
  html += `<h2>讨论亮点</h2>\n`;
  
  if (session.bestViewpoint) {
    html += `<div class="highlight-box">
      <h3>最佳观点</h3>
      <p>${escapeHtml(session.bestViewpoint)}</p>
    </div>\n`;
  }
  
  if (session.mostInnovative) {
    html += `<div class="highlight-box">
      <h3>最具创新观点</h3>
      <p>${escapeHtml(session.mostInnovative)}</p>
    </div>\n`;
  }
  
  if (session.goldenQuotes && session.goldenQuotes.length > 0) {
    html += `<div class="highlight-box">
      <h3>精彩金句</h3>`;
    session.goldenQuotes.forEach((quote: string) => {
      html += `<blockquote>${escapeHtml(quote)}</blockquote>`;
    });
    html += `</div>\n`;
  }
  
  if (session.keyPoints && session.keyPoints.length > 0) {
    html += `<h3>关键观点</h3><ol>`;
    session.keyPoints.forEach((point: string) => {
      html += `<li>${escapeHtml(point)}</li>`;
    });
    html += `</ol>\n`;
  }
  
  if (session.disagreements && session.disagreements.length > 0) {
    html += `<h3>主要分歧点</h3><ol>`;
    session.disagreements.forEach((disagreement: string) => {
      html += `<li>${escapeHtml(disagreement)}</li>`;
    });
    html += `</ol>\n`;
  }
  
  html += `
  <div class="footer">
    <p>导出时间: ${new Date().toLocaleString('zh-CN')}</p>
  </div>
</body>
</html>`;
  
  return html;
}

/**
 * Get export data for a session
 */
async function getExportData(sessionId: string): Promise<ExportData | null> {
  const db = await getDb();
  if (!db) return null;
  
  const { debateSessions, messages: messagesTable, agents } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  // Get session
  const sessions = await db
    .select()
    .from(debateSessions)
    .where(eq(debateSessions.id, sessionId))
    .limit(1);
  
  if (sessions.length === 0) return null;
  const session = sessions[0];
  
  // Get messages
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.sessionId, sessionId));
  
  // Get all agents
  const allAgents = await db.select().from(agents);
  
  return {
    session,
    messages,
    agents: allAgents,
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
