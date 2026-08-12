# SecureSync — Build Deliverables

Everything requested for handoff, in one place.

1. [Folder structure](#1-folder-structure)
2. [Database schema](#2-database-schema)
3. [Setup instructions](#3-setup-instructions)
4. [Environment variables](#4-environment-variables)
5. [Authentication flow](#5-authentication-flow)
6. [Feature explanation](#6-feature-explanation)
7. [How to run locally](#7-how-to-run-locally)
8. [How to deploy](#8-how-to-deploy)
9. [Future AI integration plan](#9-future-ai-integration-plan)

---

## 1. Folder structure

```
securasync/
├── PROJECT_SPEC.md                # Source of truth referenced by every generated AI prompt
├── README.md
├── client/                        # React + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js             # dev proxy → :4000, manual chunks (code-split)
│   ├── tailwind.config.js         # SecureSync dark theme tokens
│   ├── eslint.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                # providers + route table
│       ├── index.css              # theme, panels, chips, buttons, mesh bg
│       ├── data/seedDb.js         # ALL sample data (members, 51 tasks, deps, API, security, docs…)
│       ├── lib/
│       │   ├── constants.js       # statuses, priorities, nav, writers
│       │   ├── utils.js           # week/day math, blocking engine, member stats
│       │   ├── promptTemplates.js # prompt builder grounded in PROJECT_SPEC
│       │   ├── supabase.js        # optional Supabase client + auth adapters
│       ├── context/
│       │   ├── AuthContext.jsx    # real Supabase Auth (sign-up / sign-in / reset)
│       │   ├── WorkspaceContext.jsx # Supabase-backed store (real CRUD, empty start)
│       │   └── ToastContext.jsx
│       ├── components/
│       │   ├── ui/                # Card, Modal, Avatar, Progress, Badges, States
│       │   ├── layout/            # AppShell, Sidebar, Topbar
│       │   ├── dashboard/         # widgets: stat cards, blocked, activity, team strip
│       │   ├── tasks/             # TaskBoard, TaskCard, TaskModal, options
│       │   ├── team/              # MemberCard + stream dependencies
│       │   └── prompts/           # PromptCard
│       └── pages/                 # 15 pages (see sidebar)
├── server/                        # Express API (verifies Supabase JWTs, upload/share flows)
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js / app.js
│       ├── config/env.js
│       ├── lib/security.js        # AES-256-GCM, SHA-256, scrypt, token digest, constant-time cmp
│       ├── lib/supa.js            # lazy Supabase service client + JWT verification
│       ├── services/platform.js   # files / shares / audit over PostgREST + storage
│       ├── middleware/security.js # requireAuth (Supabase), notFound, errorHandler
│       └── routes/                # auth · files · shares · audit · health
├── supabase/
│   ├── schema.sql                 # full DDL + RLS (users→chat_messages, files, shares, access_logs)
│   ├── seed.sql                   # members, roadmap, tasks, deps, API, tests, docs, prompts, chat
│   └── README.md
└── docs/DELIVERABLES.md           # this file
```

## 2. Database schema

`supabase/schema.sql` defines 13 tables:

- **Workspace**: `users`, `team_members`, `tasks`, `task_dependencies`, `prompts`, `roadmap`,
  `api_endpoints`, `security_tests`, `documents`, `activity_logs`, `chat_messages`
- **Product**: `files` (envelope + sha256 + storage key), `shares` (digest-at-rest, password,
  expiry, limits), `access_logs` (ownership-guided audit)

Highlights:

- **RLS on every table.** Files/shares/access_logs are owner-scoped by `auth.uid()` — IDOR is
  structurally impossible.
- `users` row is created by a trigger on `auth.users`.
- `shares.secret_digest` stores `base64url(sha256(secret))` — never the plaintext secret.
- `access_logs` writes only via a `security definer` function, so clients can't forge audit rows.
- Indexes: `tasks(status|week|assignee)`, `activity(created_at desc)`, `shares(digest|file)`,
  `access_logs(file, time)` + `access_logs(action, time)`.

## 3. Setup instructions

```bash
npm install --prefix client
npm install --prefix server
```

Supabase is required. Create a project, run `supabase/schema.sql` (+ optional `seed.sql`),
copy both `.env.example` files and fill the keys. The app starts empty and reads/writes real rows.

## 4. Environment variables

**client/.env** (see `client/.env.example`):

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_AUTH_MODE` | must stay `supabase` for live mode | `supabase` |
| `VITE_SUPABASE_URL` | Reserve.project URL | required |
| `VITE_SUPABASE_ANON_KEY` | anon/publishable key | required |
| `VITE_API_URL` | deployed Express API base (upload/share flows) | — |

**server/.env** (see `server/.env.example`):

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | listen port | `4000` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | verify JWTs + PostgREST + storage | required |
| `STORAGE_BUCKET` | bucket for encrypted blobs | `secure-blobs` |
| `JWT_SECRET` | fallback signer | dev placeholder |
| `MASTER_KEY` | AES-256-GCM envelope key (64 hex) | dev placeholder |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | rate limiting | 60s / 30 |

> **Never commit real keys.** Rotate `MASTER_KEY` and rotate the service key before production.

## 5. Authentication flow

**Real Supabase Auth only.**

1. `AuthContext` wires `supabase.auth.signInWithPassword`, `signUp` (`emailRedirectTo` the
   dashboard), `resetPasswordForEmail`, `signOut` and `onAuthStateChange`.
2. The user's Supabase JWT is used by the client for `public.` tables via RLS anchored on
   `auth.uid()`. New sign-ups land on an empty board.
3. First chat message (or Team profile) auto-creates a `team_members` row linked to the user
   (`ensureCurrentMember`).
4. The Express API verifies the same JWT with `supabase.auth.getUser(token)` for file
   upload/share/download routes.
5. Failed attempts are rate-limited; masked error messages prevent user enumeration.

Without keys the app reports clear "not configured" banners and server routes return
`503 not_configured`.

## 6. Feature explanation

| Page | What it does |
| --- | --- |
| **Landing** | Security-branded marketing / entry point |
| **Login** | Real Supabase sign-in, sign-up and password reset (no demo identities) |
| **Dashboard** | Sprint progress ring, current week & day, active/blocked/upcoming counts, team progress bars, recent activity, sprint timeline |
| **My Tasks** | Kanban board (TODO / IN PROGRESS / REVIEW / DONE), create/edit/assign/delete, priority, due date, dependencies; blocked tasks auto-flagged with the blocking task |
| **Team** | Add/edit/remove real members, role, tasks completed, current task, progress %, git branch, status; cross-stream dependency map |
| **AI Prompts** | Prompt library filterable by member/week/task, each with Copy · Edit · Save · Regenerate · Delete |
| **Prompt Generator** | Inputs (member, role, week, task, tech, AI tool) → detailed prompt that always cites PROJECT_SPEC.md, team architecture, API contract, dependencies |
| **Roadmap** | Week 1 Prototype → Week 2 Security → Week 3 Finalization, with delivery % and "ship all" actions |
| **Architecture** | Graphical Frontend → Backend → (Security + Database) flow + upload/download pipeline |
| **API Contract** | Agreed endpoints with method/auth/body/response/status |
| **Git Workflow** | main → develop → feature branches, merge policy, recent commits |
| **Security Testing** | The 10 vulnerable-path checks with pass/in-progress/pending + coverage ring |
| **Documentation** | 9-section live runbook (overview → deployment) |
| **Team Chat** | Persistent threaded chat stored in `chat_messages` — real messages, no simulation |
| **Settings** | Project, Team, Notification, AI settings persisted to the `settings` table |

**Data layer**: nothing is hard-coded in components. All state flows through
`WorkspaceContext` → Supabase (PostgREST via `@supabase/supabase-js`), mutations go through one
actions API, and every screen ships loading, empty, error and success states.

## 7. How to run locally

```bash
# terminal 1 — client
npm run dev --prefix client        # http://localhost:5173

# terminal 2 — API
npm run dev --prefix server        # http://localhost:4000
```

Log in with a real Supabase account (create one on the Login page). The board starts empty —
add team members on /app/team, then tasks, roadmap, endpoints and tests. Every change is written
to Postgres and shared with anyone signed into the project.

Lint + build checks:

```bash
npm run lint --prefix client
npm run build --prefix client
```

## 8. How to deploy

**Option A — Vercel/Netlify frontend + Railway/Render API (fastest):**

1. Frontend: point build at `client/`, set `VITE_AUTH_MODE=supabase`, add the two Supabase keys.
2. API: deploy `server/`, set `JWT_SECRET`, `MASTER_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
3. Run `supabase/schema.sql` + `seed.sql` in the production project before cutover.

**Option B — Docker production (matches Week 3 tasks):**

- Multi-stage build (node → slim runtime), non-root user, read-only FS, healthcheck on
  `/api/v1/health`.
- TLS termination via Caddy/Nginx with auto-renewing certs, HSTS enabled.
- Encrypted Postgres backup job + restore drill.
- Monitoring on auth-failure spikes and storage errors.

**Cutover checklist:** rotate secrets → run migrations → smoke-test health + auth via
`/api/v1/health` and one login → verify RLS (foreign user can’t see your files) → enable rate
limits → monitor.

## 9. Future AI integration plan

Phase 1 (now): **Prompt generator + library.** Click-through generation grounded in the spec,
with copy/edit/save/regenerate. The stored prompts map to tasks for traceability.

Phase 2 (next): **Live AI assistant inside the workspace.**
- Wire `PromptCard`/generator to real provider APIs (Claude / OpenAI / Gemini) via a server-side
  endpoint (`POST /api/v1/ai/generate`) that keeps API keys server-side.
- Use the same context assembler (`promptTemplates.buildPrompt`) — it already injects
  PROJECT_SPEC, architecture, contract and dependencies.
- Add citations: every generated block tags the exact `taskId`, `KEY` and `PROJECT_SPEC §ref`.

Phase 3 (further out):
- **Smart blockers**: AI suggests the missing dependency when you create a task.
- **Sprint forecasting**: predict week completion from velocity + blocked-state history.
- **Security co-pilot**: AI triages `security_tests` failures against known CWE patterns and
  suggests patches with a human review gate.
- **Chat summarization**: daily digest of `chat_messages` + `activity_logs`.

The seams already exist: `WorkspaceContext` actions, `addChatMessage`,
`updateSecurityTest`, the prompt template engine, and `prompts`/`activity_logs` tables in
Postgres — so each phase is an endpoint + UI, not a re-architecture.