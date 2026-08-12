# SecureSync — Supabase PostgreSQL

Schema and seed data for the Secure File Sharing Platform + SecureSync workspace.

## Tables

| Table | Purpose |
| --- | --- |
| `users` | App users (extends `auth.users`) |
| `team_members` | Haroon, Azin, Adhil, Abhi + roles, branches, status |
| `tasks` | Sprint tasks (status, priority, assignee, week, due date) |
| `task_dependencies` | Task → task edges (drives blocked-state logic) |
| `prompts` | Saved AI coding prompts |
| `roadmap` | Week 1–3 delivery plan |
| `api_endpoints` | The agreed API contract |
| `security_tests` | 10 vulnerable-path checklist |
| `documents` | Overview/Architecture/DB/API/Security/Encryption/Setup/Testing/Deployment |
| `activity_logs` | Workspace audit trail |
| `chat_messages` | Team chat |
| `files` | Encrypted file envelopes (AES-256-GCM metadata, SHA-256, storage key) |
| `shares` | Controlled share links (digest-at-rest, password, expiry, limits) |
| `access_logs` | Ownership-scoped upload/download/denied audit rows |

## Security model

- Row Level Security is **enabled on every table**.
- Files/shares/access_logs are scoped to `owner_id = auth.uid()` — cross-tenant reads are impossible (IDOR closure).
- Share secrets are stored **only as `base64url(sha256(secret))`** in `shares.secret_digest`.
- `access_logs` can only be written through the `security definer` helper `public.write_access_log(...)` so regular users can never forge audit rows.
- `users` auto-created by trigger when a row lands in `auth.users`.

## Apply it

Either paste `schema.sql` into the Supabase SQL editor, or from the folder:

```bash
psql "$SUPABASE_DB_URL" -f schema.sql
psql "$SUPABASE_DB_URL" -f seed.sql
```

> `seed.sql` is a **day-0 scaffold**: team members, the 51-task backlog, dependencies,
> roadmap, API contract, security checklist and docs — all starting at zero (TODO / PENDING,
> no fabricated progress). Idempotent: safe to re-run.
>
> Order matters: `schema.sql` first, then `seed.sql`. Both are idempotent
> (`create table if not exists`, `on conflict`/`where not exists` guards).