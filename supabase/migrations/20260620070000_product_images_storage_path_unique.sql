-- ============================================================
-- product_images.storage_path UNIQUE (fixes onConflict reliance)
-- The Drive importer upserts by storage_path; without this index
-- the ON CONFLICT (storage_path) clause throws at runtime.
-- ============================================================

-- Remove duplicate storage_path rows (keep newest) before adding the index.
delete from public.product_images a
using public.product_images b
where a.storage_path = b.storage_path
  and a.ctid < b.ctid;

create unique index if not exists product_images_storage_path_key
  on public.product_images (storage_path);

-- Full-specs GIN index to support spec filtering efficiently (Phase 15).
create index if not exists products_specs_gin_idx
  on public.products using gin (specs jsonb_path_ops);
