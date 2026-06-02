import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/types/database';

export type PublicProductImage = Pick<
  Tables<'product_images'>,
  'id' | 'public_url' | 'alt' | 'sort_order' | 'is_primary'
>;

export type PublicBulkDiscount = Pick<
  Tables<'product_bulk_discounts'>,
  'id' | 'min_quantity' | 'price_per_unit'
>;

export type PublicProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  stock: number;
  specs: Record<string, unknown>;
  category: Pick<Tables<'categories'>, 'id' | 'name' | 'slug' | 'type'> | null;
  images: PublicProductImage[];
  bulkDiscounts: PublicBulkDiscount[];
};

const publicProductSelect = `
  id,
  name,
  slug,
  description,
  price,
  stock,
  specs,
  categories!products_category_id_fkey (
    id,
    name,
    slug,
    type
  ),
  product_images (
    id,
    public_url,
    alt,
    sort_order,
    is_primary,
    is_active
  ),
  product_bulk_discounts (
    id,
    min_quantity,
    price_per_unit,
    is_active
  )
` as const;

type RawPublicProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  stock: number;
  specs: Record<string, unknown>;
  categories: Pick<Tables<'categories'>, 'id' | 'name' | 'slug' | 'type'> | null;
  product_images: (PublicProductImage & { is_active: boolean })[];
  product_bulk_discounts: (PublicBulkDiscount & { is_active: boolean })[];
};

function toPublicProductDetail(raw: RawPublicProduct): PublicProductDetail {
  const images = raw.product_images
    .filter((img) => img.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ is_active: _omit, ...img }) => img);

  const bulkDiscounts = raw.product_bulk_discounts
    .filter((d) => d.is_active)
    .sort((a, b) => a.min_quantity - b.min_quantity)
    .map(({ is_active: _omit, ...d }) => d);

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    price: raw.price,
    stock: raw.stock,
    specs: raw.specs ?? {},
    category: raw.categories ?? null,
    images,
    bulkDiscounts,
  };
}

export async function getPublicProductBySlug(slug: string): Promise<PublicProductDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(publicProductSelect)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product "${slug}": ${error.message}`);
  }

  if (!data) return null;

  return toPublicProductDetail(data as unknown as RawPublicProduct);
}

export type PublicProductQuoteContext = Pick<Tables<'products'>, 'id' | 'name' | 'slug'>;

export async function getActivePublicProductQuoteContextById(
  productId: string
): Promise<PublicProductQuoteContext | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify quote product "${productId}": ${error.message}`);
  }

  return data;
}

export async function getPublicProductsByCategorySlug(
  categorySlug: string
): Promise<PublicProductDetail[]> {
  const supabase = await createClient();

  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .eq('is_active', true)
    .maybeSingle();

  if (catError) {
    throw new Error(`Failed to load category "${categorySlug}": ${catError.message}`);
  }

  if (!category) return [];

  const { data, error } = await supabase
    .from('products')
    .select(publicProductSelect)
    .eq('is_active', true)
    .eq('category_id', category.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load products for category "${categorySlug}": ${error.message}`);
  }

  return (data as unknown as RawPublicProduct[]).map(toPublicProductDetail);
}
