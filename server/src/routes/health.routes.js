import { Router } from 'express'
import { isSupabase } from '../config/env.js'
import { dbHealth } from '../services/platform.js'

const router = Router()

router.get('/', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const base = {
    status: 'ok',
    mode: isSupabase ? 'supabase' : 'not-configured',
    service: 'securasync-api',
    version: '1.0.0',
    uptime: Math.round(process.uptime()),
  }
  if (!isSupabase) {
    return res.status(200).json({ ...base, db: 'unconfigured — set SUPABASE_URL + SUPABASE_SERVICE_KEY' })
  }
  try {
    const db = await dbHealth()
    return res.json({ ...base, db: db ? 'connected' : 'unreachable' })
  } catch {
    return res.json({ ...base, db: 'error' })
  }
})

export default router