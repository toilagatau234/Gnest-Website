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

-- Add safe policies idempotently
DROP POLICY IF EXISTS "Public read active promotional banners" ON public.promotional_banners;
CREATE POLICY "Public read active promotional banners"
ON public.promotional_banners FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage promotional banners" ON public.promotional_banners;
CREATE POLICY "Admin manage promotional banners"
ON public.promotional_banners FOR ALL
TO authenticated
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

-- Add updated_at trigger if set_updated_at function exists
DROP TRIGGER IF EXISTS set_promotional_banners_updated_at ON public.promotional_banners;
CREATE TRIGGER set_promotional_banners_updated_at
BEFORE UPDATE ON public.promotional_banners
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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
