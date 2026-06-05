import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/types/database';

import { getVisibleCategoryIds } from '@/lib/services/category-visibility';

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

async function getVisibleCategorySet() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, parent_id, is_active, sort_order, name');

  if (error) {
    throw new Error(`Failed to load public categories: ${error.message}`);
  }

  return getVisibleCategoryIds(data ?? []);
}

export async function getPublicProductBySlug(slug: string): Promise<PublicProductDetail | null> {
  const supabase = await createClient();
  const visibleCategoryIds = await getVisibleCategorySet();

  const { data, error } = await supabase
    .from('products')
    .select(publicProductSelect)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product "${slug}": ${error.message}`);
  }

  const product = data as unknown as RawPublicProduct | null;

  if (!product) return null;
  if (product.categories?.id && !visibleCategoryIds.has(product.categories.id)) {
    return null;
  }

  return toPublicProductDetail(product);
}

export type PublicProductQuoteContext = Pick<Tables<'products'>, 'id' | 'name' | 'slug'>;

export async function getActivePublicProductQuoteContextById(
  productId: string
): Promise<PublicProductQuoteContext | null> {
  const supabase = await createClient();
  const visibleCategoryIds = await getVisibleCategorySet();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, category_id')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify quote product "${productId}": ${error.message}`);
  }

  if (!data) {
    return null;
  }

  if (data.category_id && !visibleCategoryIds.has(data.category_id)) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
  };
}

export type PublicProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  stock: number;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  thumbnailUrl: string | null;
  imageCount: number;
  hasActiveBulkDiscount: boolean;
  minBulkPrice?: number | null;
  specs: {
    dungTich?: string;
    quyCach?: string;
    phiNap?: string;
    loaiNap?: string;
    color?: string;
  };
};

export type PublicProductListResult = {
  items: PublicProductCard[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  hasNextPage: boolean;
};

export async function getPublicProductsPage({
  categorySlug,
  page,
  pageSize,
  filters,
}: {
  categorySlug: string;
  page: number;
  pageSize: number;
  filters?: Record<string, string[]>;
}): Promise<PublicProductListResult> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(48, Math.max(1, pageSize));

  const supabase = await createClient();
  const visibleCategoryIds = await getVisibleCategorySet();

  // Resolve category if slug is not 'all'
  let targetCategoryIds: string[] | null = null;
  if (categorySlug !== 'all') {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .maybeSingle();

    if (!category || !visibleCategoryIds.has(category.id)) {
      return { items: [], page: safePage, pageSize: safePageSize, total: 0, pageCount: 0, hasNextPage: false };
    }

    // Include child categories if the category is a parent
    const { data: allCats } = await supabase
      .from('categories')
      .select('id, parent_id');
    const descendants = [category.id];
    const findChildren = (parentId: string) => {
      const children = (allCats ?? []).filter((c) => c.parent_id === parentId);
      for (const child of children) {
        descendants.push(child.id);
        findChildren(child.id);
      }
    };
    findChildren(category.id);

    targetCategoryIds = descendants.filter((id) => visibleCategoryIds.has(id));
  } else {
    targetCategoryIds = Array.from(visibleCategoryIds);
  }

  // If no visible categories are in target, return empty
  if (targetCategoryIds.length === 0) {
    return { items: [], page: safePage, pageSize: safePageSize, total: 0, pageCount: 0, hasNextPage: false };
  }

  // Start building query on products table
  let query = supabase
    .from('products')
    .select('id, name, slug, price, stock, category_id, specs', { count: 'exact' })
    .eq('is_active', true)
    .in('category_id', targetCategoryIds);

  // Apply specs filters
  if (filters && typeof filters === 'object') {
    Object.entries(filters).forEach(([key, values]) => {
      if (Array.isArray(values)) {
        const cleanValues = values.filter((v) => typeof v === 'string' && v.trim() !== '');
        if (cleanValues.length > 0) {
          query = query.in(`specs->>${key}`, cleanValues);
        }
      }
    });
  }

  // Order stably: created_at DESC, id DESC
  query = query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  // Calculate range
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to query public products: ${error.message}`);
  }

  const products = data ?? [];
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const hasNextPage = safePage < pageCount;

  if (products.length === 0) {
    return { items: [], page: safePage, pageSize: safePageSize, total, pageCount, hasNextPage };
  }

  const productIds = products.map((p) => p.id);

  // Fetch images and bulk discounts for these product IDs only
  const [imagesResult, discountsResult, categoriesResult] = await Promise.all([
    supabase
      .from('product_images')
      .select('product_id, public_url, sort_order, is_primary')
      .eq('is_active', true)
      .in('product_id', productIds),
    supabase
      .from('product_bulk_discounts')
      .select('product_id, price_per_unit')
      .eq('is_active', true)
      .in('product_id', productIds),
    supabase
      .from('categories')
      .select('id, name, slug')
      .in('id', products.map((p) => p.category_id).filter(Boolean) as string[]),
  ]);

  const imagesMap = new Map<string, typeof imagesResult.data>();
  (imagesResult.data ?? []).forEach((img) => {
    const list = imagesMap.get(img.product_id) ?? [];
    list.push(img);
    imagesMap.set(img.product_id, list);
  });

  const discountsMap = new Map<string, typeof discountsResult.data>();
  (discountsResult.data ?? []).forEach((d) => {
    const list = discountsMap.get(d.product_id) ?? [];
    list.push(d);
    discountsMap.set(d.product_id, list);
  });

  const categoriesMap = new Map(
    (categoriesResult.data ?? []).map((c) => [c.id, c])
  );

  const items: PublicProductCard[] = products.map((p) => {
    const pImages = imagesMap.get(p.id) ?? [];
    const sortedImages = [...pImages].sort((a, b) => a.sort_order - b.sort_order);
    const primaryImg = sortedImages.find((img) => img.is_primary) || sortedImages[0];
    const thumbnailUrl = primaryImg ? primaryImg.public_url : null;

    const pDiscounts = discountsMap.get(p.id) ?? [];
    const minBulkPrice = pDiscounts.length > 0 
      ? Math.min(...pDiscounts.map((d) => d.price_per_unit)) 
      : null;

    const cat = p.category_id ? categoriesMap.get(p.category_id) : null;
    const specsObj = p.specs && typeof p.specs === 'object' ? (p.specs as Record<string, any>) : {};

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      stock: p.stock,
      category_id: p.category_id,
      category_slug: cat ? cat.slug : null,
      category_name: cat ? cat.name : null,
      thumbnailUrl,
      imageCount: pImages.length,
      hasActiveBulkDiscount: pDiscounts.length > 0,
      minBulkPrice,
      specs: {
        dungTich: specsObj.dungTich ? String(specsObj.dungTich) : undefined,
        quyCach: specsObj.quyCach ? String(specsObj.quyCach) : undefined,
        phiNap: specsObj.phiNap ? String(specsObj.phiNap) : undefined,
        loaiNap: specsObj.loaiNap ? String(specsObj.loaiNap) : undefined,
        color: specsObj.color ? String(specsObj.color) : undefined,
      },
    };
  });

  return {
    items,
    page: safePage,
    pageSize: safePageSize,
    total,
    pageCount,
    hasNextPage,
  };
}

export async function searchPublicProducts(
  queryText: string,
  limit: number = 5
): Promise<PublicProductCard[]> {
  const trimmedQuery = (queryText ?? '').trim();
  if (trimmedQuery.length < 2) return [];

  const safeLimit = Math.min(10, Math.max(1, limit));

  const supabase = await createClient();
  const visibleCategoryIds = await getVisibleCategorySet();

  // Search by name
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, price, stock, category_id, specs')
    .eq('is_active', true)
    .ilike('name', `%${trimmedQuery}%`)
    .limit(safeLimit);

  if (error) {
    throw new Error(`Failed to search products: ${error.message}`);
  }

  // Filter visible categories
  const visibleProducts = (products ?? []).filter(
    (p) => !p.category_id || visibleCategoryIds.has(p.category_id)
  );

  if (visibleProducts.length === 0) return [];

  const productIds = visibleProducts.map((p) => p.id);

  // Fetch images/discounts/categories for these products
  const [imagesResult, discountsResult, categoriesResult] = await Promise.all([
    supabase
      .from('product_images')
      .select('product_id, public_url, sort_order, is_primary')
      .eq('is_active', true)
      .in('product_id', productIds),
    supabase
      .from('product_bulk_discounts')
      .select('product_id, price_per_unit')
      .eq('is_active', true)
      .in('product_id', productIds),
    supabase
      .from('categories')
      .select('id, name, slug')
      .in('id', visibleProducts.map((p) => p.category_id).filter(Boolean) as string[]),
  ]);

  const imagesMap = new Map<string, typeof imagesResult.data>();
  (imagesResult.data ?? []).forEach((img) => {
    const list = imagesMap.get(img.product_id) ?? [];
    list.push(img);
    imagesMap.set(img.product_id, list);
  });

  const discountsMap = new Map<string, typeof discountsResult.data>();
  (discountsResult.data ?? []).forEach((d) => {
    const list = discountsMap.get(d.product_id) ?? [];
    list.push(d);
    discountsMap.set(d.product_id, list);
  });

  const categoriesMap = new Map(
    (categoriesResult.data ?? []).map((c) => [c.id, c])
  );

  return visibleProducts.map((p) => {
    const pImages = imagesMap.get(p.id) ?? [];
    const sortedImages = [...pImages].sort((a, b) => a.sort_order - b.sort_order);
    const primaryImg = sortedImages.find((img) => img.is_primary) || sortedImages[0];
    const thumbnailUrl = primaryImg ? primaryImg.public_url : null;

    const pDiscounts = discountsMap.get(p.id) ?? [];
    const minBulkPrice = pDiscounts.length > 0 
      ? Math.min(...pDiscounts.map((d) => d.price_per_unit)) 
      : null;

    const cat = p.category_id ? categoriesMap.get(p.category_id) : null;
    const specsObj = p.specs && typeof p.specs === 'object' ? (p.specs as Record<string, any>) : {};

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      stock: p.stock,
      category_id: p.category_id,
      category_slug: cat ? cat.slug : null,
      category_name: cat ? cat.name : null,
      thumbnailUrl,
      imageCount: pImages.length,
      hasActiveBulkDiscount: pDiscounts.length > 0,
      minBulkPrice,
      specs: {
        dungTich: specsObj.dungTich ? String(specsObj.dungTich) : undefined,
        quyCach: specsObj.quyCach ? String(specsObj.quyCach) : undefined,
        phiNap: specsObj.phiNap ? String(specsObj.phiNap) : undefined,
        loaiNap: specsObj.loaiNap ? String(specsObj.loaiNap) : undefined,
        color: specsObj.color ? String(specsObj.color) : undefined,
      },
    };
  });
}

export async function getHomepageProducts(): Promise<Record<string, PublicProductCard[]>> {
  const supabase = await createClient();
  const visibleCategoryIds = await getVisibleCategorySet();

  // Load root product categories
  const { data: rootCats } = await supabase
    .from('categories')
    .select('id, parent_id, slug, is_active, type')
    .eq('type', 'product')
    .is('parent_id', null)
    .eq('is_active', true);

  const activeRootIds = (rootCats ?? []).map((c) => c.id).filter((id) => visibleCategoryIds.has(id));

  if (activeRootIds.length === 0) return {};

  // Find all descendants for each root category
  const { data: allCats } = await supabase
    .from('categories')
    .select('id, parent_id');

  const rootDescendantsMap = new Map<string, string[]>();
  activeRootIds.forEach((rootId) => {
    const descendants: string[] = [rootId];
    const findChildren = (parentId: string) => {
      const children = (allCats ?? []).filter((c) => c.parent_id === parentId);
      for (const child of children) {
        descendants.push(child.id);
        findChildren(child.id);
      }
    };
    findChildren(rootId);
    rootDescendantsMap.set(rootId, descendants.filter((id) => visibleCategoryIds.has(id)));
  });

  // Query products for all these categories
  const allCategoryIds = Array.from(new Set(Array.from(rootDescendantsMap.values()).flat()));

  if (allCategoryIds.length === 0) return {};

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, price, stock, category_id, specs')
    .eq('is_active', true)
    .in('category_id', allCategoryIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load homepage products: ${error.message}`);
  }

  // Filter and build items
  const productIds = (products ?? []).map((p) => p.id);

  const [imagesResult, discountsResult, categoriesResult] = await Promise.all([
    supabase
      .from('product_images')
      .select('product_id, public_url, sort_order, is_primary')
      .eq('is_active', true)
      .in('product_id', productIds),
    supabase
      .from('product_bulk_discounts')
      .select('product_id, price_per_unit')
      .eq('is_active', true)
      .in('product_id', productIds),
    supabase
      .from('categories')
      .select('id, name, slug')
      .in('id', (products ?? []).map((p) => p.category_id).filter(Boolean) as string[]),
  ]);

  const imagesMap = new Map<string, typeof imagesResult.data>();
  (imagesResult.data ?? []).forEach((img) => {
    const list = imagesMap.get(img.product_id) ?? [];
    list.push(img);
    imagesMap.set(img.product_id, list);
  });

  const discountsMap = new Map<string, typeof discountsResult.data>();
  (discountsResult.data ?? []).forEach((d) => {
    const list = discountsMap.get(d.product_id) ?? [];
    list.push(d);
    discountsMap.set(d.product_id, list);
  });

  const categoriesMap = new Map(
    (categoriesResult.data ?? []).map((c) => [c.id, c])
  );

  const allItemsMapped: PublicProductCard[] = (products ?? []).map((p) => {
    const pImages = imagesMap.get(p.id) ?? [];
    const sortedImages = [...pImages].sort((a, b) => a.sort_order - b.sort_order);
    const primaryImg = sortedImages.find((img) => img.is_primary) || sortedImages[0];
    const thumbnailUrl = primaryImg ? primaryImg.public_url : null;

    const pDiscounts = discountsMap.get(p.id) ?? [];
    const minBulkPrice = pDiscounts.length > 0 
      ? Math.min(...pDiscounts.map((d) => d.price_per_unit)) 
      : null;

    const cat = p.category_id ? categoriesMap.get(p.category_id) : null;
    const specsObj = p.specs && typeof p.specs === 'object' ? (p.specs as Record<string, any>) : {};

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      stock: p.stock,
      category_id: p.category_id,
      category_slug: cat ? cat.slug : null,
      category_name: cat ? cat.name : null,
      thumbnailUrl,
      imageCount: pImages.length,
      hasActiveBulkDiscount: pDiscounts.length > 0,
      minBulkPrice,
      specs: {
        dungTich: specsObj.dungTich ? String(specsObj.dungTich) : undefined,
        quyCach: specsObj.quyCach ? String(specsObj.quyCach) : undefined,
        phiNap: specsObj.phiNap ? String(specsObj.phiNap) : undefined,
        loaiNap: specsObj.loaiNap ? String(specsObj.loaiNap) : undefined,
        color: specsObj.color ? String(specsObj.color) : undefined,
      },
    };
  });

  // Group and slice to 4 items per root category
  const result: Record<string, PublicProductCard[]> = {};
  activeRootIds.forEach((rootId) => {
    const descendants = rootDescendantsMap.get(rootId) ?? [];
    const rootItems = allItemsMapped.filter((item) => item.category_id && descendants.includes(item.category_id));
    result[rootId] = rootItems.slice(0, 4);
  });

  return result;
}
