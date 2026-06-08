-- Migration: Normalize promotional_banners position values and default constraints
update public.promotional_banners
  set position = 'site_top'
  where position = 'top_bar';

update public.promotional_banners
  set position = 'home_after_products'
  where position = 'homepage_slot';

alter table public.promotional_banners 
  alter column position set default 'site_top';
