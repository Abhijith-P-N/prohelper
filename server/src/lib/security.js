import crypto from 'node:crypto'
import { env } from '../config/env.js'

export const sha256 = (input) => crypto.createHash('sha256').update(input).digest('hex')

export const randomBytes = (n = 32) => crypto.randomBytes(n).toString('base64url')

/** Share secret — unguessable, never stored in full. */
export const shareSecret = () => randomBytes(32)

/** Digest-at-rest: base64url of the SHA-256 of a secret. */
export const tokenDigest = (secret) => crypto.createHash('sha256').update(secret).digest('base64url')

/** Constant-time comparison for token digests. */
export const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

/** AES-256-GCM envelope: IV (12) || authTag (16) || ciphertext. */
export function aesEncrypt(plaintext) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', env.masterKey, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url')
}

export function aesDecrypt(payload) {
  const buf = Buffer.from(payload, 'base64url')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', env.masterKey, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(data), decipher.final()])
  return plain.toString('utf8')
}

/** Buffer-based AES-256-GCM envelope used by the platform service. */
export function aesEncryptBuffer(plain) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', env.masterKey, iv)
  const data = Buffer.concat([cipher.update(plain), cipher.final()])
  const tag = cipher.getAuthTag()
  return { iv, tag, data }
}

export function aesDecryptBuffer(data, iv, tag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', env.masterKey, Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([decipher.update(data), decipher.final()])
}

/** Minimal HMAC-signed token (demo stand-in for JWT). payload: object */
export function signToken(payload, ttlSeconds = 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'securasync' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url')
  const sig = crypto.createHmac('sha256', env.jwtSecret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

export function verifyToken(token) {
  const [h, b, s] = String(token || '').split('.')
  if (!h || !b || !s) throw new Error('malformed_token')
  const expected = crypto.createHmac('sha256', env.jwtSecret).update(`${h}.${b}`).digest('base64url')
  if (!safeEqual(s, expected)) throw new Error('bad_signature')
  const payload = JSON.parse(Buffer.from(b, 'base64url').toString('utf8'))
  if (payload.exp * 1000 < Date.now()) throw new Error('token_expired')
  return payload
}

export const scryptHash = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export const scryptVerify = (password, stored) => {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 32).toString('hex')
  return safeEqual(hash, candidate)
}