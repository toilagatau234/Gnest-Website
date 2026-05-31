import { AlertCircle, Package } from 'lucide-react';

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
<<<<<<< HEAD
import { ProductForm } from '@/components/admin/ProductForm';
=======
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
import { ProductsTable } from '@/components/admin/ProductsTable';
import { getAdminCategories } from '@/lib/services/admin/categories';
import { getAdminProducts } from '@/lib/services/admin/products';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] =
    await Promise.all([getAdminProducts(), getAdminCategories()]);

  const safeProducts = products || [];
  const safeCategories = categories || [];
  const error = productsError || categoriesError;
  const activeCount = safeProducts.filter((item) => item.is_active).length;

  return (
    <AdminSection>
      <AdminPageHeader
        title="Sản phẩm"
<<<<<<< HEAD
        description="Quản lý thông tin sản phẩm/dịch vụ hiển thị trên catalog."
        action={
          <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm shadow-admin">
            <p className="font-semibold text-[#1B3A6B]">{safeProducts.length} sản phẩm</p>
            <p className="text-slate-500">{activeCount} đang hiển thị</p>
          </div>
        }
=======
        description={`${safeProducts.length} sản phẩm · ${activeCount} đang hiển thị`}
        action={<ProductFormDialog categories={safeCategories} />}
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
      />

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải dữ liệu sản phẩm</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      {!error && safeProducts.length === 0 ? (
        <AdminEmptyState
          icon={<Package className="h-6 w-6" />}
          title="Chưa có sản phẩm nào"
          description="Tạo sản phẩm đầu tiên sau khi đã có danh mục phù hợp."
          action={<ProductFormDialog categories={safeCategories} />}
        />
      ) : null}

      {safeProducts.length > 0 ? (
        <ProductsTable products={safeProducts} categories={safeCategories} />
      ) : null}
    </AdminSection>
  );
}
