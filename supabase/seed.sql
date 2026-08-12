-- ============================================================================
-- SecureSync — DAY-0 SEED (run AFTER supabase/schema.sql)
-- Bootstrap for the Secure File Sharing Platform sprint.
--
--  • Team members, roadmap, full 51-task backlog, dependencies
--  • API contract, security checklist, runbook docs
--  • EVERYTHING starts at zero: all tasks TODO, roadmap PENDING,
--    security tests PENDING, no activity, no chat, no prompts.
--
--  Idempotent: guarded inserts, safe to re-run.
-- ============================================================================

begin;

-- ── Team members ─────────────────────────────────────────────────────────────
insert into public.team_members (name, role, branch, color, status, focus)
select t.name, t.role, t.branch, t.color, 'online', t.focus
from (values
  ('Haroon', 'Frontend & UI/UX',           'feature/haroon-frontend', '#4ea3ff', 'Upload UI'),
  ('Azin', 'Backend & API',              'feature/azin-backend',    '#a78bfa', 'Authentication'),
  ('Adhil', 'Security & Encryption',      'feature/adhil-security',  '#00d4a8', 'Encryption architecture'),
  ('Abhi',  'Database, Storage & DevOps', 'feature/abhi-database',   '#f5a524', 'Database setup')
) as t(name, role, branch, color, focus)
where not exists (select 1 from public.team_members where name = t.name and role = t.role);

insert into public.roadmap (week, theme, goal, status, milestones, planned)
select t.week, t.theme, t.goal, 'pending', t.milestones, t.planned::date
from (values
  (1, 'Prototype', 'Working upload → encrypt → store → download loop with auth.',
   array['Auth + user API','Upload/download API + storage','Encryption architecture + hashes','Dashboard + upload UI']::text[],
   '2026-08-19'),
  (2, 'Security', 'Share controls, AES-256-GCM, hardened tokens, revocation, audit logs.',
   array['Share API + UI','AES-256-GCM + SHA-256 verification','Password / expiry / download limits','Access logs + encrypted storage']::text[],
   '2026-08-26'),
  (3, 'Finalization', 'Pentest, threat model, hardening and production deployment.',
   array['Rate limiting + Helmet + validation','Penetration testing + audit','HTTPS + Docker production','Backup + monitoring']::text[],
   '2026-09-02')
) as t(week, theme, goal, milestones, planned)
where not exists (select 1 from public.roadmap where week = 1);

-- ── Tasks (all TODO — nothing completed yet) ────────────────────────────────
insert into public.tasks (key, title, description, status, priority, week, due_date, tags, assignee_id)
select t.key, t.title, t.description, 'todo', t.priority, t.week, t.due::date, string_to_array(t.tags, ','), tm.id
from (values
  -- Week 1 · Prototype
  ('T01','Landing page','Hero, value props and security-first messaging for the platform landing page.','high',1,'2026-08-13','frontend,marketing,design','Haroon'),
  ('T02','Login','Login form wired to the auth flow with error and loading states.','high',1,'2026-08-14','frontend,auth','Haroon'),
  ('T03','Registration','Sign-up screen with validation, weak-password hints and post-registration redirect.','high',1,'2026-08-14','frontend,auth','Haroon'),
  ('T04','Dashboard','Post-login dashboard shell linking to upload, shares and audit views.','high',1,'2026-08-15','frontend,dashboard','Haroon'),
  ('T05','Upload UI','Drag-and-drop upload zone with progress, integrity hash display and success state.','high',1,'2026-08-18','frontend,upload','Haroon'),

  ('T06','Express setup','Express 4 app shell, middleware wiring, error handler and health endpoint.','high',1,'2026-08-13','backend,infra','Azin'),
  ('T07','Authentication','Sign-up / sign-in / refresh endpoints issuing tokens; scrypt password hashing.','critical',1,'2026-08-14','backend,auth','Azin'),
  ('T08','User API','User profile CRUD and account endpoints behind the auth middleware.','medium',1,'2026-08-15','backend,api','Azin'),
  ('T09','Upload API','Multipart upload endpoint that hands the stream to the encryption layer and storage.','critical',1,'2026-08-17','backend,upload,api','Azin'),
  ('T10','Download API','Streamed download endpoint that decrypts on the fly and enforces share controls.','high',1,'2026-08-18','backend,api','Azin'),

  ('T11','SHA-256 design','Spec for generating and storing SHA-256 fingerprints of every uploaded file.','high',1,'2026-08-14','security,design','Adhil'),
  ('T12','Secure token generation','Share-token scheme: store only the SHA-256 digest, expose unguessable secrets.','critical',1,'2026-08-16','security,tokens','Adhil'),
  ('T13','Encryption architecture','AES-256-GCM envelope design: per-file keys, master-key wrapping, nonce/IV handling.','critical',1,'2026-08-17','security,encryption,design','Adhil'),

  ('T14','Database setup','Supabase project, connection pool, RLS bootstrap and migration pipeline.','high',1,'2026-08-13','database,infra','Abhi'),
  ('T15','Storage setup','Object-storage bucket layout for encrypted blobs with naming + retention rules.','high',1,'2026-08-14','storage,infra','Abhi'),
  ('T16','User schema','users table, profiles, supabase.auth linkage and RLS policies.','high',1,'2026-08-15','database,schema','Abhi'),
  ('T17','File schema','files + shares tables: envelope metadata, hashes, expiry, download limits.','high',1,'2026-08-16','database,schema','Abhi'),
  ('T18','Docker','Dev docker-compose for postgres + storage emulator for local iteration.','medium',1,'2026-08-18','devops,infra','Abhi'),

  -- Week 2 · Security
  ('T19','Share UI','Create-share modal with controls for password, expiry and download limit.','high',2,'2026-08-21','frontend,sharing','Haroon'),
  ('T20','Password protection UI','Prompt surface for password-protected shares with reveal/save UX.','high',2,'2026-08-24','frontend,sharing','Haroon'),
  ('T21','Expiration UI','DateTime picker for share expiry, countdown display and expired-state copy.','medium',2,'2026-08-25','frontend,sharing','Haroon'),
  ('T22','Download-limit UI','Counter UI showing remaining downloads and reach-limit messaging.','medium',2,'2026-08-26','frontend,sharing','Haroon'),

  ('T23','Share API','Share creation/resolution endpoints honoring password, expiry and limit rules.','critical',2,'2026-08-22','backend,sharing,api','Azin'),
  ('T24','Authorization','Ownership checks on every file/share route — no cross-tenant reads (IDOR closure).','critical',2,'2026-08-24','backend,auth,security','Azin'),
  ('T25','Expiration','Server-side expiry enforcement + cleanup of expired shares.','high',2,'2026-08-25','backend,sharing','Azin'),
  ('T26','Download limits','Atomic decrement of download counters under concurrent access.','high',2,'2026-08-26','backend,sharing','Azin'),
  ('T27','Revocation','Revoke endpoint that nulls share tokens on the DB and rejects on read.','high',2,'2026-08-26','backend,sharing','Azin'),

  ('T28','AES-256-GCM','Core encrypt/decrypt module with authenticated ciphertext and correct nonce handling.','critical',2,'2026-08-21','security,encryption','Adhil'),
  ('T29','SHA-256 verification','Verify decrypted bytes against stored fingerprint before streaming.','high',2,'2026-08-23','security,integrity','Adhil'),
  ('T30','Secure tokens','Token issuance/redeem module — digest-at-rest, constant-time compare.','critical',2,'2026-08-22','security,tokens','Adhil'),
  ('T31','Security testing','Targeted test suite over crypto + token paths (round-trips, tamper, replay).','high',2,'2026-08-25','security,testing','Adhil'),

  ('T32','Encrypted storage','Write/read path for AES-encrypted blobs; envelope metadata in Postgres.','critical',2,'2026-08-23','storage,security','Abhi'),
  ('T33','Access logs','Audit table capturing uploads, downloads and denied attempts with context.','high',2,'2026-08-24','database,audit','Abhi'),
  ('T34','Backup','Scheduled encrypted backups of the database + blob metadata.','high',2,'2026-08-26','devops,database','Abhi'),
  ('T35','Database optimization','Indexes on token/hash lookups, table partitioning review for audit logs.','medium',2,'2026-08-26','database,performance','Abhi'),

  -- Week 3 · Finalization
  ('T36','Admin dashboard','Ops view: storage usage, failed attempts, active shares and alerts.','high',3,'2026-08-28','frontend,admin','Haroon'),
  ('T37','Security logs UI','Audit log explorer with filters, severity coloring and export.','medium',3,'2026-08-31','frontend,audit','Haroon'),
  ('T38','Responsive design','Full layout pass for mobile/tablet; keyboard + screen-reader audit.','medium',3,'2026-08-31','frontend,a11y','Haroon'),
  ('T39','UI polish','Empty/error/loading states, micro-animations, final design system pass.','low',3,'2026-09-01','frontend,design','Haroon'),

  ('T40','Rate limiting','Per-user + per-IP limiters on auth and share endpoints.','critical',3,'2026-08-27','backend,security','Azin'),
  ('T41','Helmet','Security headers: HSTS, CSP, nosniff, referrer policy across all routes.','high',3,'2026-08-28','backend,security','Azin'),
  ('T42','Validation','Schema validation for every request body/query/param; safe file-type checks.','high',3,'2026-08-28','backend,validation','Azin'),
  ('T43','API security','Error-message sanitization, logging of attempts, 401/403 semantics done right.','high',3,'2026-08-29','backend,security','Azin'),

  ('T44','Penetration testing','Guided pentest: auth bypass, token reuse, file-type spoof, path escape.','critical',3,'2026-08-28','security,testing','Adhil'),
  ('T45','Threat modeling','STRIDE walkthrough, updated diagrams, risk register with mitigations.','high',3,'2026-08-31','security,design','Adhil'),
  ('T46','Security audit','Crypto + secret review; verify no plaintext tokens or keys in the repo.','high',3,'2026-09-01','security,audit','Adhil'),

  ('T47','Deployment','Production pipeline: build, migrate, publish blobs, cutover checks.','critical',3,'2026-08-28','devops,deploy','Abhi'),
  ('T48','HTTPS','TLS termination, cert auto-renewal, HSTS and proper cipher suites.','critical',3,'2026-08-31','devops,https','Abhi'),
  ('T49','Docker production setup','Multi-stage image, read-only FS, non-root user, healthchecks.','high',3,'2026-08-31','devops,infra','Abhi'),
  ('T50','Backup','Verifiable restore drill + retention policy for encrypted backups.','high',3,'2026-09-01','devops,backup','Abhi'),
  ('T51','Monitoring','Metrics, alerting on auth failures and storage errors; uptime dashboard.','medium',3,'2026-09-02','devops,monitoring','Abhi')
) as t(key, title, description, priority, week, due, tags, member_key)
join public.team_members tm on tm.name = t.member_key
on conflict (key) do nothing;

-- ── Dependencies ─────────────────────────────────────────────────────────────
insert into public.task_dependencies (task_id, depends_on_id)
select t1.id, t2.id
from (values
  ('T05','T09'), ('T09','T15'), ('T10','T09'), ('T10','T15'),
  ('T28','T09'), ('T19','T23'), ('T20','T23'), ('T20','T28'), ('T21','T25'),
  ('T22','T26'), ('T23','T15'), ('T23','T12'), ('T24','T07'), ('T25','T23'),
  ('T26','T09'), ('T27','T23'), ('T29','T28'), ('T31','T28'), ('T31','T29'),
  ('T32','T28'), ('T32','T15'), ('T33','T32'), ('T34','T33'), ('T35','T32'),
  ('T36','T32'), ('T37','T33'), ('T38','T19'), ('T39','T19'), ('T41','T18'),
  ('T44','T24'), ('T45','T46')
) as d(task_key, dep_key)
join public.tasks t1 on t1.key = d.task_key
join public.tasks t2 on t2.key = d.dep_key
on conflict do nothing;

-- ── API contract ─────────────────────────────────────────────────────────────
insert into public.api_endpoints (method, name, path, purpose, auth, body, response, status)
select t.method, t.name, t.path, t.purpose, t.auth, t.body, t.response, t.status
from (values
  ('POST','Register','/api/v1/auth/register','Create account; returns tokens.','Public',array['email','password','name']::text[],'{ accessToken, refreshToken, user }','approved'),
  ('POST','Login','/api/v1/auth/login','Authenticate and issue tokens.','Public',array['email','password']::text[],'{ accessToken, refreshToken, user }','approved'),
  ('POST','Refresh','/api/v1/auth/refresh','Rotate refresh token; revoke old.','Refresh token',array['refreshToken']::text[],'{ accessToken, refreshToken }','approved'),
  ('POST','Upload file','/api/v1/files/upload','Encrypt + store a file, returns metadata + hash.','Bearer',array['file (multipart)','description?']::text[],'{ fileId, sha256, size, envelope }','approved'),
  ('GET','File metadata','/api/v1/files/:id','Owner metadata view, no content.','Bearer (owner)',array['id']::text[],'{ id, name, size, sha256, createdAt }','approved'),
  ('GET','Download','/api/v1/files/:id/download','Stream decrypted content after verifying hash.','Owner or share',array['id']::text[],'application/octet-stream + X-Sha256','approved'),
  ('POST','Create share','/api/v1/shares','Create share with controls (password/expiry/limit).','Bearer (owner)',array['fileId','password?','expiresAt?','maxDownloads?']::text[],'{ shareToken, secret, url }','approved'),
  ('GET','Resolve share','/api/v1/shares/:token','Validate + hand back download metadata.','Public (token)',array['token']::text[],'{ fileMeta, requiresPassword, expiresAt }','approved'),
  ('DELETE','Revoke share','/api/v1/shares/:token','Owner revokes a share immediately.','Bearer (owner)',array['token']::text[],'204 No Content','approved'),
  ('GET','Audit trail','/api/v1/audit','Owner-scoped access log feed.','Bearer',array['action?','from?','to?']::text[],'{ rows, total, page }','approved'),
  ('GET','Health','/api/v1/health','Service + db reachability probe.','Public',array[]::text[],'{ status, db, uptime }','approved'),
  ('GET','File shares','/api/v1/files/:id/shares','List/manager shares for a file.','Bearer (owner)',array['id']::text[],'{ shares }','proposed')
) as t(method, name, path, purpose, auth, body, response, status)
where not exists (select 1 from public.api_endpoints where path = '/api/v1/auth/register');

-- ── Security testing checklist (nothing passes yet) ─────────────────────────
insert into public.security_tests (name, category, status, severity, description, tested_on)
select t.name, t.category, 'pending', t.severity, t.description, null
from (values
  ('Authentication','Identity','critical','Login brute-force protection, password strength, token issuance verified.'),
  ('Authorization','Access control','critical','Ownership enforcement on files/shares; cross-tenant access probes.'),
  ('IDOR','Access control','critical','Attempts to read/modify resources by mutating IDs of another user.'),
  ('Path traversal','Input handling','high','../ and encoding tricks against download + storage keys rejected.'),
  ('Brute force','Identity','high','Rate-limited login/share-password guessing; lockout thresholds.'),
  ('Token security','Cryptography','critical','Digest-at-rest for share secrets; JWT expiry + rotation verified.'),
  ('File validation','Input handling','high','Magic-byte validation, size ceilings, MIME spoof rejection.'),
  ('Encryption','Cryptography','critical','AES-256-GCM key rotation, nonce uniqueness, tag tamper behavior.'),
  ('Integrity','Cryptography','high','SHA-256 verification before stream; mid-flight tamper detection.'),
  ('Share security','Access control','critical','Password/expiry/limit enforcement, revocation propagation, token masking.')
) as t(name, category, severity, description)
where not exists (select 1 from public.security_tests where name = 'Authentication');

-- ── Documentation runbook ───────────────────────────────────────────────────
insert into public.documents (section, title, content) values
  ('overview','Overview',array['SecureSync is the operational workspace for the Secure File Sharing Platform.','A privacy-first web app where users upload encrypted files and share them with password protection, expiration windows and download limits.']),
  ('architecture','Architecture',array['Frontend (Haroon) → REST API (Azin) → Security + Encryption (Adhil) → Database + Storage (Abhi).','Upload: AES-256-GCM encrypt → SHA-256 fingerprint → encrypted blob → envelope metadata to Postgres.','Download: resolve share/owner → enforce controls → decrypt → verify → stream.']),
  ('database','Database',array['users, team_members, tasks, task_dependencies, prompts, roadmap, api_endpoints, security_tests, documents, activity_logs, chat_messages, files, shares, access_logs, settings.','Supabase Postgres with Row Level Security on every table.']),
  ('api','API',array['Base URL: /api/v1. Auth via Authorization: Bearer <accessToken>; share tokens digest-at-rest.','Errors: { error: { code, message } }, never leak internals.']),
  ('security','Security',array['Encryption at rest — AES-256-GCM.','Integrity — SHA-256 verified before streaming.','Authorization — ownership enforced server-side; no IDOR.','Headers — Helmet + CSP + HSTS. Rate limits on auth + share endpoints.']),
  ('encryption','Encryption',array['AES-256-GCM envelope: 12-byte IV || 16-byte authTag || ciphertext.','Per-file key generated at upload, wrapped with a master key from the environment.','Share secret stored only as base64url(sha256(secret)).']),
  ('setup','Setup',array['Copy client/.env.example and server/.env.example.','npm install --prefix client && npm install --prefix server.','Run the seed, then start both dev servers.']),
  ('testing','Testing',array['API happy-path + negative tests per endpoint (auth, share, upload, download).','Crypto round-trip + tamper tests.','The Security Testing page tracks the 10 vulnerable-path checks.']),
  ('deployment','Deployment',array['Docker multi-stage build, non-root user, read-only FS.','TLS termination with auto-renewing certs; HSTS enabled.','Encrypted backups with restore drill; monitoring on auth failures + storage errors.'])
on conflict (section) do nothing;

commit;