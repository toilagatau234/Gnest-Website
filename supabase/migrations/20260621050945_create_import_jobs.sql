-- ============================================================
-- Import Job System (Phase 11)
-- Traceable audit trail for every bulk product import.
-- All writes go through the service-role client (bypasses RLS).
-- ============================================================

create table if not exists public.import_jobs (
  id            uuid primary key default gen_random_uuid(),
  file_name     text,
  started_by    uuid references public.admin_users(id) on delete set null,
  mode          text not null default 'v4_upsert',     -- v4_upsert | legacy_insert
  status        text not null default 'running',       -- running | completed | completed_with_errors | failed
  total_rows    integer not null default 0,
  success_count integer not null default 0,
  error_count   integer not null default 0,
  inserted_count integer not null default 0,
  updated_count  integer not null default 0,
  image_count    integer not null default 0,
  metadata      jsonb not null default '{}'::jsonb,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create table if not exists public.import_job_errors (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.import_jobs(id) on delete cascade,
  row_number    integer,
  column_name   text,
  error_code    text,
  error_message text,
  raw_value     text,
  created_at    timestamptz not null default now()
);

create index if not exists import_jobs_started_by_idx   on public.import_jobs(started_by);
create index if not exists import_jobs_started_at_idx   on public.import_jobs(started_at desc);
create index if not exists import_job_errors_job_id_idx on public.import_job_errors(job_id);

alter table public.import_jobs       enable row level security;
alter table public.import_job_errors enable row level security;

-- Admins may read import history; all mutations happen via service-role (bypasses RLS).
drop policy if exists import_jobs_admin_read on public.import_jobs;
create policy import_jobs_admin_read on public.import_jobs
  for select using (app_private.is_admin());

drop policy if exists import_job_errors_admin_read on public.import_job_errors;
create policy import_job_errors_admin_read on public.import_job_errors
  for select using (app_private.is_admin());
