-- Enable Row Level Security (RLS) on public.product_bulk_discounts
alter table public.product_bulk_discounts enable row level security;

-- Revoke all write permissions from anon and authenticated roles on the table
revoke insert, update, delete, truncate on table public.product_bulk_discounts from anon, authenticated;

-- Ensure select permissions are explicitly granted
grant select on table public.product_bulk_discounts to anon, authenticated;

-- Drop existing policies if they exist, then recreate them to enforce strict rules
drop policy if exists "Public read active bulk discounts" on public.product_bulk_discounts;
create policy "Public read active bulk discounts"
on public.product_bulk_discounts
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.products
    where products.id = product_bulk_discounts.product_id
    and products.is_active = true
  )
);

drop policy if exists "Admin manage bulk discounts" on public.product_bulk_discounts;
create policy "Admin manage bulk discounts"
on public.product_bulk_discounts
for all
to authenticated
using (
  app_private.is_admin()
)
with check (
  app_private.is_admin()
);
