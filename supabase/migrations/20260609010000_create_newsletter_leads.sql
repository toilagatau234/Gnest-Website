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

-- Public can insert leads, but cannot read them
DROP POLICY IF EXISTS "Public insert newsletter_leads" ON public.newsletter_leads;
CREATE POLICY "Public insert newsletter_leads"
ON public.newsletter_leads FOR INSERT
WITH CHECK (true);

-- Admins can read/manage leads
DROP POLICY IF EXISTS "Admin manage newsletter_leads" ON public.newsletter_leads;
CREATE POLICY "Admin manage newsletter_leads"
ON public.newsletter_leads FOR ALL
TO authenticated
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

-- Grants
GRANT INSERT ON public.newsletter_leads TO anon, authenticated;
GRANT SELECT ON public.newsletter_leads TO authenticated;

-- Create index on email and phone for spam checks
CREATE INDEX IF NOT EXISTS newsletter_leads_email_idx ON public.newsletter_leads(email);
CREATE INDEX IF NOT EXISTS newsletter_leads_phone_idx ON public.newsletter_leads(phone);
CREATE INDEX IF NOT EXISTS newsletter_leads_created_at_idx ON public.newsletter_leads(created_at DESC);
