import { AlertCircle, Package } from 'lucide-react';

import { ProductForm } from '@/components/admin/ProductForm';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1B3A6B]">Sản phẩm</h1>
          <p className="mt-2 text-slate-600">Quản lý thông tin sản phẩm/dịch vụ hiển thị trên catalog.</p>
        </div>
        <div className="rounded-2xl border border-[#D7E0EC] bg-white px-4 py-3 text-sm shadow-sm">
          <p className="font-semibold text-[#1B3A6B]">{safeProducts.length} sản phẩm</p>
          <p className="text-slate-500">{safeProducts.filter((item) => item.is_active).length} đang hiển thị</p>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải dữ liệu sản phẩm</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      <ProductForm categories={safeCategories} />

      {!error && safeProducts.length === 0 ? (
        <div className="rounded-2xl border border-[#D7E0EC] bg-white p-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-[#F4F7FB] p-3">
              <Package className="h-6 w-6 text-[#1B3A6B]" />
            </div>
          </div>
          <p className="text-slate-700">Chưa có sản phẩm nào</p>
          <p className="mt-2 text-sm text-slate-500">Tạo sản phẩm đầu tiên sau khi đã có danh mục phù hợp.</p>
        </div>
      ) : null}

      {safeProducts.length > 0 ? <ProductsTable products={safeProducts} /> : null}
    </div>
  );
}
