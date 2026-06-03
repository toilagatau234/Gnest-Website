import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';

import { requireAdminAuth } from '@/lib/services/admin/auth';
import { getAuditLogs, type AuditLogEntry } from '@/lib/services/admin/audit-logs';
import {
  getInquiries,
  getInquiryCount,
  getNewInquiriesCount,
  type Inquiry,
} from '@/lib/services/admin/inquiries';

const LOW_STOCK_THRESHOLD = 5;

export interface DashboardData {
  hasSupabase: boolean;
  counts: {
    products: number;
    categories: number;
    visibleCategories: number;
    hiddenProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    missingImages: number;
    activeContacts: number;
    activeJobs: number;
    newInquiries: number;
    totalInquiries: number;
    recentActivities: number;
  };
  attention: {
    missingImages: number;
    lowStock: number;
    hiddenProducts: number;
    hiddenCategories: number;
  };
  productInterest: ProductInterestMetric[];
  recentInquiries: Inquiry[];
  recentActivity: AuditLogEntry[];
}

export interface ProductInterestMetric {
  productId: string;
  name: string;
  slug: string;
  inquiryCount: number;
  newInquiryCount: number;
  isActive: boolean;
}

const EMPTY: DashboardData = {
  hasSupabase: false,
  counts: {
    products: 0,
    categories: 0,
    visibleCategories: 0,
    hiddenProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
    missingImages: 0,
    activeContacts: 0,
    activeJobs: 0,
    newInquiries: 0,
    totalInquiries: 0,
    recentActivities: 0,
  },
  attention: { missingImages: 0, lowStock: 0, hiddenProducts: 0, hiddenCategories: 0 },
  productInterest: [],
  recentInquiries: [],
  recentActivity: [],
};

type ProductHealthRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  stock: number;
  product_images: { id: string }[] | null;
};

type CategoryHealthRow = { is_active: boolean };
type ProductInquiryRow = {
  product_id: string | null;
  status: string;
};

function buildProductInterestMetrics(
  products: ProductHealthRow[],
  inquiries: ProductInquiryRow[],
): ProductInterestMetric[] {
  const productLookup = new Map(products.map((product) => [product.id, product]));
  const grouped = new Map<string, { inquiryCount: number; newInquiryCount: number }>();

  for (const inquiry of inquiries) {
    if (!inquiry.product_id || !productLookup.has(inquiry.product_id)) {
      continue;
    }

    const current = grouped.get(inquiry.product_id) ?? { inquiryCount: 0, newInquiryCount: 0 };
    current.inquiryCount += 1;
    if (inquiry.status === 'new') {
      current.newInquiryCount += 1;
    }
    grouped.set(inquiry.product_id, current);
  }

  return Array.from(grouped.entries())
    .map(([productId, metric]) => {
      const product = productLookup.get(productId);

      if (!product) {
        return null;
      }

      return {
        productId,
        name: product.name,
        slug: product.slug,
        inquiryCount: metric.inquiryCount,
        newInquiryCount: metric.newInquiryCount,
        isActive: product.is_active,
      };
    })
    .filter((metric): metric is ProductInterestMetric => Boolean(metric))
    .sort((a, b) => {
      if (b.inquiryCount !== a.inquiryCount) {
        return b.inquiryCount - a.inquiryCount;
      }
      return b.newInquiryCount - a.newInquiryCount;
    })
    .slice(0, 6);
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const [
      productRows,
      categoryRows,
      contactRes,
      jobsRes,
      inquiriesRes,
      activityRes,
      totalInquiriesRes,
      newInquiriesRes,
      productInterestInquiries,
    ] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, slug, is_active, stock, product_images(id)')
        .returns<ProductHealthRow[]>(),
      supabase.from('categories').select('is_active').returns<CategoryHealthRow[]>(),
      supabase.from('sales_contacts').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('job_vacancies').select('*', { count: 'exact', head: true }).eq('is_active', true),
      getInquiries({ limit: 5 }),
      getAuditLogs({ limit: 6 }),
      getInquiryCount(),
      getNewInquiriesCount(),
      supabase
        .from('inquiries')
        .select('product_id, status')
        .not('product_id', 'is', null)
        .limit(250)
        .returns<ProductInquiryRow[]>(),
    ]);

    const products = productRows.data ?? [];
    const categories = categoryRows.data ?? [];

    return {
      hasSupabase: true,
      counts: {
        products: products.length,
        categories: categories.length,
        visibleCategories: categories.filter((category) => category.is_active).length,
        hiddenProducts: products.filter((product) => !product.is_active).length,
        outOfStockProducts: products.filter((product) => product.stock === 0).length,
        lowStockProducts: products.filter((product) => product.is_active && product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD).length,
        missingImages: products.filter((product) => !product.product_images || product.product_images.length === 0).length,
        activeContacts: contactRes.count ?? 0,
        activeJobs: jobsRes.count ?? 0,
        newInquiries: newInquiriesRes.count,
        totalInquiries: totalInquiriesRes.count,
        recentActivities: (activityRes.data ?? []).length,
      },
      attention: {
        missingImages: products.filter((p) => !p.product_images || p.product_images.length === 0).length,
        lowStock: products.filter((p) => p.is_active && p.stock <= LOW_STOCK_THRESHOLD).length,
        hiddenProducts: products.filter((p) => !p.is_active).length,
        hiddenCategories: categories.filter((c) => !c.is_active).length,
      },
      productInterest: buildProductInterestMetrics(products, productInterestInquiries.data ?? []),
      recentInquiries: inquiriesRes.data ?? [],
      recentActivity: activityRes.data ?? [],
    };
  } catch (err) {
    console.warn('Dashboard data unavailable, using fallback.', err);
    return EMPTY;
  }
}
