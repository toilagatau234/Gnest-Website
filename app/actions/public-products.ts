'use server';

import {
  getPublicProductsPage,
  searchPublicProducts,
  getPublicProductBySlug,
  type PublicProductListResult,
  type PublicProductCard,
  type PublicProductDetail,
} from '@/lib/services/public-products';

export async function getPublicProductsPageAction(params: {
  categorySlug: string;
  page: number;
  pageSize: number;
  filters?: Record<string, string[]>;
}): Promise<PublicProductListResult> {
  return getPublicProductsPage(params);
}

export async function searchPublicProductsAction(
  queryText: string,
  limit?: number,
): Promise<PublicProductCard[]> {
  return searchPublicProducts(queryText, limit);
}

export async function getPublicProductBySlugAction(
  slug: string,
): Promise<PublicProductDetail | null> {
  return getPublicProductBySlug(slug);
}
