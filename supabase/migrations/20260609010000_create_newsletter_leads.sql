-- Create newsletter_leads table
CREATE TABLE IF NOT EXISTS public.newsletter_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  source text not null default 'popup',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS
ALTER TABLE public.newsletter_leads ENABLE ROW LEVEL SECURITY;

-- Admins can read/manage leads
DROP POLICY IF EXISTS "Admin manage newsletter_leads" ON public.newsletter_leads;
CREATE POLICY "Admin manage newsletter_leads"
ON public.newsletter_leads FOR ALL
TO authenticated
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

-- Remove any public insert policies
DROP POLICY IF EXISTS "Public insert newsletter_leads" ON public.newsletter_leads;

-- Grants: Only authenticated admin can read. Anon/authenticated has no direct insert.
GRANT SELECT ON public.newsletter_leads TO authenticated;

-- Create index on email and phone for spam checks
CREATE INDEX IF NOT EXISTS newsletter_leads_email_idx ON public.newsletter_leads(email);
CREATE INDEX IF NOT EXISTS newsletter_leads_phone_idx ON public.newsletter_leads(phone);
CREATE INDEX IF NOT EXISTS newsletter_leads_created_at_idx ON public.newsletter_leads(created_at DESC);
