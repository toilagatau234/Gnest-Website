REVOKE ALL PRIVILEGES ON TABLE public.newsletter_leads FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.newsletter_leads FROM authenticated;

GRANT SELECT ON TABLE public.newsletter_leads TO authenticated;

DROP POLICY IF EXISTS "Public insert newsletter_leads" ON public.newsletter_leads;
