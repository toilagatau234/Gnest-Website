import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';
import { createClient } from '@/lib/supabase/server';
import { getVisibleCategoryIds } from '@/lib/services/category-visibility';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  // Use the anon client so the public sitemap only ever sees public (is_active) rows via RLS —
  // never inactive products/categories the service-role client would expose.
  const supabase = await createClient();

  // 1. Fetch categories
  const { data: rawCategories } = await supabase
    .from('categories')
    .select('id, slug, parent_id, is_active, sort_order, name, updated_at');

  const visibleCategoryIds = getVisibleCategoryIds(rawCategories || []);
  const activeCategories = (rawCategories || []).filter((c) => visibleCategoryIds.has(c.id));

  // 2. Fetch products
  const { data: rawProducts } = await supabase
    .from('products')
    .select('slug, category_id, updated_at')
    .eq('is_active', true);

  const activeProducts = (rawProducts || []).filter(
    (p) => p.category_id && visibleCategoryIds.has(p.category_id)
  );

  // 3. Static routes
  const routes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/danh-muc`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tuyen-dung`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // 4. Category routes
  const categoryRoutes = activeCategories.map((cat) => ({
    url: `${baseUrl}/danh-muc/${cat.slug}`,
    lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 5. Product routes
  const productRoutes = activeProducts.map((prod) => ({
    url: `${baseUrl}/san-pham/${prod.slug}`,
    lastModified: prod.updated_at ? new Date(prod.updated_at) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...routes, ...categoryRoutes, ...productRoutes];
}
