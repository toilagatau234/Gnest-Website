-- Replace the O(n) round-robin inquiry assignment (which fetched every open inquiry and
-- counted in JS, with a race between concurrent submissions) with a single set-based query
-- that returns the active agent carrying the fewest open inquiries. Service-role only, since
-- inquiries are created by the service-role client in lib/services/inquiries.ts.

create or replace function public.pick_least_loaded_agent()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select a.id
  from public.admin_users a
  left join (
    select assigned_to, count(*) as open_count
    from public.inquiries
    where status in ('new', 'contacted', 'quoted') and assigned_to is not null
    group by assigned_to
  ) o on o.assigned_to = a.id
  where a.is_active = true
    and a.role in ('super_admin', 'admin', 'editor')
  order by coalesce(o.open_count, 0) asc, a.created_at asc
  limit 1;
$$;

revoke all on function public.pick_least_loaded_agent() from public;
revoke all on function public.pick_least_loaded_agent() from anon;
revoke all on function public.pick_least_loaded_agent() from authenticated;
grant execute on function public.pick_least_loaded_agent() to service_role;
