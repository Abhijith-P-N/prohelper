# SecureSync API

Express server for the Secure File Sharing Platform. Runs in **demo mode** out of the box
(in-memory store, real crypto) and can be pointed at Supabase later.

## Run

```bash
npm install
cp .env.example .env        # optional
npm run dev                 # http://localhost:4000
```

## Endpoints (contract)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | demo: creates token for any email |
| POST | `/api/v1/auth/login` | demo users: `haroon|azin|adhil|abhi@securasync.dev` / `secure123` |
| POST | `/api/v1/auth/refresh` | rotates refresh token |
| POST | `/api/v1/files/upload` | multer + mimetype allowlist, returns SHA-256 |
| GET | `/api/v1/files/:id` | owner only (IDOR closed → 404 for others) |
| GET | `/api/v1/files/:id/download` | owner, hash-verified stream header |
| POST | `/api/v1/shares` | password/expiry/limits, secret returned once |
| GET | `/api/v1/shares/:token` | masked 404 for unknown/revoked/expired/limit-reached |
| POST | `/api/v1/shares/:token/auth` | scrypt password gate |
| DELETE | `/api/v1/shares/:token` | owner revoke |
| GET | `/api/v1/audit` | owner-scoped access log |
| GET | `/api/v1/health` | probe |

Errors are always `{ error: { code, message } }`.

## Environment

See `.env.example`. `MASTER_KEY` (64 hex chars) is used for the AES-256-GCM envelope in demo mode;
rotate `JWT_SECRET` before any real deployment.