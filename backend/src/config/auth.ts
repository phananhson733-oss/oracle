// Authentication configuration
import dotenv from 'dotenv';

dotenv.config();

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  ACCESS_TOKEN_EXPIRES_IN: '15m',  // 15 minutes
  REFRESH_TOKEN_EXPIRES_IN: '7d',   // 7 days
  ISSUER: 'astromind-ai',
};

// Google OAuth Configuration
export const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
};

// Apple Sign-In Configuration
export const APPLE_CONFIG = {
  CLIENT_ID: process.env.APPLE_CLIENT_ID || '',
  TEAM_ID: process.env.APPLE_TEAM_ID || '',
  KEY_ID: process.env.APPLE_KEY_ID || '',
  PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY || '',
};

// Resend Email Service (for verification codes)
export const RESEND_CONFIG = {
  API_KEY: process.env.RESEND_API_KEY || '',
  FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'AstroMind <noreply@astromind.ai>',
};

// Free tier limits
export const FREE_TIER_LIMITS = {
  // 新版配置
  ASK_QUESTIONS_PER_WEEK: 3,        // 每周免费 3 次 Ask
  SYNASTRY_TOTAL: 3,                 // 永久免费 3 次合盘
  DETAIL_READINGS: 2,                // 探索自我前 2 个心理维度免费
  SYNTHETICA_DAILY: 3,               // Synthetica 工具每日免费次数

  // 向后兼容 - 旧版配置
  ASK_QUESTIONS: 3,                  // @deprecated - 使用 ASK_QUESTIONS_PER_WEEK
  SYNASTRY_OVERVIEWS: 3,             // @deprecated - 使用 SYNASTRY_TOTAL
};

// Subscription benefits ($6.99/月)
export const SUBSCRIPTION_BENEFITS = {
  // 新版配置 - 权益额度（每周）
  ASK_EXTRA_PER_WEEK: 7,             // 订阅额外 +7 次/周 Ask（合计 10 次）
  SYNASTRY_EXTRA_PER_WEEK: 1,        // 订阅额外 +1 次/周 合盘
  SYNTHETICA_EXTRA_PER_DAY: 7,       // 订阅额外 +7 次/日 Synthetica

  // 无限权益
  UNLIMITED_DETAILS: true,           // 所有查看详情免费
  UNLIMITED_DIMENSIONS: true,        // 探索自我所有维度免费
  UNLIMITED_DAILY: true,             // 今日运势详情免费
  CBT_STATS_FREE: true,              // CBT 统计解读免费

  // 报告折扣
  REPORT_DISCOUNT: 0.2,              // 8 折 (20% off)

  // 订阅赠送积分
  SUBSCRIPTION_BONUS_CREDITS: 100,   // 每次成功支付发放

  // 试用期
  TRIAL_DAYS: 7,                     // 首次注册赠送 7 天试用

  // 向后兼容 - 旧版配置
  SYNASTRY_READS_PER_MONTH: 5,       // @deprecated
  MONTHLY_REPORT_FREE: true,         // @deprecated
};

// 定价配置（订阅为美分，其余为积分）
export const PRICING = {
  // 订阅（美元）
  SUBSCRIPTION_MONTHLY: 699,         // $6.99/月

  // 积分定价（1 积分 ≈ $0.05）— DeepSeek token 成本低，全线半价
  DIMENSION_UNLOCK: 5,               // 5 积分 - 心理维度单个解锁
  CORE_THEME_UNLOCK: 5,              // 5 积分 - 核心主题单个解锁
  DAILY_SCRIPT: 5,                   // 5 积分 - 今日剧本（每日）
  DAILY_TRANSIT_DETAIL: 5,           // 5 积分 - 星象详情（每日）
  DETAIL_VIEW: 5,                    // 5 积分 - 深度详情
  SYNASTRY_FULL: 15,                 // 15 积分 - 合盘单次
  SYNASTRY_DETAIL: 5,                // 5 积分 - 合盘内查看详情
  ASK_SINGLE: 10,                    // 10 积分 - Ask 单次
  CBT_STATS_MONTHLY: 10,             // 10 积分 - CBT 统计月度
  SYNTHETICA_USE: 5,                 // 5 积分 - Synthetica 单次使用
};

// LOGIN_GATE_MODE: 登录门控模式（后端侧标志，与前端 constants.ts 保持一致）
export const LOGIN_GATE_MODE = false;

// LOGIN_GATE_MODE 下的每日免费次数限制
export const LOGIN_GATE_DAILY_LIMITS = {
  ASK_DAILY: 3,
  SYNASTRY_DAILY: 3,
  SYNTHETICA_DAILY: 5,
};

// Check if auth providers are configured
export const isGoogleConfigured = (): boolean => {
  return !!(GOOGLE_CONFIG.CLIENT_ID && GOOGLE_CONFIG.CLIENT_SECRET);
};

export const isAppleConfigured = (): boolean => {
  return !!(APPLE_CONFIG.CLIENT_ID && APPLE_CONFIG.TEAM_ID);
};

export const isResendConfigured = (): boolean => {
  return !!RESEND_CONFIG.API_KEY;
};
