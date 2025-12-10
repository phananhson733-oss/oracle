-- The Void - Supabase Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  birth_place TEXT NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'zh')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visitors (for Synastry)
CREATE TABLE public.visitors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  birth_place TEXT NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Natal Chart Cache
CREATE TABLE public.natal_charts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  planets_data JSONB NOT NULL,
  houses_data JSONB NOT NULL,
  aspects_data JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Content Cache
CREATE TABLE public.ai_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('daily', 'depth', 'synastry', 'oracle')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_en JSONB,
  content_zh JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Oracle Usage Tracking
CREATE TABLE public.oracle_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  oracle_remaining INTEGER NOT NULL DEFAULT 3,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Purchases (one-time)
CREATE TABLE public.purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('oracle_pack', 'depth_report', 'synastry_report')),
  product_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.natal_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own visitors" ON public.visitors FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own visitors" ON public.visitors FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can delete own visitors" ON public.visitors FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Users can view own natal chart" ON public.natal_charts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own natal chart" ON public.natal_charts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ai cache" ON public.ai_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai cache" ON public.ai_cache FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own oracle usage" ON public.oracle_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own oracle usage" ON public.oracle_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, oracle_remaining)
  VALUES (NEW.id, 'free', 'active', 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create subscription when profile is created
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for performance
CREATE INDEX idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON public.ai_cache(expires_at);
CREATE INDEX idx_visitors_owner ON public.visitors(owner_id);
CREATE INDEX idx_oracle_usage_user ON public.oracle_usage(user_id);
