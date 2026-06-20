-- Create products storage bucket
-- Referenced by the bulk import feature when client uploads images.
-- The bucket is public so objects are reachable via the Supabase public-URL pattern.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
