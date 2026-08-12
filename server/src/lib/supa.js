import { createClient } from '@supabase/supabase-js'
import { env, isSupabase } from '../config/env.js'

let service = null

export function requireServiceClient() {
  if (!isSupabase) {
    const err = new Error('Server not configured: set SUPABASE_URL and SUPABASE_SERVICE_KEY in server/.env')
    err.status = 503
    err.code = 'not_configured'
    throw err
  }
  if (!service) {
    service = createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' },
    })
  }
  return service
}

export async function verifyAccessToken(token) {
  const supabase = requireServiceClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new Error(error?.message || 'Invalid token')
  return data.user
}