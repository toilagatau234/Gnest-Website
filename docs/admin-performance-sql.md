# Admin Performance Indexes

Run the SQL below in the Supabase SQL Editor (or via `supabase db push` once a migrations folder is set up).
All statements use `CREATE INDEX IF NOT EXISTS` so they are safe to re-run.

> **Already covered by `supabase/schema.sql`** (skip these):
> `categories_parent_id_idx`, `categories_slug_idx`, `products_category_id_idx`,
> `products_slug_idx`, `product_images_product_id_idx`,
> `product_bulk_discounts_product_id_idx`, `inquiries_status_idx`.
> `products.slug` and `categories.slug` also carry implicit indexes from their UNIQUE constraints.

---

```sql
-- ============================================================
-- Gnest Admin Performance Indexes
-- Safe to run on an existing database (IF NOT EXISTS guards).
-- ============================================================

-- Products
create index if not exists products_is_active_idx       on public.products(is_active);
create index if not exists products_created_at_idx      on public.products(created_at desc);
create index if not exists products_updated_at_idx      on public.products(updated_at desc);
create index if not exists products_stock_idx           on public.products(stock);
create index if not exists products_cat_active_sort_idx  on public.products(category_id, is_active, created_at desc, id desc);

-- Categories
create index if not exists categories_is_active_idx     on public.categories(is_active);
create index if not exists categories_sort_order_idx    on public.categories(sort_order);

-- Product Images (composite — covers single-column product_id queries too)
create index if not exists product_images_product_primary_idx
  on public.product_images(product_id, is_primary);
create index if not exists product_images_product_active_idx
  on public.product_images(product_id, is_active);
create index if not exists product_images_active_primary_order_idx
  on public.product_images(product_id, is_active, is_primary, sort_order);

-- Product Bulk Discounts (composite)
create index if not exists product_bulk_discounts_product_active_idx
  on public.product_bulk_discounts(product_id, is_active);
create index if not exists product_bulk_discounts_product_qty_idx
  on public.product_bulk_discounts(product_id, min_quantity);

-- Audit Logs
create index if not exists audit_logs_created_at_idx    on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_id_idx      on public.audit_logs(actor_id);
create index if not exists audit_logs_action_idx        on public.audit_logs(action);
create index if not exists audit_logs_entity_idx        on public.audit_logs(entity);
create index if not exists audit_logs_entity_id_idx     on public.audit_logs(entity_id);

-- Inquiries
create index if not exists inquiries_created_at_idx     on public.inquiries(created_at desc);
create index if not exists inquiries_assigned_to_idx    on public.inquiries(assigned_to);
create index if not exists inquiries_product_id_idx     on public.inquiries(product_id);

-- Sales Contacts
create index if not exists sales_contacts_sort_order_idx on public.sales_contacts(sort_order);
create index if not exists sales_contacts_is_active_idx  on public.sales_contacts(is_active);

-- Job Vacancies
create index if not exists job_vacancies_sort_order_idx  on public.job_vacancies(sort_order);
create index if not exists job_vacancies_is_active_idx   on public.job_vacancies(is_active);
create index if not exists job_vacancies_created_at_idx  on public.job_vacancies(created_at desc);
```

---

## Future RPC TODOs (do not implement until needed)

```sql
-- TODO: RPC count_products_missing_images
-- Returns count of products that have no rows in product_images,
-- or no row where is_primary = true. Useful for data-quality dashboards.

-- TODO: RPC count_distinct_audit_actors(since timestamptz)
-- Returns count of distinct actor_id values in audit_logs within a time range.
-- Useful for admin activity widgets.

-- TODO: RPC import_products_transactional(rows jsonb)
-- Wraps multi-row product + image inserts in a single transaction
-- so a partial Excel import never leaves orphaned rows.
```
