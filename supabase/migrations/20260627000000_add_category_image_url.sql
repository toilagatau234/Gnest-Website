-- Add image_url to categories (used for service card backgrounds in FloatingGallery)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create category-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for category-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'category images public read'
  ) THEN
    CREATE POLICY "category images public read" ON storage.objects
      FOR SELECT USING (bucket_id = 'category-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'category images admin upload'
  ) THEN
    CREATE POLICY "category images admin upload" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'category-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'category images admin update'
  ) THEN
    CREATE POLICY "category images admin update" ON storage.objects
      FOR UPDATE USING (bucket_id = 'category-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'category images admin delete'
  ) THEN
    CREATE POLICY "category images admin delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'category-images');
  END IF;
END $$;
