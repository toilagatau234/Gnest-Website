-- Gnest Website - Supabase foundation schema (Idempotent Version)
-- Run this in Supabase SQL editor after creating a project.

create extension if not exists "pgcrypto";

-- Enum Type Creations (Standard SQL statements to bypass PL/pgSQL permission restrictions)
-- Note: If you run this script on an existing database, these may throw "already exists" errors.
-- In that case, you can ignore the errors or run `DROP TYPE IF EXISTS public.<name> CASCADE;` first.
create type public.admin_role as enum ('super_admin', 'admin', 'editor', 'viewer');
create type public.category_type as enum ('product', 'service');
create type public.inquiry_status as enum ('new', 'contacted', 'quoted', 'closed', 'spam');


-- Common updated_at helper function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Admin Users Table
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.admin_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Internal Private Schema
create schema if not exists app_private;

-- Is Admin Verification Function
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

-- Is Super Admin Verification Function
create or replace function app_private.is_super_admin()
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
      and role = 'super_admin'
  );
$$;

-- 3. Categories Table
create table if not exists public.categories (
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

-- 4. Products Table
create table if not exists public.products (
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

-- 5. Product Images Table
create table if not exists public.product_images (
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

-- 6. Product Bulk Discounts Table
create table if not exists public.product_bulk_discounts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  min_quantity integer not null,
  price_per_unit numeric(12, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint product_bulk_discounts_min_quantity_check check (min_quantity > 0)
);

-- 7. Sales Contacts Table
create table if not exists public.sales_contacts (
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

-- 8. Job Vacancies Table
create table if not exists public.job_vacancies (
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

-- 9. Inquiries Table
create table if not exists public.inquiries (
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

-- 10. Site Contents Table
create table if not exists public.site_contents (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. Audit Logs Table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Idempotent Indexes
create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists categories_slug_idx on public.categories(slug);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_created_at_id_idx on public.products(created_at desc, id desc);
create index if not exists products_status_created_at_idx on public.products(is_active, created_at desc, id desc);
create index if not exists products_category_status_created_at_idx on public.products(category_id, is_active, created_at desc, id desc);
create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_bulk_discounts_product_id_idx on public.product_bulk_discounts(product_id);
create index if not exists inquiries_status_idx on public.inquiries(status);

-- Idempotent Triggers Setup (DROP before CREATE ensures no errors)
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_sales_contacts_updated_at on public.sales_contacts;
create trigger set_sales_contacts_updated_at
before update on public.sales_contacts
for each row execute function public.set_updated_at();

drop trigger if exists set_job_vacancies_updated_at on public.job_vacancies;
create trigger set_job_vacancies_updated_at
before update on public.job_vacancies
for each row execute function public.set_updated_at();

drop trigger if exists set_inquiries_updated_at on public.inquiries;
create trigger set_inquiries_updated_at
before update on public.inquiries
for each row execute function public.set_updated_at();

drop trigger if exists set_site_contents_updated_at on public.site_contents;
create trigger set_site_contents_updated_at
before update on public.site_contents
for each row execute function public.set_updated_at();

-- RLS Enforcement
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

-- Base Schema Grants
grant usage on schema public to anon, authenticated;
grant usage on schema app_private to anon, authenticated;
grant execute on function app_private.is_admin() to anon, authenticated;
grant execute on function app_private.is_super_admin() to anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.product_bulk_discounts, public.sales_contacts, public.job_vacancies, public.site_contents to anon, authenticated;
grant insert on public.inquiries to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Safe Idempotent Row-Level Security Policies (DROP before CREATE)

-- Categories
drop policy if exists "Public read active categories" on public.categories;
create policy "Public read active categories"
on public.categories for select
using (is_active = true);

drop policy if exists "Admin manage categories" on public.categories;
create policy "Admin manage categories"
on public.categories for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

-- Products
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
on public.products for select
using (is_active = true);

drop policy if exists "Admin manage products" on public.products;
create policy "Admin manage products"
on public.products for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

-- Product Images
drop policy if exists "Public read active product images" on public.product_images;
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

drop policy if exists "Admin manage product images" on public.product_images;
create policy "Admin manage product images"
on public.product_images for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

-- Bulk Discounts
drop policy if exists "Public read active bulk discounts" on public.product_bulk_discounts;
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

drop policy if exists "Admin manage bulk discounts" on public.product_bulk_discounts;
create policy "Admin manage bulk discounts"
on public.product_bulk_discounts for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

-- Sales Contacts
drop policy if exists "Public read active sales contacts" on public.sales_contacts;
create policy "Public read active sales contacts"
on public.sales_contacts for select
using (is_active = true);

drop policy if exists "Admin manage sales contacts" on public.sales_contacts;
create policy "Admin manage sales contacts"
on public.sales_contacts for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

-- Job Vacancies
drop policy if exists "Public read active job vacancies" on public.job_vacancies;
create policy "Public read active job vacancies"
on public.job_vacancies for select
using (is_active = true);

drop policy if exists "Admin manage job vacancies" on public.job_vacancies;
create policy "Admin manage job vacancies"
on public.job_vacancies for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

-- Inquiries
drop policy if exists "Public insert inquiries" on public.inquiries;
create policy "Public insert inquiries"
on public.inquiries for insert
with check (true);

drop policy if exists "Admin read inquiries" on public.inquiries;
create policy "Admin read inquiries"
on public.inquiries for select
to authenticated
using (app_private.is_admin());

drop policy if exists "Admin update inquiries" on public.inquiries;
create policy "Admin update inquiries"
on public.inquiries for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

-- Site Contents
drop policy if exists "Public read active site contents" on public.site_contents;
create policy "Public read active site contents"
on public.site_contents for select
using (is_active = true);

drop policy if exists "Admin manage site contents" on public.site_contents;
create policy "Admin manage site contents"
on public.site_contents for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

-- Profiles
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or app_private.is_admin());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Admin manage profiles" on public.profiles;
create policy "Admin manage profiles"
on public.profiles for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

-- Admin Users
drop policy if exists "Admin read admin users" on public.admin_users;
create policy "Admin read admin users"
on public.admin_users for select
to authenticated
using (app_private.is_admin());

drop policy if exists "Super admin manage admin users" on public.admin_users;
create policy "Super admin manage admin users"
on public.admin_users for all
to authenticated
using (app_private.is_super_admin())
with check (app_private.is_super_admin());

-- Audit Logs
drop policy if exists "Admin read audit logs" on public.audit_logs;
create policy "Admin read audit logs"
on public.audit_logs for select
to authenticated
using (app_private.is_admin());

drop policy if exists "Admin insert audit logs" on public.audit_logs;
create policy "Admin insert audit logs"
on public.audit_logs for insert
to authenticated
with check (app_private.is_admin());

-- 12. Promotional Banners Table
create table if not exists public.promotional_banners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  content text not null,
  link_url text,
  position text not null default 'top_bar',
  image_desktop_url text,
  image_mobile_url text,
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for updated_at
drop trigger if exists set_promotional_banners_updated_at on public.promotional_banners;
create trigger set_promotional_banners_updated_at
before update on public.promotional_banners
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.promotional_banners enable row level security;

-- RLS Policies
drop policy if exists "Public read active promotional banners" on public.promotional_banners;
create policy "Public read active promotional banners"
on public.promotional_banners for select
using (is_active = true);

drop policy if exists "Admin manage promotional banners" on public.promotional_banners;
create policy "Admin manage promotional banners"
on public.promotional_banners for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

-- Grants
grant select on public.promotional_banners to anon, authenticated;

