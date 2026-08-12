import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { env, isSupabase } from './config/env.js'
import authRoutes from './routes/auth.routes.js'
import filesRoutes from './routes/files.routes.js'
import sharesRoutes from './routes/shares.routes.js'
import auditRoutes from './routes/audit.routes.js'
import healthRoutes from './routes/health.routes.js'
import { errorHandler, notFound } from './middleware/security.js'

const app = express()

app.disable('x-powered-by')
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"] },
    },
    hsts: env.nodeEnv === 'production' ? { maxAge: 15552000, includeSubDomains: true } : false,
  })
)
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

const globalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(globalLimiter)

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/files', filesRoutes)
app.use('/api/v1/shares', sharesRoutes)
app.use('/api/v1/audit', auditRoutes)
app.use('/api/v1/health', healthRoutes)

app.get('/', (_req, res) =>
  res.json({ service: 'SecureSync API', health: '/api/v1/health', mode: isSupabase ? 'supabase' : 'demo' })
)

app.use(notFound)
app.use(errorHandler)

export default app