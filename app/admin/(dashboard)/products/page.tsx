import { AlertCircle, Package } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { ProductBulkDialog } from '@/components/admin/ProductBulkDialog';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { ProductsTable } from '@/components/admin/ProductsTable';
import { getAdminCategories } from '@/lib/services/admin/categories';
import {
  getAdminProductsPage,
  getAdminProductStats,
  type ImageFilter,
  type PriceFilter,
  type StatusFilter,
  type StockFilter,
} from '@/lib/services/admin/products';
import { getActiveSpecTemplates } from '@/lib/services/admin/product-spec-templates';

export const dynamic = 'force-dynamic';

function parseStatus(v: unknown): StatusFilter | undefined {
  return v === 'active' || v === 'hidden' ? v : undefined;
}
function parseStock(v: unknown): StockFilter | undefined {
  return v === 'in_stock' || v === 'low_stock' || v === 'out_of_stock' ? v : undefined;
}
function parsePrice(v: unknown): PriceFilter | undefined {
  return v === 'fixed' || v === 'contact' ? v : undefined;
}
function parseImages(v: unknown): ImageFilter | undefined {
  return v === 'missing' || v === 'has_image' ? v : undefined;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // eslint-disable-next-line react-hooks/purity
  const _t0 = Date.now();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.pageSize) || 30));
  const q = typeof sp.q === 'string' && sp.q ? sp.q : undefined;
  const categoryId = typeof sp.categoryId === 'string' && sp.categoryId !== 'all' ? sp.categoryId : undefined;
  const status = parseStatus(sp.status);
  const stock = parseStock(sp.stock);
  const price = parsePrice(sp.price);
  const images = parseImages(sp.images);

  const [listResult, stats, { data: categories }, specTemplates] = await Promise.all([
    getAdminProductsPage({ page, pageSize, q, categoryId, status, stock, price, images }),
    getAdminProductStats(),
    getAdminCategories(),
    getActiveSpecTemplates(),
  ]);

  if (process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1') {
    // eslint-disable-next-line react-hooks/purity
    console.log(`[admin-timing] products page total: ${Date.now() - _t0}ms`);
  }

  const safeCategories = categories || [];

  return (
    <AdminSection>
      <AdminPageHeader
        title="Sản phẩm"
        description={`${stats.total} sản phẩm · ${stats.active} đang hiển thị`}
        action={
          <div className="flex items-center gap-2">
            <ProductBulkDialog categories={safeCategories} />
            <ProductFormDialog categories={safeCategories} specTemplates={specTemplates} />
          </div>
        }
      />

      {listResult.error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải dữ liệu sản phẩm</p>
            <p className="mt-1 text-sm text-[#B42318]">{listResult.error}</p>
          </div>
        </div>
      ) : null}

      {!listResult.error && listResult.total === 0 && !q && !status && !stock && !price && !categoryId && !images ? (
        <AdminEmptyState
          icon={<Package className="h-6 w-6" />}
          title="Chưa có sản phẩm nào"
          description="Tạo sản phẩm đầu tiên sau khi đã có danh mục phù hợp."
        />
      ) : null}
 
      {(!listResult.error && (listResult.total > 0 || q || status || stock || price || categoryId || images)) ? (
        <ProductsTable
          items={listResult.data}
          categories={safeCategories}
          specTemplates={specTemplates}
          pagination={{
            page: listResult.page,
            pageSize: listResult.pageSize,
            total: listResult.total,
            pageCount: listResult.pageCount,
          }}
          filters={{
            q: q ?? '',
            categoryId: categoryId ?? 'all',
            status: status ?? 'all',
            stock: stock ?? 'all',
            price: price ?? 'all',
            images: images ?? 'all',
          }}
          stats={stats}
        />
      ) : null}
    </AdminSection>
  );
}
