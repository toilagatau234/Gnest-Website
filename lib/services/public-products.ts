import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/types/database';

import { getVisibleCategoryIds } from '@/lib/services/category-visibility';
import { compareRankKey } from '@/lib/services/admin/rank-key';

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

type PublicProductQueryRow = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  stock: number;
  category_id: string | null;
  specs: unknown;
  is_featured: boolean;
  created_at: string;
  categories: {
    id: string;
    name: string;
    slug: string;
    rank_key: string;
  } | null;
};

export async function getHotProductInquiryCounts(productIds: string[], days = 30): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (productIds.length === 0) return counts;

  try {
    const supabase = await createClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('inquiries')
      .select('product_id')
      .in('product_id', productIds)
      .gte('created_at', cutoffDate.toISOString())
      .neq('status', 'spam')
      .not('product_id', 'is', null);

    if (error) {
      console.error(`Failed to fetch inquiries for hot product counts: ${error.message}`);
      return counts;
    }

    if (data) {
      data.forEach((row) => {
        if (row.product_id) {
          counts.set(row.product_id, (counts.get(row.product_id) || 0) + 1);
        }
      });
    }
  } catch (err) {
    console.error('Failed to get hot product inquiry counts:', err);
  }

  return counts;
}

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
      .select('id, type')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .maybeSingle();

    if (!category || category.type !== 'product' || !visibleCategoryIds.has(category.id)) {
      return { items: [], page: safePage, pageSize: safePageSize, total: 0, pageCount: 0, hasNextPage: false };
    }

    // Include child categories if the category is a parent
    const { data: allCats } = await supabase
      .from('categories')
      .select('id, parent_id, type')
      .eq('type', 'product');
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
    const { data: productCats } = await supabase
      .from('categories')
      .select('id')
      .eq('type', 'product')
      .eq('is_active', true);
    const productCatIds = new Set((productCats ?? []).map((c) => c.id));
    targetCategoryIds = Array.from(visibleCategoryIds).filter((id) => productCatIds.has(id));
  }

  // If no visible categories are in target, return empty
  if (targetCategoryIds.length === 0) {
    return { items: [], page: safePage, pageSize: safePageSize, total: 0, pageCount: 0, hasNextPage: false };
  }

  // Start building query on products table
  let query = supabase
    .from('products')
    .select('id, name, slug, price, stock, category_id, specs, is_featured, created_at, categories!products_category_id_fkey (id, name, slug, rank_key)', { count: 'exact' })
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

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to query public products: ${error.message}`);
  }

  const rawProducts = (data ?? []) as unknown as PublicProductQueryRow[];
  const rawProductIds = rawProducts.map((p) => p.id);
  const hotCounts = await getHotProductInquiryCounts(rawProductIds);
  
  // Sort products combined: category rank_key -> is_featured -> hot count -> created_at desc -> name asc
  const sortedProducts = [...rawProducts].sort((a, b) => {
    const catA = a.categories as any;
    const catB = b.categories as any;
    const rankA = catA?.rank_key ?? '';
    const rankB = catB?.rank_key ?? '';
    const rankCompare = compareRankKey(rankA, rankB);
    if (rankCompare !== 0) {
      return rankCompare;
    }
    
    const featA = a.is_featured ? 1 : 0;
    const featB = b.is_featured ? 1 : 0;
    if (featA !== featB) {
      return featB - featA;
    }

    const countA = hotCounts.get(a.id) || 0;
    const countB = hotCounts.get(b.id) || 0;
    if (countA !== countB) {
      return countB - countA;
    }
    
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    if (timeA !== timeB) {
      return timeB - timeA;
    }
    
    return a.name.localeCompare(b.name);
  });

  const total = count ?? sortedProducts.length;
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const clampedPage = safePage > pageCount ? pageCount : safePage;
  const from = (clampedPage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const products = sortedProducts.slice(from, to + 1);
  const hasNextPage = clampedPage < pageCount;

  if (products.length === 0) {
    return { items: [], page: clampedPage, pageSize: safePageSize, total, pageCount, hasNextPage };
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

  const activeRootCategories = (rootCats ?? []).filter((category) => visibleCategoryIds.has(category.id));
  const activeRootIds = activeRootCategories.map((category) => category.id);
  const rootSlugById = new Map(activeRootCategories.map((category) => [category.id, category.slug]));

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

  // Query products per root category with limit of 4 in parallel
  const rootIdToProductIds = new Map<string, string[]>();
  const allProductsMap = new Map<string, { id: string; name: string; slug: string; price: number | null; stock: number; category_id: string | null; specs: any; is_featured?: boolean; created_at?: string }>();

  const queries = activeRootIds.map(async (rootId) => {
    const descendants = rootDescendantsMap.get(rootId) ?? [];
    if (descendants.length === 0) return;

    const { data: rootProducts, error: rootError } = await supabase
      .from('products')
      .select('id, name, slug, price, stock, category_id, specs, is_featured, created_at, categories!products_category_id_fkey (id, name, slug, rank_key)')
      .eq('is_active', true)
      .in('category_id', descendants);

    if (rootError) {
      throw new Error(`Failed to load homepage products for root category "${rootId}": ${rootError.message}`);
    }

    const rawRootProducts = (rootProducts ?? []) as unknown as PublicProductQueryRow[];
    const rawRootProductIds = rawRootProducts.map((p) => p.id);
    const hotCounts = await getHotProductInquiryCounts(rawRootProductIds);

    // Sort homepage products in memory combining: category rank_key -> is_featured -> hot count -> created_at desc -> name asc
    const sorted = [...rawRootProducts].sort((a, b) => {
      const catA = a.categories as any;
      const catB = b.categories as any;
      const rankA = catA?.rank_key ?? '';
      const rankB = catB?.rank_key ?? '';
      const rankCompare = compareRankKey(rankA, rankB);
      if (rankCompare !== 0) {
        return rankCompare;
      }
      
      const featA = a.is_featured ? 1 : 0;
      const featB = b.is_featured ? 1 : 0;
      if (featA !== featB) {
        return featB - featA;
      }

      const countA = hotCounts.get(a.id) || 0;
      const countB = hotCounts.get(b.id) || 0;
      if (countA !== countB) {
        return countB - countA;
      }
      
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      
      return a.name.localeCompare(b.name);
    });

    const limited = sorted.slice(0, 4);
    const ids = limited.map((p) => p.id);
    rootIdToProductIds.set(rootId, ids);
    limited.forEach((p) => {
      allProductsMap.set(p.id, p);
    });
  });

  await Promise.all(queries);

  const uniqueProducts = Array.from(allProductsMap.values());
  const productIds = uniqueProducts.map((p) => p.id);

  if (productIds.length === 0) return {};

  // Batch query images, bulk discounts, and categories for selected product IDs
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
      .in('id', uniqueProducts.map((p) => p.category_id).filter(Boolean) as string[]),
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

  const itemsMapped = uniqueProducts.map((p) => {
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

  const itemsMap = new Map<string, typeof itemsMapped[0]>();
  itemsMapped.forEach((item) => {
    itemsMap.set(item.id, item);
  });

  const result: Record<string, PublicProductCard[]> = {};
  activeRootIds.forEach((rootId) => {
    const productIdsForRoot = rootIdToProductIds.get(rootId) ?? [];
    const rootItems = productIdsForRoot
      .map((id) => itemsMap.get(id))
      .filter((item): item is NonNullable<typeof item> => !!item);
    const rootSlug = rootSlugById.get(rootId);
    if (rootSlug) {
      result[rootSlug] = rootItems;
    }
  });

  return result;
}
