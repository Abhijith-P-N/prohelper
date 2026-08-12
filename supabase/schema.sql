-- ============================================================================
-- SecureSync · Secure File Sharing Platform — PostgreSQL schema (Supabase)
-- Run via the Supabase SQL editor or psql. Enables RLS on every table.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- trusted json helpers kept tiny so app code stays safe
-- ---------------------------------------------------------------------------
create or replace function public.current_user_id()
returns uuid
language sql stable
as $$
  select auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- users (extends supabase.auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', null));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;

create policy "users read own profile"
  on public.users for select
  using (id = public.current_user_id() or is_admin);

create policy "users update own profile"
  on public.users for update
  using (id = public.current_user_id());

-- ---------------------------------------------------------------------------
-- team_members — the four platform specialists
-- ---------------------------------------------------------------------------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  name text not null,
  role text not null,                    -- e.g. 'Frontend & UI/UX'
  branch text not null,                  -- e.g. 'feature/haroon-frontend'
  color text not null default '#00d4a8',
  status text not null default 'online' check (status in ('online', 'away', 'offline')),
  focus text,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "team members readable by authenticated users"
  on public.team_members for select
  using (auth.role() = 'authenticated');

create policy "team members managed by admins"
  on public.team_members for all
  using (exists (select 1 from public.users u where u.id = public.current_user_id() and u.is_admin))
  with check (exists (select 1 from public.users u where u.id = public.current_user_id() and u.is_admin));

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,              -- human reference e.g. 'T07'
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in-progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  assignee_id uuid references public.team_members (id) on delete set null,
  week smallint not null check (week between 1 and 3),
  due_date date,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "tasks readable by authenticated users"
  on public.tasks for select
  using (auth.role() = 'authenticated');

create policy "tasks writable by authenticated users"
  on public.tasks for insert
  with check (auth.role() = 'authenticated');

create policy "tasks updated by authenticated users"
  on public.tasks for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "tasks deletable by admins"
  on public.tasks for delete
  using (exists (select 1 from public.users u where u.id = public.current_user_id() and u.is_admin));

create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_week on public.tasks (week);
create index if not exists idx_tasks_assignee on public.tasks (assignee_id);

-- ---------------------------------------------------------------------------
-- task_dependencies — one row per "task → depends on task" edge
-- ---------------------------------------------------------------------------
create table if not exists public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  depends_on_id uuid not null references public.tasks (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, depends_on_id),
  check (task_id <> depends_on_id)
);

alter table public.task_dependencies enable row level security;

create policy "dependencies readable by authenticated users"
  on public.task_dependencies for select
  using (auth.role() = 'authenticated');

create policy "dependencies writable by authenticated users"
  on public.task_dependencies for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- prompts — saved AI coding prompts
-- ---------------------------------------------------------------------------
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.team_members (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  week smallint check (week between 1 and 3),
  title text not null,
  ai_tool text not null default 'Claude (Copilot)',
  prompt text not null,
  saved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prompts enable row level security;
create policy "prompts readable by authenticated users" on public.prompts for select using (auth.role() = 'authenticated');
create policy "prompts writable by authenticated users" on public.prompts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- roadmap
-- ---------------------------------------------------------------------------
create table if not exists public.roadmap (
  id uuid primary key default gen_random_uuid(),
  week smallint not null check (week between 1 and 3),
  theme text not null,
  goal text not null,
  status text not null default 'pending' check (status in ('done', 'in-progress', 'pending')),
  milestones text[] not null default '{}',
  planned date,
  created_at timestamptz not null default now()
);

alter table public.roadmap enable row level security;
create policy "roadmap readable by authenticated users" on public.roadmap for select using (auth.role() = 'authenticated');
create policy "roadmap writable by authenticated users" on public.roadmap for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- api_endpoints — agreed contract
-- ---------------------------------------------------------------------------
create table if not exists public.api_endpoints (
  id uuid primary key default gen_random_uuid(),
  method text not null check (method in ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  name text not null,
  path text not null,
  purpose text not null default '',
  auth text not null default 'Public',
  body text[] not null default '{}',
  response text not null default '',
  status text not null default 'approved' check (status in ('approved', 'proposed')),
  created_at timestamptz not null default now()
);

alter table public.api_endpoints enable row level security;
create policy "endpoints readable by authenticated users" on public.api_endpoints for select using (auth.role() = 'authenticated');
create policy "endpoints writable by authenticated users" on public.api_endpoints for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- security_tests — vulnerable-path checklist
-- ---------------------------------------------------------------------------
create table if not exists public.security_tests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  status text not null default 'pending' check (status in ('pass', 'in-progress', 'pending')),
  severity text not null default 'high' check (severity in ('low', 'medium', 'high', 'critical')),
  description text not null default '',
  tested_by uuid references public.team_members (id) on delete set null,
  tested_on date,
  created_at timestamptz not null default now()
);

alter table public.security_tests enable row level security;
create policy "security tests readable by authenticated users" on public.security_tests for select using (auth.role() = 'authenticated');
create policy "security tests writable by authenticated users" on public.security_tests for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  section text not null unique,
  title text not null,
  content text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;
create policy "documents readable by authenticated users" on public.documents for select using (auth.role() = 'authenticated');
create policy "documents writable by authenticated users" on public.documents for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- activity_logs — workspace audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.team_members (id) on delete set null,
  action text not null,
  target text not null default '',
  type text not null default 'task',
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;
create policy "activity readable by authenticated users" on public.activity_logs for select using (auth.role() = 'authenticated');
create policy "activity insertable by authenticated users" on public.activity_logs for insert with check (auth.role() = 'authenticated');

create index if not exists idx_activity_created on public.activity_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.team_members (id) on delete cascade,
  text text not null,
  kind text not null default 'message' check (kind in ('message', 'system')),
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;
create policy "chat readable by authenticated users" on public.chat_messages for select using (auth.role() = 'authenticated');
create policy "chat insertable by authenticated users" on public.chat_messages for insert with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- helper used by RLS on product tables
-- ---------------------------------------------------------------------------
create or replace function public.is_admin_user()
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.users where id = public.current_user_id()), false);
$$;

-- ---------------------------------------------------------------------------
-- Product tables (Secure File Sharing Platform)
-- ---------------------------------------------------------------------------
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  size bigint not null default 0,
  mime text,
  sha256 text not null,                          -- integrity fingerprint
  envelope jsonb not null,                       -- AES-256-GCM metadata/ciphertext envelope
  storage_key text not null,                     -- object-storage key (uuid-ish, no user input)
  download_count bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.files enable row level security;

create policy "files owner select"
  on public.files for select
  using (owner_id = public.current_user_id() or is_admin_user());

create policy "files owner insert"
  on public.files for insert
  with check (owner_id = public.current_user_id());

create policy "files owner update"
  on public.files for update
  using (owner_id = public.current_user_id());

create policy "files owner delete"
  on public.files for delete
  using (owner_id = public.current_user_id());

create index if not exists idx_files_owner on public.files (owner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- shares — controlled access to files (password / expiry / download limits)
-- ---------------------------------------------------------------------------
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files (id) on delete cascade,
  owner_id uuid not null references public.users (id) on delete cascade,
  secret_digest text not null unique,            -- base64url(sha256(secret)) — never the secret
  password_scrypt text,                          -- scrypt('salt:hash') when password protected
  expires_at timestamptz,
  max_downloads integer check (max_downloads is null or max_downloads between 1 and 100),
  downloads_used integer not null default 0,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.shares enable row level security;

create policy "shares owner select"
  on public.shares for select
  using (owner_id = public.current_user_id() or is_admin_user());

create policy "shares owner write"
  on public.shares for all
  using (owner_id = public.current_user_id())
  with check (owner_id = public.current_user_id());

create index if not exists idx_shares_digest on public.shares (secret_digest);
create index if not exists idx_shares_file on public.shares (file_id);

-- ---------------------------------------------------------------------------
-- access_logs — auditability rule (PROJECT_SPEC §2.6)
-- ---------------------------------------------------------------------------
create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references public.files (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  action text not null check (action in ('upload', 'download', 'denied')),
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.access_logs enable row level security;

create policy "access logs owner read"
  on public.access_logs for select
  using (file_id in (select id from public.files where owner_id = public.current_user_id()) or is_admin_user());

-- server role insert (service key) via security definer helper
create or replace function public.write_access_log(
  p_file_id uuid, p_actor uuid, p_action text, p_ip inet, p_ua text, p_meta jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.access_logs (file_id, actor_user_id, action, ip_address, user_agent, metadata)
  values (p_file_id, p_actor, p_action, p_ip, p_ua, p_meta);
end;
$$;

create index if not exists idx_access_logs_file_time on public.access_logs (file_id, created_at desc);
create index if not exists idx_access_logs_action on public.access_logs (action, created_at desc);

-- ---------------------------------------------------------------------------
-- settings — per-user UI/workspace preferences (jsonb buckets)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  project jsonb not null default '{}'::jsonb,
  team jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  ai jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "settings owner select"
  on public.settings for select
  using (user_id = public.current_user_id());

create policy "settings owner insert"
  on public.settings for insert
  with check (user_id = public.current_user_id());

create policy "settings owner update"
  on public.settings for update
  using (user_id = public.current_user_id());