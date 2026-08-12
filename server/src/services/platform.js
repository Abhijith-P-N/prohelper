import { requireServiceClient } from '../lib/supa.js'
import { env } from '../config/env.js'
import {
  sha256, randomBytes, aesEncryptBuffer, aesDecryptBuffer, scryptHash, scryptVerify, tokenDigest, safeEqual,
} from '../lib/security.js'

async function ensureBucket() {
  const supabase = requireServiceClient()
  try {
    await supabase.storage.getBucket(env.storageBucket)
  } catch {
    // bucket does not exist yet -> create it privately
    const { error } = await supabase.storage.createBucket(env.storageBucket, { public: false })
    if (error && !String(error.message).includes('already exists')) throw error
  }
}

// ── files ──────────────────────────────────────────────────────────────────
export async function listFiles(ownerId) {
  const supabase = requireServiceClient()
  const { data, error } = await supabase.from('files').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fileRow)
}

export async function findFile(id) {
  const supabase = requireServiceClient()
  const { data, error } = await supabase.from('files').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? fileRow(data) : null
}

export async function createFile({ ownerId, buffer, name, mime }) {
  const supabase = requireServiceClient()
  const fingerprint = sha256(buffer)
  const { iv, tag, data } = aesEncryptBuffer(buffer)
  const storageKey = `${ownerId}/${randomBytes(12)}.bin`

  await ensureBucket()
  const { error: upErr } = await supabase.storage.from(env.storageBucket).upload(storageKey, data, {
    contentType: 'application/octet-stream',
    upsert: false,
  })
  if (upErr) throw upErr

  const { data: row, error } = await supabase.from('files').insert({
    owner_id: ownerId,
    name,
    size: buffer.length,
    mime: mime || null,
    sha256: fingerprint,
    envelope: { iv: iv.toString('base64'), tag: tag.toString('base64'), cipher: 'aes-256-gcm' },
    storage_key: storageKey,
  }).select('*').single()
  if (error) throw error

  await writeAccessLog({ fileId: row.id, actorUserId: ownerId, action: 'upload' })
  return fileRow(row)
}

export async function downloadFile(ownerId, id) {
  const supabase = requireServiceClient()
  const file = await findFile(id)
  if (!file || file.ownerId !== ownerId) return null

  const { data: blob, error } = await supabase.storage.from(env.storageBucket).download(file.storageKey)
  if (error || !blob) throw error || new Error('Blob missing from storage')

  const buffer = Buffer.from(await blob.arrayBuffer())
  const { iv, tag } = file.envelope
  const plain = aesDecryptBuffer(buffer, iv, tag)
  const check = sha256(plain)
  if (!safeEqual(check, file.sha256)) {
    await writeAccessLog({ fileId: file.id, actorUserId: ownerId, action: 'denied', metadata: { reason: 'integrity_mismatch' } })
    return null
  }
  await writeAccessLog({ fileId: file.id, actorUserId: ownerId, action: 'download' })
  return { file, plain }
}

// ── shares ─────────────────────────────────────────────────────────────────
export async function createShare({ fileId, ownerId, password, expiresAt, maxDownloads }) {
  const supabase = requireServiceClient()
  const secret = randomBytes(32)
  const { data: row, error } = await supabase.from('shares').insert({
    file_id: fileId,
    owner_id: ownerId,
    secret_digest: tokenDigest(secret),
    password_scrypt: password ? scryptHash(password) : null,
    expires_at: expiresAt || null,
    max_downloads: maxDownloads ?? null,
    downloads_used: 0,
    revoked: false,
  }).select('*').single()
  if (error) throw error
  await writeAccessLog({ fileId, actorUserId: ownerId, action: 'upload', metadata: { via: 'share' } })
  return { share: shareRow(row), secret }
}

export async function findShareBySecret(secret) {
  const supabase = requireServiceClient()
  const digest = tokenDigest(secret)
  const { data, error } = await supabase.from('shares').select('*').eq('secret_digest', digest).maybeSingle()
  if (error) throw error
  return data ? shareRow(data) : null
}

export async function setShareRevoked(id, revoked = true) {
  const supabase = requireServiceClient()
  const { error } = await supabase.from('shares').update({ revoked }).eq('id', id)
  if (error) throw error
}

export async function checkSharePassword(share, password) {
  return scryptVerify(password || '', share.passwordScrypt || '')
}

export function validateShareAccess(share) {
  if (share.revoked) return { ok: false, reason: 'revoked' }
  if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) return { ok: false, reason: 'expired' }
  if (share.maxDownloads !== null && share.maxDownloads !== undefined && share.downloadsUsed >= share.maxDownloads) {
    return { ok: false, reason: 'limit_reached' }
  }
  return { ok: true }
}

// ── audit ──────────────────────────────────────────────────────────────────
export async function writeAccessLog({ fileId, actorUserId, action, ip, ua, metadata }) {
  const supabase = requireServiceClient()
  const { error } = await supabase.rpc('write_access_log', {
    p_file_id: fileId || null,
    p_actor: actorUserId || null,
    p_action: action,
    p_ip: ip || null,
    p_ua: ua || null,
    p_meta: metadata || {},
  })
  if (error && !String(error.message || '').includes('could not find the function')) throw error
}

export async function fetchAudit(ownerId) {
  const supabase = requireServiceClient()
  const { data, error } = await supabase
    .from('access_logs')
    .select('id, file_id, action, created_at, metadata, files!inner(owner_id)')
    .eq('files.owner_id', ownerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((r) => ({ id: r.id, fileId: r.file_id, action: r.action, at: r.created_at, metadata: r.metadata }))
}

export async function dbHealth() {
  const supabase = requireServiceClient()
  const { error } = await supabase.from('files').select('id', { count: 'exact', head: true }).limit(1)
  return !error
}

// ── mappers ────────────────────────────────────────────────────────────────
const fileRow = (r) => ({
  id: r.id, ownerId: r.owner_id, name: r.name, size: r.size, mime: r.mime,
  sha256: r.sha256, envelope: r.envelope, storageKey: r.storage_key, createdAt: r.created_at,
})

const shareRow = (r) => ({
  id: r.id, fileId: r.file_id, ownerId: r.owner_id, secretDigest: r.secret_digest,
  passwordScrypt: r.password_scrypt, expiresAt: r.expires_at, maxDownloads: r.max_downloads,
  downloadsUsed: r.downloads_used, revoked: r.revoked, createdAt: r.created_at,
})