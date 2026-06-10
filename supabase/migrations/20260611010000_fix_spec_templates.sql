-- Reconcile and fix Phase C.2 product spec templates schema contract

-- 1. Harden the public.set_updated_at() trigger function with fixed search_path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Alter product_spec_templates: rename label to name
alter table public.product_spec_templates rename column label to name;

-- 3. Alter product_spec_fields: rename required to is_required, add is_filterable
alter table public.product_spec_fields rename column required to is_required;
alter table public.product_spec_fields add column is_filterable boolean not null default false;

-- 4. Enable RLS and re-assert security policies
alter table public.product_spec_templates enable row level security;
alter table public.product_spec_fields    enable row level security;

-- Revoke write privileges on these tables from anon and authenticated roles
revoke insert, update, delete, truncate, references, trigger
  on public.product_spec_templates from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.product_spec_fields from anon, authenticated;

-- Grant SELECT privileges to anon and authenticated roles
grant select on public.product_spec_templates to anon, authenticated;
grant select on public.product_spec_fields    to anon, authenticated;

-- Policies for product_spec_templates
drop policy if exists "Public read active spec templates" on public.product_spec_templates;
create policy "Public read active spec templates"
  on public.product_spec_templates
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Admin manage spec templates" on public.product_spec_templates;
create policy "Admin manage spec templates"
  on public.product_spec_templates
  for all
  to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

-- Policies for product_spec_fields
drop policy if exists "Public read spec fields" on public.product_spec_fields;
create policy "Public read spec fields"
  on public.product_spec_fields
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.product_spec_templates t
      where t.id = product_spec_fields.template_id
        and t.is_active = true
    )
  );

drop policy if exists "Admin manage spec fields" on public.product_spec_fields;
create policy "Admin manage spec fields"
  on public.product_spec_fields
  for all
  to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());
