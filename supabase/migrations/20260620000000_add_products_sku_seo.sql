-- Add sku column (dedicated, indexed, nullable)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

-- Partial unique index: only enforces uniqueness when sku IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_idx
  ON public.products (sku)
  WHERE sku IS NOT NULL;

-- Backfill sku from existing specs.sku JSONB field
UPDATE public.products
SET sku = specs->>'sku'
WHERE specs->>'sku' IS NOT NULL
  AND sku IS NULL;
