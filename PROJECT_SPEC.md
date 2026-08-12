# PROJECT_SPEC — Secure File Sharing Platform

> Source of truth for the Secure File Sharing Platform. Every generated AI coding prompt must
> reference this file, the team architecture, the API contract, and the relevant dependencies.

## 1. Vision

A privacy-first web application that lets users securely upload, share, and download files with
granular controls: password protection, expiration windows, and download limits. Files are
encrypted at rest and verified in transit. The platform must earn trust through visible,
auditable security.

## 2. Non-negotiable requirements

1. **Encryption at rest** — Files are encrypted with AES-256-GCM before hitting storage.
2. **Integrity in transit** — SHA-256 represents digital fingerprints for every share.
3. **Secure tokens** — Share links/keywords are unguessable, one-way tokenized (never stored in plain text).
4. **Authorization** — Only an owner can revoke, edit, or inspect a share (no IDOR).
5. **Controlled access** — Optional password, expiration, and download-limit controls per share.
6. **Auditability** — Access logs recorded for every upload, download, and denied attempt.
7. **Defense in depth** — Input validation, rate limiting, security headers (Helmet), safe file handling.

## 3. Scope — 3-week sprint

| Week | Theme | Goal |
| --- | --- | --- |
| **Week 1** | Prototype | End-to-end upload/download loop, user auth, schema, storage, encryption architecture |
| **Week 2** | Security | Share controls, AES-256-GCM, token hardening, revocation, access logs |
| **Week 3** | Finalization | Hardening, penetration tests, threat model, production deployment |

## 4. Team architecture

```
Haroon  (Frontend & UI/UX)         feature/haroon-frontend
   │  consumes →  Azin  (Backend & API)            feature/azin-backend
                        │  called by →  Adhil (Security & Encryption)      feature/adhil-security
                        │  reads/writes → Abhi (Database, Storage & DevOps) feature/abhi-database
```

Dependencies between work streams:
- Haroon's **Upload UI** depends on Azin's **Upload API**.
- Azin's **Upload API** depends on Abhi's **Storage**.
- Adhil's **Encryption** integrates with Azin's **Upload API**.

## 5. API contract (summary)

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Create account | Public |
| POST | `/api/v1/auth/login` | Issue tokens | Public |
| POST | `/api/v1/auth/refresh` | Rotate token | Public |
| POST | `/api/v1/files/upload` | Encrypt + store file | Bearer |
| GET | `/api/v1/files/:id` | Metadata for a file | Bearer / owner |
| GET | `/api/v1/files/:id/download` | Stream a decrypted download | Owner or share token |
| POST | `/api/v1/shares` | Create share link | Bearer / owner |
| GET | `/api/v1/shares/:token` | Resolve share (validates password/expiry/limit) | Public |
| DELETE | `/api/v1/shares/:token` | Revoke share | Bearer / owner |
| GET | `/api/v1/audit` | Owner access log | Bearer |
| GET | `/api/v1/health` | Service health | Public |

See the in-app **API Contract** page for the full field-level contract.

## 6. Core dependencies

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, React Router 6, Framer Motion 11, Lucide React.
- **Backend**: Node 20+, Express 4, `@supabase/supabase-js`, supabase-js for PostgREST writes.
- **Security**: `crypto` (AES-256-GCM, SHA-256), `jsonwebtoken`, `helmet`, `express-rate-limit`,
  `express-validator`, `multer` + `file-type` (validation).
- **DB/Infra**: supabase (Postgres), `pg` for migrations, Docker + docker-compose, Nginx/Caddy for HTTPS.

## 7. Security & encryption architecture

- File flow: **upload → AES-256-GCM encrypt (per-file 256-bit key) → integrity hash (SHA-256) → store blob + key-encrypted envelope in Postgres/object storage.**
- Envelope: file key encrypted with a master key; master key from environment variable.
- Share tokens: `id = base64url(sha256(secret))` — secret stored in plaintext on the client, only the digest in the DB.
- Password protector: user password is hashed (scrypt), per-share; a share without its password reveals nothing.
- Integrity endpoint: download computes SHA-256 of decrypted bytes and compares with the envelope.

## 8. Definition of done

- Feature works in local dev under a `README` runbook.
- Vulnerable-path checklist covered: Authentication, Authorization, IDOR, Path traversal, Brute force,
  Token security, File validation, Encryption integrity, Share security.
- Tests: happy path + one negative path per endpoint.

## 9. Deliverables

1. Runnable web app (client + server)
2. Database migrations + seed data
3. Security test report (Week 3)
4. Deployment runbook (HTTPS + Docker production)
5. Access controls reflecting the 4 personas above