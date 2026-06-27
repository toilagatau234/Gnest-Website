import { createClient } from '@/lib/supabase/client';

export async function getFirstProductImagesByCategorySlugs(
  slugs: string[],
): Promise<Record<string, string>> {
  if (slugs.length === 0) return {};

  const supabase = createClient();

  // For each slug, get the category id then first product image
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', slugs);

  if (!categories || categories.length === 0) return {};

  const categoryIds = categories.map((c) => c.id);

  const { data: images } = await supabase
    .from('product_images')
    .select('public_url, products!inner(category_id)')
    .eq('is_primary', true)
    .not('public_url', 'is', null)
    .in('products.category_id', categoryIds)
    .limit(50);

  if (!images) return {};

  const result: Record<string, string> = {};
  const idToSlug = new Map(categories.map((c) => [c.id, c.slug]));

  for (const img of images) {
    const products = img.products as { category_id: string } | { category_id: string }[];
    const categoryId = Array.isArray(products) ? products[0]?.category_id : products?.category_id;
    if (!categoryId) continue;
    const slug = idToSlug.get(categoryId);
    if (slug && !result[slug] && img.public_url) {
      result[slug] = img.public_url;
    }
  }

  return result;
}
