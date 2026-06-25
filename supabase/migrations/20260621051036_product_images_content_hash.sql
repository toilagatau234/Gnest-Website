-- ============================================================
-- product_images.content_hash (Phase 9 — re-import dedup)
-- Stores the SHA-256 of the uploaded image bytes so a re-import
-- can skip re-uploading images whose content has not changed.
-- Nullable + backfill-free: existing rows simply have no hash and
-- will be (re)hashed the next time they are touched.
-- ============================================================

alter table public.product_images
  add column if not exists content_hash text;

-- Dedup lookups are scoped per product, by hash.
create index if not exists product_images_product_hash_idx
  on public.product_images (product_id, content_hash);
