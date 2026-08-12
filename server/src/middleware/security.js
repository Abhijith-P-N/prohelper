import { verifyAccessToken } from '../lib/supa.js'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: { code: 'unauthorized', message: 'Missing bearer token' } })
  try {
    const user = await verifyAccessToken(token)
    req.user = { id: user.id, email: user.email, user_metadata: user.user_metadata || {} }
    return next()
  } catch (err) {
    if (err.status === 503) return res.status(503).json({ error: { code: 'not_configured', message: err.message } })
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid or expired token' } })
  }
}

export function notFound(req, res) {
  return res.status(404).json({ error: { code: 'not_found', message: `No route for ${req.method} ${req.path}` } })
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500
  if (status >= 500) console.error(err)
  return res.status(status).json({
    error: {
      code: err.code || 'internal',
      message: status >= 500 ? 'Something went wrong on our side' : err.message,
    },
  })
}