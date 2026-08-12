import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/security.js'
import { listFiles, findFile, createFile, downloadFile } from '../services/platform.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/plain', 'application/pdf', 'application/zip', 'application/json', 'text/csv', 'image/png', 'application/octet-stream']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb({ status: 415, code: 'unsupported_type', message: 'File type not allowed' })
  },
})

router.use(requireAuth)

// GET /api/v1/files — owner listing
router.get('/', async (req, res, next) => {
  try {
    const rows = await listFiles(req.user.id)
    return res.json(rows.map((f) => ({ id: f.id, name: f.name, size: f.size, mime: f.mime, sha256: f.sha256, createdAt: f.createdAt })))
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/files/upload — encrypt + store + integrity hash
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { code: 'validation', message: 'No file received' } })
    const record = await createFile({
      ownerId: req.user.id,
      buffer: req.file.buffer,
      name: req.file.originalname,
      mime: req.file.mimetype,
    })
    return res.status(201).json({
      fileId: record.id,
      name: record.name,
      size: record.size,
      sha256: record.sha256,
      message: 'Encrypted (AES-256-GCM), fingerprinted (SHA-256) and stored',
    })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/files/:id — metadata, owner only
router.get('/:id', async (req, res, next) => {
  try {
    const file = await findFile(req.params.id)
    if (!file || file.ownerId !== req.user.id) {
      return res.status(404).json({ error: { code: 'not_found', message: 'File not found' } })
    }
    return res.json({ id: file.id, name: file.name, size: file.size, mime: file.mime, sha256: file.sha256, createdAt: file.createdAt })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/files/:id/download — decrypt + verify hash + stream
router.get('/:id/download', async (req, res, next) => {
  try {
    const result = await downloadFile(req.user.id, req.params.id)
    if (!result) return res.status(404).json({ error: { code: 'not_found', message: 'File not found' } })
    res.setHeader('X-Sha256', result.file.sha256)
    res.setHeader('Content-Type', result.file.mime || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${result.file.name}"`)
    return res.send(result.plain)
  } catch (err) {
    return next(err)
  }
})

export default router