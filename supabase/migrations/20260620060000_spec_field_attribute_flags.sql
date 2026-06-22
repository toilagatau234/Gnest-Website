-- ============================================================
-- Attribute Definition flags (Phase 4)
-- Make product_spec_fields fully describe each attribute so the
-- import + catalog layers stay schema-driven (no code per type).
-- ============================================================

alter table public.product_spec_fields
  add column if not exists is_searchable boolean not null default false,
  add column if not exists is_sortable   boolean not null default false,
  add column if not exists is_multiple   boolean not null default false;

-- Backfill is_multiple from existing type === 'multi_select'
update public.product_spec_fields
set is_multiple = true
where type = 'multi_select' and is_multiple = false;
