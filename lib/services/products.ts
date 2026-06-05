import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/types/database';

import { getVisibleCategoryIds } from '@/lib/services/category-visibility';

export type ProductImage = Tables<'product_images'>;
export type ProductBulkDiscount = Tables<'product_bulk_discounts'>;
export type Product = Tables<'products'>;

export type ProductWithDetails = Pick<
  Product,
  'id' | 'name' | 'slug' | 'description' | 'price' | 'stock' | 'category_id' | 'specs'
> & {
  product_images: Pick<ProductImage, 'public_url' | 'sort_order' | 'is_primary' | 'is_active'>[];
  product_bulk_discounts: Pick<ProductBulkDiscount, 'min_quantity' | 'price_per_unit' | 'is_active'>[];
};

const productSelect = `
  id,
  name,
  slug,
  description,
  price,
  stock,
  specs,
  category_id,
  product_images (
    public_url,
    sort_order,
    is_primary,
    is_active
  ),
  product_bulk_discounts (
    min_quantity,
    price_per_unit,
    is_active
  )
` as const;

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

