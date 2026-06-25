-- Harden public inquiry submissions (mirrors 20260609143000_harden_newsletter_leads_grants.sql).
--
-- Problem: anon had INSERT on public.inquiries plus a `with check (true)` policy, so the
-- anti-spam controls in app/actions/inquiries.ts (honeypot, rate limit, product verification)
-- could be bypassed entirely by calling PostgREST directly with the public anon key.
--
-- Fix: revoke direct INSERT from anon/authenticated and drop the public-insert policy.
-- Inquiries are now written exclusively through the service-role client in
-- lib/services/inquiries.ts (createInquiry), which only runs after server-side validation.
-- Admin read/update policies are left untouched.

revoke insert on table public.inquiries from anon;
revoke insert on table public.inquiries from authenticated;

drop policy if exists "Public insert inquiries" on public.inquiries;
