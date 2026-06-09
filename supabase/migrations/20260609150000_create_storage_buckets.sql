-- Create product-images storage bucket
-- Referenced by the existing product image upload feature (lib/services/admin/product-images.ts).
-- Both buckets are public so objects are reachable via the Supabase public-URL pattern.
-- All writes go through the service-role client (bypasses RLS), so no INSERT/UPDATE/DELETE
-- policies are needed. The public flag is sufficient for read access.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create banner-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banner-images',
  'banner-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
