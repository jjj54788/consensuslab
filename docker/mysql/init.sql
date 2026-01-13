-- 多智能体讨论系统 - 数据库初始化脚本
-- 此脚本会在MySQL容器首次启动时自动执行

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 等待数据库就绪
SELECT 'Initializing debate system database...' AS message;

-- 注意：表结构由 Drizzle ORM 自动创建（通过 db:push 命令）
-- 此脚本仅用于插入初始数据

-- 插入预设智能体数据
-- 注意：需要等待应用启动后执行 pnpm db:push 创建表结构

SELECT 'Database initialization script loaded. Tables will be created by Drizzle ORM on first app startup.' AS message;
