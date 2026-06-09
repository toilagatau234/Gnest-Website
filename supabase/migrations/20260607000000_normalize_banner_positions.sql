-- Migration: Normalize promotional_banners position values and default constraints
CREATE TABLE IF NOT EXISTS public.promotional_banners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  content text not null,
  link_url text,
  position text not null default 'site_top',
  image_desktop_url text,
  image_mobile_url text,
  start_at timestamptz,
  end_at timestamptz,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS promotional_banners_position_idx ON public.promotional_banners(position);
CREATE INDEX IF NOT EXISTS promotional_banners_active_position_idx ON public.promotional_banners(is_active, position, sort_order);

-- Add grants
GRANT SELECT ON public.promotional_banners TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotional_banners TO authenticated;

-- Existing normalize logic
update public.promotional_banners
  set position = 'site_top'
  where position = 'top_bar';

update public.promotional_banners
  set position = 'home_after_products'
  where position = 'homepage_slot';

alter table public.promotional_banners 
  alter column position set default 'site_top';

