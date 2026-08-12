import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'
import { requireServiceClient } from '../lib/supa.js'
import { writeAccessLog } from '../services/platform.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'too_many_requests', message: 'Slow down — too many auth attempts' } },
})

const toClient = (session, user) => ({
  accessToken: session.access_token,
  refreshToken: session.refresh_token,
  user: { id: user.id, email: user.email, name: user.user_metadata?.full_name || user.email },
})

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const supabase = requireServiceClient()
    const { email, password, name } = req.body || {}
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: { code: 'validation', message: 'Email and a password of 8+ characters are required' } })
    }
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name || email.split('@')[0] },
    })
    if (error) {
      const status = String(error.message).toLowerCase().includes('already') ? 409 : 400
      return res.status(status).json({ error: { code: status === 409 ? 'conflict' : 'validation', message: error.message } })
    }
    // Auto sign-in so the returned session is immediately usable.
    const { data: session, error: sessionErr } = await supabase.auth.signInWithPassword({ email, password })
    if (sessionErr) return res.status(201).json({ message: 'Account created — confirm email to sign in', user: { id: created.id, email } })
    return res.status(201).json(toClient(session.session, session.user))
  } catch (err) {
    return next(err)
  }
})

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const supabase = requireServiceClient()
    const { email, password } = req.body || {}
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      await writeAccessLog({ action: 'denied', metadata: { via: 'login', email } })
      return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid credentials' } })
    }
    return res.json(toClient(data.session, data.user))
  } catch (err) {
    return next(err)
  }
})

router.post('/refresh', authLimiter, async (req, res, next) => {
  try {
    const supabase = requireServiceClient()
    const token = req.body?.refreshToken
    if (!token) return res.status(400).json({ error: { code: 'validation', message: 'refreshToken required' } })
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: token })
    if (error || !data.session) return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid refresh token' } })
    return res.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    })
  } catch (err) {
    return next(err)
  }
})

export default router