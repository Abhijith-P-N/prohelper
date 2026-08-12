import { Router } from 'express'
import { requireAuth } from '../middleware/security.js'
import { fetchAudit } from '../services/platform.js'

const router = Router()

router.use(requireAuth)

// GET /api/v1/audit — owner-scoped access log
router.get('/', async (req, res, next) => {
  try {
    const rows = await fetchAudit(req.user.id)
    const action = req.query.action
    const filtered = action ? rows.filter((r) => r.action === action) : rows
    return res.json({ rows: filtered, total: filtered.length, page: 1, pageSize: filtered.length })
  } catch (err) {
    return next(err)
  }
})

export default router