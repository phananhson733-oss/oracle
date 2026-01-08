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

// Email Configuration (for verification emails)
export const EMAIL_CONFIG = {
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@astromind.ai',
  FROM_NAME: process.env.FROM_NAME || 'AstroMind AI',
};

// Free tier limits
export const FREE_TIER_LIMITS = {
  ASK_QUESTIONS: 3,
  DETAIL_READINGS: 3,
  SYNASTRY_OVERVIEWS: 1,
};

// Subscription benefits
export const SUBSCRIPTION_BENEFITS = {
  SYNASTRY_READS_PER_MONTH: 5,
  MONTHLY_REPORT_FREE: true,
  REPORT_DISCOUNT: 0.3, // 30%
};

// Check if auth providers are configured
export const isGoogleConfigured = (): boolean => {
  return !!(GOOGLE_CONFIG.CLIENT_ID && GOOGLE_CONFIG.CLIENT_SECRET);
};

export const isAppleConfigured = (): boolean => {
  return !!(APPLE_CONFIG.CLIENT_ID && APPLE_CONFIG.TEAM_ID);
};

export const isEmailConfigured = (): boolean => {
  return !!(EMAIL_CONFIG.SMTP_HOST && EMAIL_CONFIG.SMTP_USER);
};
