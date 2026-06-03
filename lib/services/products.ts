import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/types/database';

import { getVisibleCategoryIds } from '@/lib/services/category-visibility';

export type ProductImage = Tables<'product_images'>;
export type ProductBulkDiscount = Tables<'product_bulk_discounts'>;
export type Product = Tables<'products'>;

export type ProductWithDetails = Product & {
  categories: Tables<'categories'> | null;
  product_images: ProductImage[];
  product_bulk_discounts: ProductBulkDiscount[];
};

const productSelect = `
  *,
  categories (*),
  product_images (*),
  product_bulk_discounts (*)
`;

function isSupabaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables are not configured.');
  }
  return createClient();
}

async function getVisibleCategorySet() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, parent_id, is_active, sort_order, name');

  if (error) {
    throw new Error(`Failed to load categories for product visibility: ${error.message}`);
  }

  return getVisibleCategoryIds(data ?? []);
}

export async function getProducts() {
  const supabase = getSupabase();
  const visibleCategoryIds = await getVisibleCategorySet();

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .returns<ProductWithDetails[]>();

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return (data ?? []).filter((product) => {
    if (!product.category_id) {
      return true;
    }

    return visibleCategoryIds.has(product.category_id);
  });
}

export async function getProductsByCategorySlug(categorySlug: string) {
  const supabase = getSupabase();
  const visibleCategoryIds = await getVisibleCategorySet();

  // 1. Query category by slug first
  const { data: categoryData, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .eq('is_active', true)
    .maybeSingle();

  if (catError) {
    throw new Error(`Failed to load category "${categorySlug}": ${catError.message}`);
  }

  if (!categoryData) {
    return [];
  }

  if (!visibleCategoryIds.has(categoryData.id)) {
    return [];
  }

  // 2. Query products by category_id
  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('is_active', true)
    .eq('category_id', categoryData.id)
    .order('created_at', { ascending: false })
    .returns<ProductWithDetails[]>();

  if (error) {
    throw new Error(`Failed to load products for category "${categorySlug}": ${error.message}`);
  }

  return data ?? [];
}

export async function getProductBySlug(slug: string) {
  const supabase = getSupabase();
  const visibleCategoryIds = await getVisibleCategorySet();

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
    .returns<ProductWithDetails | null>();

  if (error) {
    throw new Error(`Failed to load product "${slug}": ${error.message}`);
  }

  if (data?.category_id && !visibleCategoryIds.has(data.category_id)) {
    return null;
  }

  return data;
}
