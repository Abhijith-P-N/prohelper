import app from './app.js'
import { env, isSupabase } from './config/env.js'

app.listen(env.port, () => {
  console.log(`[SecureSync] API listening on http://localhost:${env.port}`)
  console.log(`[SecureSync] mode: ${isSupabase ? 'supabase (live)' : 'not-configured (set SUPABASE_URL + SUPABASE_SERVICE_KEY)'}`)
})