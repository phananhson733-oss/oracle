import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Profile {
  id: string
  name: string
  birth_date: string
  birth_time: string
  birth_place: string
  latitude: number
  longitude: number
  timezone: string
  language: 'en' | 'zh'
  created_at: string
  updated_at: string
}

export interface Visitor {
  id: string
  owner_id: string
  name: string
  birth_date: string
  birth_time: string
  birth_place: string
  latitude: number
  longitude: number
  timezone: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: 'free' | 'monthly' | 'yearly'
  status: 'active' | 'cancelled' | 'expired'
  oracle_remaining: number
  started_at: string
  expires_at: string | null
}
