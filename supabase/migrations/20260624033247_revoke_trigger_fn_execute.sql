-- set_updated_at() is a trigger function only; it is invoked by the trigger system as the
-- table owner and never needs to be callable via PostgREST (/rest/v1/rpc/set_updated_at).
-- Revoke EXECUTE from the API roles to remove it from the exposed surface (clears the
-- "anon/authenticated can execute SECURITY DEFINER function" advisor warnings).

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
revoke all on function public.set_updated_at() from authenticated;
