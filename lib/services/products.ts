import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/types/database';

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

export async function getProducts() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('is_active', true)
    .eq('product_images.is_active', true)
    .eq('product_bulk_discounts.is_active', true)
    .order('created_at', { ascending: false })
    .returns<ProductWithDetails[]>();

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return data;
}

export async function getProductsByCategorySlug(categorySlug: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('is_active', true)
    .eq('product_images.is_active', true)
    .eq('product_bulk_discounts.is_active', true)
    .eq('categories.slug', categorySlug)
    .order('created_at', { ascending: false })
    .returns<ProductWithDetails[]>();

  if (error) {
    throw new Error(`Failed to load products for category "${categorySlug}": ${error.message}`);
  }

  return data;
}

export async function getProductBySlug(slug: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('product_images.is_active', true)
    .eq('product_bulk_discounts.is_active', true)
    .maybeSingle()
    .returns<ProductWithDetails | null>();

  if (error) {
    throw new Error(`Failed to load product "${slug}": ${error.message}`);
  }

  return data;
}
