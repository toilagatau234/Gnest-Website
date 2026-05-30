import { Badge } from '@/components/ui/badge';
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
    <div className="rounded-2xl border border-[#D7E0EC] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px]">
          <thead className="border-b border-[#D7E0EC] bg-[#F4F7FB]">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Tên</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Slug</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Danh mục</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Giá</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Tồn</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Ảnh</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Trạng thái</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            {products.map((product) => (
              <tr key={product.id} className="transition-colors hover:bg-[#FFF9F9]">
                <td className="px-5 py-4 text-sm font-semibold text-slate-900">{product.name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{product.slug}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{product.categories?.name ?? '-'}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{formatPrice(product.price)}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{product.stock}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{product.product_images?.length ?? 0}</td>
                <td className="px-5 py-4 text-sm">
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Hiển thị' : 'Ẩn'}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <details className="text-left">
                      <summary className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#1B3A6B] hover:text-[#1B3A6B]">
                        Sửa
                      </summary>
                      <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-4xl rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-200">
                        <ProductForm categories={categories} product={product} />
                      </div>
                    </details>
                    <form action={toggleProductActiveAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="next_is_active" value={String(!product.is_active)} />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#E31E24] hover:text-[#E31E24]"
                      >
                        {product.is_active ? 'Ẩn' : 'Hiện'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
