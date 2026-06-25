-- ============================================================
-- import_job_images (Phase 11)
-- Per-image traceability for every bulk product import.
-- One row per image processed: uploaded, skipped (dedup) or failed.
-- All writes go through the service-role client (bypasses RLS).
-- ============================================================

create table if not exists public.import_job_images (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.import_jobs(id) on delete cascade,
  sku           text,
  filename      text,
  storage_path  text,
  content_hash  text,
  status        text not null default 'uploaded',  -- uploaded | skipped | failed
  error_message text,
  created_at    timestamptz not null default now()
);

create index if not exists import_job_images_job_id_idx on public.import_job_images(job_id);
create index if not exists import_job_images_sku_idx     on public.import_job_images(sku);

alter table public.import_job_images enable row level security;

-- Admins may read import history; all mutations happen via service-role (bypasses RLS).
drop policy if exists import_job_images_admin_read on public.import_job_images;
create policy import_job_images_admin_read on public.import_job_images
  for select using (app_private.is_admin());
