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
const SHOULD_LOG_TIMINGS =
  process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1';

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

// Minimal product fields for the interest chart and missing-images count.
// stock is excluded — stock-related stats use targeted COUNT queries instead.
type ProductHealthRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  product_images: { id: string }[] | null;
};

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
    const t0 = SHOULD_LOG_TIMINGS ? performance.now() : 0;

    // --- Parallel data fetching ---
    // Category counts use HEAD-only COUNT queries (no rows transferred).
    // Product stock stats use targeted COUNT queries instead of a full scan.
    // A slim product scan (no stock column) is kept only for missing-images
    // counting and the product-interest chart.
    const [
      // Product count queries
      { count: totalProducts },
      { count: hiddenProducts },
      { count: outOfStockProducts },
      { count: lowStockProducts },
      { count: attentionLowStock },
      // Category count queries
      { count: totalCategories },
      { count: visibleCategories },
      // Slim product scan — id/name/slug/is_active/images only
      productRows,
      // Existing lightweight queries (unchanged)
      contactRes,
      jobsRes,
      inquiriesRes,
      activityRes,
      totalInquiriesRes,
      newInquiriesRes,
      productInterestInquiries,
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', false),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('stock', 0),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).gt('stock', 0).lte('stock', LOW_STOCK_THRESHOLD),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).lte('stock', LOW_STOCK_THRESHOLD),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase
        .from('products')
        .select('id, name, slug, is_active, product_images(id)')
        .returns<ProductHealthRow[]>(),
      supabase.from('sales_contacts').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('job_vacancies').select('id', { count: 'exact', head: true }).eq('is_active', true),
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

    if (t0) console.info(`[admin:dashboard] getDashboardData ${(performance.now() - t0).toFixed(1)}ms`);

    const products = productRows.data ?? [];
    const missingImagesCount = products.filter(
      (p) => !p.product_images || p.product_images.length === 0,
    ).length;
    const hiddenCategoriesCount = (totalCategories ?? 0) - (visibleCategories ?? 0);

    return {
      hasSupabase: true,
      counts: {
        products: totalProducts ?? 0,
        categories: totalCategories ?? 0,
        visibleCategories: visibleCategories ?? 0,
        hiddenProducts: hiddenProducts ?? 0,
        outOfStockProducts: outOfStockProducts ?? 0,
        lowStockProducts: lowStockProducts ?? 0,
        missingImages: missingImagesCount,
        activeContacts: contactRes.count ?? 0,
        activeJobs: jobsRes.count ?? 0,
        newInquiries: newInquiriesRes.count,
        totalInquiries: totalInquiriesRes.count,
        recentActivities: (activityRes.data ?? []).length,
      },
      attention: {
        missingImages: missingImagesCount,
        lowStock: attentionLowStock ?? 0,
        hiddenProducts: hiddenProducts ?? 0,
        hiddenCategories: hiddenCategoriesCount,
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
