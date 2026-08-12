# SecureSync

> Secure File Sharing Platform — team workspace built on real Supabase data.

SecureSync is a full-stack project-management and AI development workspace that helps the
**Secure File Sharing Platform** team run a 3-week build. It combines project management,
task tracking, team member management, AI coding prompts, architecture, API docs, git workflow,
dependencies, security testing, documentation, and progress tracking.

**Live mode, no dummy data.** The app reads and writes real rows in your Supabase project.
Nothing is seeded onto the client; you sign up real users, add real team members and manage a
real sprint. Optional `supabase/seed.sql` exists only if you want a starting point.

## Team

| Member | Role | Branch |
| --- | --- | --- |
| Haroon | Frontend & UI/UX | `feature/haroon-frontend` |
| Azin | Backend & API | `feature/azin-backend` |
| Adhil | Security & Encryption | `feature/adhil-security` |
| Abhi | Database, Storage & DevOps | `feature/abhi-database` |

## Stack

- **Frontend** — React, Vite, Tailwind CSS, React Router, Framer Motion, Lucide React
- **Backend** — Node.js, Express (verifies Supabase JWTs, powers file upload/share flows)
- **Database** — Supabase PostgreSQL (RLS on every table)
- **Auth** — Supabase Auth (real sign-up/sign-in, no demo identities)

## Project layout

```
securasync/
├── client/          # React + Vite frontend (talks directly to Supabase)
├── server/          # Express API (Supabase-verified tokens, upload/share flows)
├── supabase/        # SQL schema + optional seed
└── PROJECT_SPEC.md  # Single source of truth for the product build
```

## Quick start (needs Supabase)

```bash
# 1. Create a Supabase project, run supabase/schema.sql (+ optional seed.sql)

# 2. Configure the client
cp client/.env.example client/.env
#    set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Configure the server (optional — needed for file upload/share flows)
cp server/.env.example server/.env
#    set SUPABASE_URL and SUPABASE_SERVICE_KEY

# 4. Install + run
npm install --prefix client
npm install --prefix server
npm run dev --prefix client     # http://localhost:5173
npm run dev --prefix server     # http://localhost:4000
```

Then sign up from the Login page — real users land on an empty board they build together:
add team members (`/app/team`), create tasks with dependencies (`/app/tasks`), log API
endpoints, security tests, roadmap and prompts.

> Without keys: the app loads and shows clear "not configured" states on Login and in the
> topbar. Routes on the server return `503 not_configured`.

## Docs

- `docs/DELIVERABLES.md` — folder structure, schema, setup, env vars, auth flow, features,
  local run, deployment, AI integration plan.
- `supabase/README.md` — schema + RLS + seed notes.
- `server/README.md` — API contract and runbook.