// Supabase client configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// 尝试加载多个环境变量文件
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
];
envPaths.forEach((p) => dotenv.config({ path: p }));

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 检查是否为占位配置
const isPlaceholder = supabaseUrl.includes('placeholder') || !supabaseUrl || !supabaseServiceKey;

if (isPlaceholder) {
  console.warn('Warning: Supabase credentials not configured or using placeholder. Payment features will be disabled.');
}

// Service role client for backend operations (bypasses RLS)
// 使用占位 URL 避免初始化错误，实际调用时会检查 isSupabaseConfigured
const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co';
const effectiveKey = supabaseServiceKey || 'placeholder_key';

export const supabase: SupabaseClient = createClient(effectiveUrl, effectiveKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Check if Supabase is configured (not placeholder)
export const isSupabaseConfigured = (): boolean => {
  return !isPlaceholder;
};

// Database types
export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  provider: 'google' | 'apple' | 'email';
  provider_id: string | null;
  password_hash: string | null;
  birth_profile: BirthProfile | null;
  preferences: UserPreferences;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface BirthProfile {
  birthDate: string;
  birthTime?: string;
  birthCity: string;
  lat?: number;
  lon?: number;
  timezone: string;
  accuracyLevel: 'exact' | 'time_unknown' | 'approximate';
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  language: 'zh' | 'en';
}

export interface DbSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due' | 'expired' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  usage: SubscriptionUsage;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUsage {
  synastryReads: number;
  monthlyReportClaimed: boolean;
}

export interface DbPurchase {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  product_type: 'ask' | 'detail_pack' | 'synastry' | 'cbt_analysis' | 'report';
  product_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  quantity: number;
  consumed: number;
  created_at: string;
}

export interface DbReport {
  id: string;
  user_id: string;
  report_type: string;
  title: string | null;
  content: Record<string, unknown> | null;
  pdf_url: string | null;
  birth_profile: BirthProfile | null;
  partner_profile: BirthProfile | null;
  generated_at: string;
  created_at: string;
}

export interface DbFreeUsage {
  id: string;
  device_fingerprint: string;
  ip_address: string | null;
  ask_used: number;
  detail_used: number;
  synastry_used: number;
  created_at: string;
  updated_at: string;
}

export default supabase;
