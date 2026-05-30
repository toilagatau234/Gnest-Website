import { Badge } from '@/components/ui/badge';
import type { AdminProduct } from '@/lib/services/admin/products';

import { toggleProductActiveAction } from '@/app/admin/(dashboard)/products/actions';

interface ProductsTableProps {
  products: AdminProduct[];
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

export function ProductsTable({ products }: ProductsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#D7E0EC] bg-white shadow-sm">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
