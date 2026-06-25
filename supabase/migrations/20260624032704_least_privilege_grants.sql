-- Least-privilege reset for anon/authenticated table grants.
--
-- Problem: Supabase default privileges grant ALL table privileges (INSERT/SELECT/UPDATE/DELETE/
-- TRUNCATE/REFERENCES/TRIGGER) to anon and authenticated on every public table, so RLS is the
-- ONLY thing standing between an attacker and the data — a single policy mistake = full
-- compromise, and TRUNCATE isn't even governed by RLS.
--
-- Reality of this app: ALL writes (and all admin reads) go through the service-role client,
-- which is RLS-exempt and keeps its own grants. The public site / browser client only ever
-- SELECTs public-readable tables (categories, sales_contacts, products, ...). So anon and
-- authenticated need SELECT on those tables and nothing else.

-- 1. Strip every privilege from anon/authenticated on all existing public tables.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

-- 2. Re-grant SELECT only on the public-readable tables.
grant select on
  public.categories,
  public.products,
  public.product_images,
  public.product_bulk_discounts,
  public.sales_contacts,
  public.job_vacancies,
  public.site_contents,
  public.promotional_banners,
  public.product_spec_templates,
  public.product_spec_fields
to anon, authenticated;

-- 3. Stop future tables (created by postgres via migrations) from auto-granting broad
--    privileges to anon/authenticated. Each migration must grant access explicitly from now on.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on tables from authenticated;
