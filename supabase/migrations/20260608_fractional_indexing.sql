-- Migration: Replace sort_order with fractional rank_key ordering
-- Add rank_key columns
ALTER TABLE public.categories ADD COLUMN rank_key text;
ALTER TABLE public.job_vacancies ADD COLUMN rank_key text;
ALTER TABLE public.sales_contacts ADD COLUMN rank_key text;

-- Backfill categories (partition by type, parent_id order by sort_order, name)
WITH ordered_categories AS (
  SELECT id,
         'a' || lpad((row_number() OVER (PARTITION BY type, parent_id ORDER BY sort_order ASC, name ASC))::text, 6, '0') as calculated_rank
  FROM public.categories
)
UPDATE public.categories c
SET rank_key = oc.calculated_rank
FROM ordered_categories oc
WHERE c.id = oc.id;

-- Backfill job_vacancies (global order by sort_order, created_at desc)
WITH ordered_jobs AS (
  SELECT id,
         'a' || lpad((row_number() OVER (ORDER BY sort_order ASC, created_at DESC))::text, 6, '0') as calculated_rank
  FROM public.job_vacancies
)
UPDATE public.job_vacancies j
SET rank_key = oj.calculated_rank
FROM ordered_jobs oj
WHERE j.id = oj.id;

-- Backfill sales_contacts (global order by sort_order, name)
WITH ordered_contacts AS (
  SELECT id,
         'a' || lpad((row_number() OVER (ORDER BY sort_order ASC, name ASC))::text, 6, '0') as calculated_rank
  FROM public.sales_contacts
)
UPDATE public.sales_contacts s
SET rank_key = oc.calculated_rank
FROM ordered_contacts oc
WHERE s.id = oc.id;

-- Set rank_key as NOT NULL
ALTER TABLE public.categories ALTER COLUMN rank_key SET NOT NULL;
ALTER TABLE public.job_vacancies ALTER COLUMN rank_key SET NOT NULL;
ALTER TABLE public.sales_contacts ALTER COLUMN rank_key SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS categories_type_parent_rank_idx ON public.categories (type, parent_id, rank_key);
CREATE INDEX IF NOT EXISTS job_vacancies_rank_key_idx ON public.job_vacancies (rank_key);
CREATE INDEX IF NOT EXISTS sales_contacts_rank_key_idx ON public.sales_contacts (rank_key);
