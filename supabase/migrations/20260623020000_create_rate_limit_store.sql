-- Durable, cross-instance rate-limit store to replace the in-memory limiter in
-- lib/services/rate-limit.ts (which resets on cold start and is per-instance on serverless).
--
-- The table is written only by the service-role client (RLS-exempt) through the
-- public.check_rate_limit() RPC, which atomically prunes expired hits, counts recent hits and
-- records a new hit in a single round-trip. anon/authenticated have no access.

create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  rule text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_lookup_idx
  on public.rate_limit_hits (rule, identifier, created_at desc);

alter table public.rate_limit_hits enable row level security;
-- No policies on purpose: only the service role (which bypasses RLS) touches this table.
revoke all on table public.rate_limit_hits from anon;
revoke all on table public.rate_limit_hits from authenticated;

-- Atomic check-and-record. Returns true when the identifier is already at/over the limit
-- within the window (i.e. the request should be rejected); otherwise records the hit and
-- returns false. Lives in public so PostgREST/supabase-js can call it via .rpc(), but EXECUTE
-- is restricted to service_role so it is not part of the public/anon API surface.
create or replace function public.check_rate_limit(
  p_rule text,
  p_identifier text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz := now() - make_interval(secs => p_window_seconds);
  v_count integer;
begin
  if p_identifier is null or p_identifier = '' or p_limit is null or p_limit <= 0 then
    return false;
  end if;

  -- Prune expired hits for this key so the table stays small without a separate cron job.
  delete from public.rate_limit_hits
   where rule = p_rule and identifier = p_identifier and created_at < v_cutoff;

  select count(*) into v_count
    from public.rate_limit_hits
   where rule = p_rule and identifier = p_identifier and created_at >= v_cutoff;

  if v_count >= p_limit then
    return true;
  end if;

  insert into public.rate_limit_hits (rule, identifier) values (p_rule, p_identifier);
  return false;
end;
$$;

revoke all on function public.check_rate_limit(text, text, integer, integer) from public;
revoke all on function public.check_rate_limit(text, text, integer, integer) from anon;
revoke all on function public.check_rate_limit(text, text, integer, integer) from authenticated;
grant execute on function public.check_rate_limit(text, text, integer, integer) to service_role;
