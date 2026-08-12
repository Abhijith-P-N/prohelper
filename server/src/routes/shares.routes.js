import { Router } from 'express'
import { requireAuth } from '../middleware/security.js'
import {
  findFile, createShare, findShareBySecret, setShareRevoked, checkSharePassword, validateShareAccess,
} from '../services/platform.js'

const router = Router()

const invalidSecret = (res) =>
  res.status(404).json({ error: { code: 'not_found', message: 'Share not found' } })

// POST /api/v1/shares — owner creates a controlled share
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { fileId, password, expiresAt, maxDownloads } = req.body || {}
    const file = fileId ? await findFile(fileId) : null
    if (!file || file.ownerId !== req.user.id) {
      return res.status(404).json({ error: { code: 'not_found', message: 'File not found' } })
    }
    if (maxDownloads !== undefined && maxDownloads !== null && (Number(maxDownloads) < 1 || Number(maxDownloads) > 100)) {
      return res.status(400).json({ error: { code: 'validation', message: 'maxDownloads must be 1–100' } })
    }
    const { share, secret } = await createShare({
      fileId, ownerId: req.user.id, password, expiresAt, maxDownloads,
    })
    return res.status(201).json({
      shareId: share.id,
      shareToken: secret,
      url: `/s/${secret}`,
      passwordProtected: Boolean(password),
      expiresAt: share.expiresAt,
      maxDownloads: share.maxDownloads,
    })
  } catch (err) {
    return next(err)
  }
})

// GET /api/v1/shares/:token — resolve share (public)
router.get('/:token', async (req, res, next) => {
  try {
    const share = await findShareBySecret(req.params.token)
    if (!share) return invalidSecret(res)
    if (!validateShareAccess(share).ok) return invalidSecret(res)
    const file = await findFile(share.fileId)
    if (!file) return invalidSecret(res)
    if (share.passwordScrypt) {
      return res.json({ requiresPassword: true, fileId: file.id, name: file.name })
    }
    return res.json({
      requiresPassword: false,
      fileId: file.id,
      name: file.name,
      size: file.size,
      sha256: file.sha256,
      expiresAt: share.expiresAt,
      downloadsRemaining: share.maxDownloads === null ? null : Math.max(0, share.maxDownloads - share.downloadsUsed),
    })
  } catch (err) {
    return next(err)
  }
})

// POST /api/v1/shares/:token/auth — submit password for protected shares
router.post('/:token/auth', async (req, res, next) => {
  try {
    const share = await findShareBySecret(req.params.token)
    if (!share || !share.passwordScrypt) return invalidSecret(res)
    const ok = await checkSharePassword(share, req.body?.password)
    if (!ok) return res.status(403).json({ error: { code: 'forbidden', message: 'Incorrect password' } })
    const file = await findFile(share.fileId)
    return res.json({
      fileId: file.id, name: file.name, size: file.size, sha256: file.sha256,
      downloadsRemaining: share.maxDownloads === null ? null : Math.max(0, share.maxDownloads - share.downloadsUsed),
    })
  } catch (err) {
    return next(err)
  }
})

// DELETE /api/v1/shares/:token — owner revokes
router.delete('/:token', requireAuth, async (req, res, next) => {
  try {
    const share = await findShareBySecret(req.params.token)
    if (!share) return invalidSecret(res)
    const file = await findFile(share.fileId)
    if (!file || file.ownerId !== req.user.id) {
      return res.status(403).json({ error: { code: 'forbidden', message: 'Only the owner can revoke this share' } })
    }
    await setShareRevoked(share.id, true)
    return res.status(200).json({ ok: true, message: 'Share revoked' })
  } catch (err) {
    return next(err)
  }
})

export default router