-- Migration: Idempotently add and backfill rank_key columns if not already completed.
-- This patch is safe to run even if the previous migration (20260608_fractional_indexing.sql)
-- was already run manually in the Supabase SQL Editor.

-- 1. Add rank_key columns if they do not exist
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS rank_key text;
ALTER TABLE public.job_vacancies ADD COLUMN IF NOT EXISTS rank_key text;
ALTER TABLE public.sales_contacts ADD COLUMN IF NOT EXISTS rank_key text;

-- 2. PL/pgSQL function to generate canonical base62 fractional keys (idempotent CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.get_fractional_rank(idx integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  chars text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
BEGIN
  IF idx < 62 THEN
    RETURN 'a' || substring(chars from (idx + 1) for 1);
  ELSIF idx < 3906 THEN
    RETURN 'b' || substring(chars from ((idx - 62) / 62 + 1) for 1)
               || substring(chars from ((idx - 62) % 62 + 1) for 1);
  ELSE
    RETURN 'c' || substring(chars from ((idx - 3906) / 3844 + 1) for 1)
               || substring(chars from (((idx - 3906) % 3844) / 62 + 1) for 1)
               || substring(chars from (((idx - 3906) % 3844) % 62 + 1) for 1);
  END IF;
END;
$$;

-- 3. Backfill categories where rank_key is NULL, without overwriting existing rank_key values
WITH ordered_categories AS (
  SELECT id,
         public.get_fractional_rank((row_number() OVER (PARTITION BY type, parent_id ORDER BY sort_order ASC, name ASC))::integer - 1) as calculated_rank
  FROM public.categories
)
UPDATE public.categories c
SET rank_key = oc.calculated_rank
FROM ordered_categories oc
WHERE c.id = oc.id AND c.rank_key IS NULL;

-- 4. Backfill job_vacancies where rank_key is NULL, without overwriting existing rank_key values
WITH ordered_jobs AS (
  SELECT id,
         public.get_fractional_rank((row_number() OVER (ORDER BY sort_order ASC, created_at DESC))::integer - 1) as calculated_rank
  FROM public.job_vacancies
)
UPDATE public.job_vacancies j
SET rank_key = oj.calculated_rank
FROM ordered_jobs oj
WHERE j.id = oj.id AND j.rank_key IS NULL;

-- 5. Backfill sales_contacts where rank_key is NULL, without overwriting existing rank_key values
WITH ordered_contacts AS (
  SELECT id,
         public.get_fractional_rank((row_number() OVER (ORDER BY sort_order ASC, name ASC))::integer - 1) as calculated_rank
  FROM public.sales_contacts
)
UPDATE public.sales_contacts s
SET rank_key = oc.calculated_rank
FROM ordered_contacts oc
WHERE s.id = oc.id AND s.rank_key IS NULL;

-- 6. Clean up helper function
DROP FUNCTION IF EXISTS public.get_fractional_rank(integer);

-- 7. Set rank_key as NOT NULL (only after backfilling NULL values)
ALTER TABLE public.categories ALTER COLUMN rank_key SET NOT NULL;
ALTER TABLE public.job_vacancies ALTER COLUMN rank_key SET NOT NULL;
ALTER TABLE public.sales_contacts ALTER COLUMN rank_key SET NOT NULL;

-- 8. Create indexes if they do not exist
CREATE INDEX IF NOT EXISTS categories_type_parent_rank_idx ON public.categories (type, parent_id, rank_key);
CREATE INDEX IF NOT EXISTS job_vacancies_rank_key_idx ON public.job_vacancies (rank_key);
CREATE INDEX IF NOT EXISTS sales_contacts_rank_key_idx ON public.sales_contacts (rank_key);
