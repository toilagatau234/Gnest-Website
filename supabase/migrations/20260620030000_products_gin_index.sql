-- GIN index on specs._template for fast template-based product queries
CREATE INDEX IF NOT EXISTS products_specs_template_gin_idx
  ON public.products USING gin ((specs -> '_template'));
