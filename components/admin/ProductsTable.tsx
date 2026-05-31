import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { AdminTableShell, AdminTh } from '@/components/admin/AdminTableShell';
import { ProductForm } from '@/components/admin/ProductForm';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { AdminProduct } from '@/lib/services/admin/products';

import { toggleProductActiveAction } from '@/app/admin/(dashboard)/products/actions';

interface ProductsTableProps {
  products: AdminProduct[];
  categories: AdminCategory[];
}

function formatPrice(price: number | null) {
  if (price === null) {
    return 'Liên hệ';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  return (
    <AdminTableShell
      minWidth={920}
      head={
        <>
          <AdminTh>Tên</AdminTh>
          <AdminTh>Slug</AdminTh>
          <AdminTh>Danh mục</AdminTh>
          <AdminTh>Giá</AdminTh>
          <AdminTh>Tồn</AdminTh>
          <AdminTh>Ảnh</AdminTh>
          <AdminTh>Trạng thái</AdminTh>
          <AdminTh align="right">Thao tác</AdminTh>
        </>
      }
    >
      {products.map((product) => (
        <tr key={product.id} className="transition-colors hover:bg-[#F1F5F9]">
          <td className="px-5 py-3 text-sm font-semibold text-slate-900">{product.name}</td>
          <td className="px-5 py-3 text-sm text-slate-600">{product.slug}</td>
          <td className="px-5 py-3 text-sm text-slate-600">{product.categories?.name ?? '-'}</td>
          <td className="px-5 py-3 text-sm text-slate-600">{formatPrice(product.price)}</td>
          <td className="px-5 py-3 text-sm text-slate-600">{product.stock}</td>
          <td className="px-5 py-3 text-sm text-slate-600">{product.product_images?.length ?? 0}</td>
          <td className="px-5 py-3 text-sm">
            <AdminStatusChip tone={product.is_active ? 'success' : 'neutral'}>
              {product.is_active ? 'Hiển thị' : 'Ẩn'}
            </AdminStatusChip>
          </td>
          <td className="px-5 py-3 text-right text-sm">
            <div className="flex justify-end gap-2">
              <details className="text-left">
                <summary className="admin-focus cursor-pointer rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#1B3A6B] hover:text-[#1B3A6B]">
                  Sửa
                </summary>
                <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-4xl rounded-2xl bg-white p-2 shadow-admin-pop ring-1 ring-[#E2E8F0]">
                  <ProductForm categories={categories} product={product} />
                </div>
              </details>
              <form action={toggleProductActiveAction}>
                <input type="hidden" name="id" value={product.id} />
                <input type="hidden" name="next_is_active" value={String(!product.is_active)} />
                <button
                  type="submit"
                  className="admin-focus rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#E31E24] hover:text-[#E31E24]"
                >
                  {product.is_active ? 'Ẩn' : 'Hiện'}
                </button>
              </form>
            </div>
          </td>
        </tr>
      ))}
    </AdminTableShell>
  );
}
