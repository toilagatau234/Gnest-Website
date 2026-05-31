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
    activeContacts: number;
    newInquiries: number;
    totalInquiries: number;
  };
  attention: {
    missingImages: number;
    lowStock: number;
    hiddenProducts: number;
    hiddenCategories: number;
  };
  recentInquiries: Inquiry[];
  recentActivity: AuditLogEntry[];
}

const EMPTY: DashboardData = {
  hasSupabase: false,
  counts: { products: 0, categories: 0, activeContacts: 0, newInquiries: 0, totalInquiries: 0 },
  attention: { missingImages: 0, lowStock: 0, hiddenProducts: 0, hiddenCategories: 0 },
  recentInquiries: [],
  recentActivity: [],
};

type ProductHealthRow = {
  is_active: boolean;
  stock: number;
  product_images: { id: string }[] | null;
};

type CategoryHealthRow = { is_active: boolean };

export async function getDashboardData(): Promise<DashboardData> {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const [
      productRows,
      categoryRows,
      contactRes,
      inquiriesRes,
      activityRes,
      totalInquiriesRes,
      newInquiriesRes,
    ] = await Promise.all([
      supabase.from('products').select('is_active, stock, product_images(id)').returns<ProductHealthRow[]>(),
      supabase.from('categories').select('is_active').returns<CategoryHealthRow[]>(),
      supabase.from('sales_contacts').select('*', { count: 'exact', head: true }).eq('is_active', true),
      getInquiries({ limit: 5 }),
      getAuditLogs({ limit: 6 }),
      getInquiryCount(),
      getNewInquiriesCount(),
    ]);

    const products = productRows.data ?? [];
    const categories = categoryRows.data ?? [];

    return {
      hasSupabase: true,
      counts: {
        products: products.length,
        categories: categories.length,
        activeContacts: contactRes.count ?? 0,
        newInquiries: newInquiriesRes.count,
        totalInquiries: totalInquiriesRes.count,
      },
      attention: {
        missingImages: products.filter((p) => !p.product_images || p.product_images.length === 0).length,
        lowStock: products.filter((p) => p.is_active && p.stock <= LOW_STOCK_THRESHOLD).length,
        hiddenProducts: products.filter((p) => !p.is_active).length,
        hiddenCategories: categories.filter((c) => !c.is_active).length,
      },
      recentInquiries: inquiriesRes.data ?? [],
      recentActivity: activityRes.data ?? [],
    };
  } catch (err) {
    console.warn('Dashboard data unavailable, using fallback.', err);
    return EMPTY;
  }
}
