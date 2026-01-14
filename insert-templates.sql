-- 快速讨论模板
INSERT INTO debate_templates (id, userId, name, description, agentIds, rounds, isSystem, createdAt, updatedAt)
VALUES (
  'preset-quick-debate',
  NULL,
  '快速讨论',
  '适合快速讨论，从支持、反对和中立三个角度快速分析话题。3个智能体，5轮讨论，约5-10分钟完成。',
  '["supporter", "opponent", "neutral"]',
  5,
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE name=name;

-- 深度分析模板
INSERT INTO debate_templates (id, userId, name, description, agentIds, rounds, isSystem, createdAt, updatedAt)
VALUES (
  'preset-deep-analysis',
  NULL,
  '深度分析',
  '深入探讨复杂话题，结合多角度观点和专业分析，提供创新见解。6个智能体，10轮讨论，约15-20分钟完成。',
  '["supporter", "opponent", "neutral", "critic", "innovator", "logic_scorer"]',
  10,
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE name=name;

-- 全面评估模板
INSERT INTO debate_templates (id, userId, name, description, agentIds, rounds, isSystem, createdAt, updatedAt)
VALUES (
  'preset-comprehensive-evaluation',
  NULL,
  '全面评估',
  '全方位分析重要决策，包含完整的观点论证、质量评分和专业分析。全部8个智能体，15轮讨论，约25-30分钟完成。',
  '["supporter", "opponent", "neutral", "logic_scorer", "innovation_scorer", "expression_scorer", "critic", "innovator"]',
  15,
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE name=name;
