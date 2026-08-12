import { createClient } from '@supabase/supabase-js'

export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'supabase'
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(url && anonKey)

export const supabase = supabaseEnabled
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

export function requireSupabase() {
  if (!supabaseEnabled) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env')
  return supabase
}