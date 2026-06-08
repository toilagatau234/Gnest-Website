-- Migration: Upgrade promotional_banners to support positions, responsive image URLs, and start/end schedules
alter table public.promotional_banners
  add column if not exists position text not null default 'top_bar',
  add column if not exists image_desktop_url text,
  add column if not exists image_mobile_url text,
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz;
