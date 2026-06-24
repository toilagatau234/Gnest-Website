-- Align Row-Level Security with the app-level RBAC matrix (lib/services/admin/permissions.ts).
--
-- Problem: app_private.is_admin() treats `editor` as an admin, but several tables are
-- restricted to super_admin/admin at the application layer:
--   * site_contents writes  -> SYSTEM_CONFIG_ROLES (super_admin, admin)
--   * audit_logs reads       -> SYSTEM_VIEWER_ROLES (super_admin, admin)
--   * admin_users reads      -> SYSTEM_VIEWER_ROLES (super_admin, admin)
-- Those tables' policies used is_admin(), so an authenticated `editor` could bypass the
-- Server Actions and hit PostgREST directly with the public anon key to read/write them.
--
-- Fix: introduce a mid-tier app_private.is_system_admin() (super_admin/admin only) and use it
-- on those policies. The admin app reads/writes these tables via the service-role client
-- (RLS-exempt), so this change only closes the direct-PostgREST bypass — no app behavior changes.
-- Content tables (products, categories, banners, jobs, sales_contacts, images, bulk_discounts)
-- intentionally stay on is_admin() because editors are allowed to manage them.

create or replace function app_private.is_system_admin()
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
      and role in ('super_admin', 'admin')
  );
$$;

grant execute on function app_private.is_system_admin() to anon, authenticated;

-- site_contents: keep public read (is_active = true); restrict writes to system admins.
drop policy if exists "Admin manage site contents" on public.site_contents;
drop policy if exists "System admin manage site contents" on public.site_contents;
create policy "System admin manage site contents"
on public.site_contents for all
to authenticated
using (app_private.is_system_admin())
with check (app_private.is_system_admin());

-- audit_logs: reading restricted to system admins. INSERT stays is_admin() because every
-- admin action (including editor actions) writes an audit log entry.
drop policy if exists "Admin read audit logs" on public.audit_logs;
create policy "Admin read audit logs"
on public.audit_logs for select
to authenticated
using (app_private.is_system_admin());

-- admin_users: directory read restricted to system admins (matches SYSTEM_VIEWER_ROLES).
-- Management policy ("Super admin manage admin users") already uses is_super_admin() — unchanged.
drop policy if exists "Admin read admin users" on public.admin_users;
create policy "Admin read admin users"
on public.admin_users for select
to authenticated
using (app_private.is_system_admin());
