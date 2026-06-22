-- Add is_active column to product_spec_fields and update the public read policy

-- 1. Add is_active column
alter table public.product_spec_fields
  add column if not exists is_active boolean not null default true;

-- 2. Update Public read policy to check both field is_active and parent template is_active
drop policy if exists "Public read spec fields" on public.product_spec_fields;
create policy "Public read spec fields"
  on public.product_spec_fields
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.product_spec_templates t
      where t.id = product_spec_fields.template_id
        and t.is_active = true
    )
  );
