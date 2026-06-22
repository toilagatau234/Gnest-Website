-- Revoke references and trigger permissions on public.product_bulk_discounts from anon and authenticated roles
revoke references, trigger on table public.product_bulk_discounts from anon, authenticated;
