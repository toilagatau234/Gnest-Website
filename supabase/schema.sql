-- Gnest Website - Supabase foundation schema
-- Run this in Supabase SQL editor after creating a project.

create extension if not exists "pgcrypto";

create type public.admin_role as enum ('super_admin', 'admin', 'editor', 'viewer');
create type public.category_type as enum ('product', 'service');
create type public.inquiry_status as enum ('new', 'contacted', 'quoted', 'closed', 'spam');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.admin_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create schema if not exists app_private;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
      and is_active = true
      and role in ('super_admin', 'admin', 'editor')
  );
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type public.category_type not null default 'product',
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  has_filters boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12, 2),
  stock integer not null default 0,
  specs jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text,
  alt text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.product_bulk_discounts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  min_quantity integer not null,
  price_per_unit numeric(12, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint product_bulk_discounts_min_quantity_check check (min_quantity > 0)
);

create table public.sales_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  phone text not null,
  zalo text,
  avatar_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_vacancies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  location text,
  salary_range text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  product_id uuid references public.products(id) on delete set null,
  message text,
  status public.inquiry_status not null default 'new',
  assigned_to uuid references public.admin_users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_contents (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index categories_parent_id_idx on public.categories(parent_id);
create index categories_slug_idx on public.categories(slug);
create index products_category_id_idx on public.products(category_id);
create index products_slug_idx on public.products(slug);
create index product_images_product_id_idx on public.product_images(product_id);
create index product_bulk_discounts_product_id_idx on public.product_bulk_discounts(product_id);
create index inquiries_status_idx on public.inquiries(status);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_admin_users_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger set_sales_contacts_updated_at
before update on public.sales_contacts
for each row execute function public.set_updated_at();

create trigger set_job_vacancies_updated_at
before update on public.job_vacancies
for each row execute function public.set_updated_at();

create trigger set_inquiries_updated_at
before update on public.inquiries
for each row execute function public.set_updated_at();

create trigger set_site_contents_updated_at
before update on public.site_contents
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_bulk_discounts enable row level security;
alter table public.sales_contacts enable row level security;
alter table public.job_vacancies enable row level security;
alter table public.inquiries enable row level security;
alter table public.site_contents enable row level security;
alter table public.audit_logs enable row level security;

grant usage on schema public to anon, authenticated;
grant usage on schema app_private to anon, authenticated;
grant execute on function app_private.is_admin() to anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.product_bulk_discounts, public.sales_contacts, public.job_vacancies, public.site_contents to anon, authenticated;
grant insert on public.inquiries to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

create policy "Public read active categories"
on public.categories for select
using (is_active = true);

create policy "Admin manage categories"
on public.categories for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Public read active products"
on public.products for select
using (is_active = true);

create policy "Admin manage products"
on public.products for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Public read active product images"
on public.product_images for select
using (
  is_active = true
  and exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.is_active = true
  )
);

create policy "Admin manage product images"
on public.product_images for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Public read active bulk discounts"
on public.product_bulk_discounts for select
using (
  is_active = true
  and exists (
    select 1 from public.products
    where products.id = product_bulk_discounts.product_id
      and products.is_active = true
  )
);

create policy "Admin manage bulk discounts"
on public.product_bulk_discounts for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Public read active sales contacts"
on public.sales_contacts for select
using (is_active = true);

create policy "Admin manage sales contacts"
on public.sales_contacts for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Public read active job vacancies"
on public.job_vacancies for select
using (is_active = true);

create policy "Admin manage job vacancies"
on public.job_vacancies for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Public insert inquiries"
on public.inquiries for insert
with check (true);

create policy "Admin read inquiries"
on public.inquiries for select
to authenticated
using (app_private.is_admin());

create policy "Admin update inquiries"
on public.inquiries for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Public read active site contents"
on public.site_contents for select
using (is_active = true);

create policy "Admin manage site contents"
on public.site_contents for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Users read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or app_private.is_admin());

create policy "Users update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admin manage profiles"
on public.profiles for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admin read admin users"
on public.admin_users for select
to authenticated
using (app_private.is_admin());

create policy "Super admin manage admin users"
on public.admin_users for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where id = auth.uid()
      and is_active = true
      and role = 'super_admin'
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where id = auth.uid()
      and is_active = true
      and role = 'super_admin'
  )
);

create policy "Admin read audit logs"
on public.audit_logs for select
to authenticated
using (app_private.is_admin());

create policy "Admin insert audit logs"
on public.audit_logs for insert
to authenticated
with check (app_private.is_admin());
