-- Add is_featured flag to products for custom category / featured ordering
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Create index on is_featured and created_at for sorting performance
CREATE INDEX IF NOT EXISTS products_featured_created_idx ON public.products (is_featured, created_at);
