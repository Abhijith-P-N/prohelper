import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  masterKey: Buffer.from(
    process.env.MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    'hex'
  ),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 30,
  storageBucket: process.env.STORAGE_BUCKET || 'secure-blobs',
}

export const isSupabase = Boolean(env.supabaseUrl && env.supabaseServiceKey)