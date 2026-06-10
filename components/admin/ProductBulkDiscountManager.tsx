'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';
import { AlertCircle, Check, Edit3, Loader2, Percent, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { useToast } from '@/components/admin/AdminToast';
import {
  addProductDiscountAction,
  deleteProductDiscountAction,
  toggleProductDiscountActiveAction,
  updateProductDiscountAction,
  type ActionState,
} from '@/app/admin/(dashboard)/products/media-discount-actions';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils/currency';

interface ProductDiscount {
  id: string;
  product_id: string;
  min_quantity: number;
  price_per_unit: number;
  is_active: boolean;
}

interface ProductBulkDiscountManagerProps {
  productId: string;
  discounts: ProductDiscount[];
  retailPrice: number | null;
  onMutated?: () => void | Promise<void>;
}


export function ProductBulkDiscountManager({
  productId,
  discounts,
  retailPrice,
  onMutated,
}: ProductBulkDiscountManagerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [editMinQuantity, setEditMinQuantity] = useState(0);
  const [editPricePerUnit, setEditPricePerUnit] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  const [addMinQuantity, setAddMinQuantity] = useState('');
  const [addPricePerUnit, setAddPricePerUnit] = useState('');
  const [addIsActive, setAddIsActive] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [addActionState, addAction, isAdding] = useActionState(
    async (state: ActionState, formData: FormData) => {
      formData.append('product_id', productId);
      formData.append('min_quantity', addMinQuantity);
      formData.append('price_per_unit', addPricePerUnit);
      formData.append('is_active', String(addIsActive));

      const result = await addProductDiscountAction(state, formData);
      if (result.ok) {
        toast('Đã thêm bậc giá sỉ thành công.', 'success');
        setAddMinQuantity('');
        setAddPricePerUnit('');
        setAddIsActive(true);
        if (onMutated) await onMutated();
        router.refresh();
      } else {
        toast(result.error || 'Thêm bậc sỉ thất bại.', 'error');
      }

      return result;
    },
    { ok: false },
  );

  const [editActionState, editAction, isSavingEdit] = useActionState(
    async (state: ActionState, formData: FormData) => {
      if (!editingDiscountId) {
        return state;
      }

      formData.append('id', editingDiscountId);
      formData.append('min_quantity', String(editMinQuantity));
      formData.append('price_per_unit', editPricePerUnit);
      formData.append('is_active', String(editIsActive));

      const result = await updateProductDiscountAction(state, formData);
      if (result.ok) {
        toast('Đã cập nhật bậc giá sỉ.', 'success');
        setEditingDiscountId(null);
        if (onMutated) await onMutated();
        router.refresh();
      } else {
        toast(result.error || 'Cập nhật thất bại.', 'error');
      }

      return result;
    },
    { ok: false },
  );

  const sortedDiscounts = useMemo(
    () => [...discounts].sort((a, b) => a.min_quantity - b.min_quantity),
    [discounts],
  );

  const addDiscountValue = parseCurrencyInput(addPricePerUnit);
  const hasRetailPrice = retailPrice !== null;

  const addButtonDisabledReason = !addMinQuantity
    ? 'Nhập số lượng mua tối thiểu'
    : !addPricePerUnit
      ? 'Nhập đơn giá sỉ'
      : null;

  const handleToggleActive = (discountId: string, currentActive: boolean) => {
    startTransition(async () => {
      const result = await toggleProductDiscountActiveAction(discountId, !currentActive);
      if (result.ok) {
        toast(!currentActive ? 'Đã kích hoạt bậc giá sỉ.' : 'Đã tạm khóa bậc giá sỉ.', 'success');
        if (onMutated) await onMutated();
        router.refresh();
      } else {
        toast(result.error || 'Không thể thay đổi trạng thái bậc sỉ.', 'error');
      }
    });
  };

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/30 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-bold text-slate-800">Giá bán lẻ niêm yết</p>
          <p className="mt-0.5 text-sm font-black text-[#1B3A6B]">
            {retailPrice !== null
              ? `${retailPrice.toLocaleString('vi-VN')} đ/sản phẩm`
              : 'Chưa niêm yết giá lẻ'}
          </p>
        </div>
        <div className="max-w-md text-[11px] font-medium leading-relaxed text-slate-500">
          Bậc giá sỉ được áp dụng theo số lượng mua trên trang chi tiết sản phẩm. Nên đặt giá sỉ thấp hơn giá lẻ
          để tránh cấu hình không hợp lệ.
        </div>
      </div>

      {!hasRetailPrice ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
          <p className="font-bold">Giá lẻ đang thiếu</p>
          <p className="mt-1 leading-relaxed">
            Bạn vẫn có thể cấu hình bậc giá sỉ từ bây giờ, nhưng hệ thống chưa tính được tỉ lệ giảm và khách hàng
            sẽ thấy pricing đang ở trạng thái chưa đầy đủ cho đến khi có giá lẻ.
          </p>
        </div>
      ) : null}

      <form action={addAction} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1B3A6B]">
          <Percent className="h-4 w-4 text-emerald-600" />
          Thêm bậc giá sỉ
        </h4>

        {addActionState.error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 font-medium text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{addActionState.error}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Mua tối thiểu từ</label>
            <input
              type="number"
              min="1"
              placeholder="Ví dụ: 50"
              value={addMinQuantity}
              onChange={(event) => setAddMinQuantity(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Đơn giá sỉ</label>
            <input
              type="text"
              placeholder="Ví dụ: 8.500"
              value={formatCurrencyInput(addPricePerUnit)}
              onChange={(event) => setAddPricePerUnit(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              required
            />
            {hasRetailPrice && addDiscountValue > 0 ? (
              <p className="text-[10px] font-medium text-slate-500">
                {addDiscountValue >= retailPrice
                  ? 'Cảnh báo: giá sỉ đang lớn hơn hoặc bằng giá lẻ.'
                  : `Ước tính giảm ${Math.round(((retailPrice - addDiscountValue) / retailPrice) * 100)}% so với giá lẻ.`}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 pt-6">
            <label className="flex cursor-pointer items-center gap-2 font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={addIsActive}
                onChange={(event) => setAddIsActive(event.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Kích hoạt bậc này ngay</span>
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 text-[10px] font-medium leading-relaxed text-slate-500">
          Bậc giá sỉ không thay thế giá lẻ. Nó chỉ được sử dụng khi khách mua đạt ngưỡng số lượng tối thiểu.
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          {addButtonDisabledReason ? (
            <p className="text-[10px] font-medium text-amber-600">{addButtonDisabledReason}</p>
          ) : null}
          <button
            type="submit"
            disabled={isAdding || Boolean(addButtonDisabledReason)}
            title={addButtonDisabledReason ?? undefined}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Thêm bậc sỉ
          </button>
        </div>
      </form>

      {editingDiscountId ? (
        <form action={editAction} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/20 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1B3A6B]">
            Cập nhật chi tiết bậc giá sỉ
          </h4>

          {editActionState.error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{editActionState.error}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Mua tối thiểu từ</label>
              <input
                type="number"
                min="1"
                value={editMinQuantity}
                onChange={(event) => setEditMinQuantity(Math.max(1, parseInt(event.target.value) || 1))}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Đơn giá sỉ</label>
              <input
                type="text"
                value={formatCurrencyInput(editPricePerUnit)}
                onChange={(event) => setEditPricePerUnit(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <label className="flex cursor-pointer items-center gap-2 font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(event) => setEditIsActive(event.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Kích hoạt bậc sỉ</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditingDiscountId(null)}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-slate-800">
          Các bậc giá sỉ hiện hành ({sortedDiscounts.length})
        </h4>

        {sortedDiscounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/20 p-8 text-center text-slate-400">
            <Percent className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="font-bold">Chưa cấu hình bậc giá sỉ nào.</p>
            <p className="mt-0.5 text-[10px]">Sản phẩm này hiện chỉ có giá lẻ / giá liên hệ.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-3">Mua tối thiểu</th>
                  <th className="p-3">Đơn giá sỉ</th>
                  <th className="p-3">Tỉ lệ giảm</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sortedDiscounts.map((discount) => {
                  const discountPercent =
                    retailPrice && retailPrice > 0
                      ? Math.round(((retailPrice - discount.price_per_unit) / retailPrice) * 100)
                      : null;

                  const hasInvalidPriceGap =
                    retailPrice !== null && discount.price_per_unit >= retailPrice;

                  return (
                    <tr key={discount.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-700">
                        Từ {discount.min_quantity.toLocaleString('vi-VN')} sản phẩm
                      </td>

                      <td className="p-3 font-mono font-black text-slate-800">
                        {discount.price_per_unit.toLocaleString('vi-VN')} đ/sp
                      </td>

                      <td className="p-3">
                        {discountPercent === null ? (
                          <span className="font-normal italic text-slate-400">Cần giá lẻ</span>
                        ) : hasInvalidPriceGap ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700">
                            Chưa hợp lệ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[9px] font-black leading-none text-green-700">
                            Giảm -{discountPercent}%
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[9px] font-bold ${
                              discount.is_active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-400'
                            }`}
                          >
                            {discount.is_active ? 'Đang áp dụng' : 'Tạm khóa'}
                          </span>
                          {hasInvalidPriceGap ? (
                            <span className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                              Giá sỉ ≥ giá lẻ
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(discount.id, discount.is_active)}
                            disabled={isPending}
                            className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-[10px] font-bold transition-all disabled:opacity-60 ${
                              discount.is_active
                                ? 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {discount.is_active ? 'Tạm khóa' : 'Kích hoạt'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingDiscountId(discount.id);
                              setEditMinQuantity(discount.min_quantity);
                              setEditPricePerUnit(String(discount.price_per_unit));
                              setEditIsActive(discount.is_active);
                            }}
                            disabled={isPending}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            <Edit3 className="h-3 w-3" />
                            Chỉnh sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(discount.id)}
                            disabled={isPending}
                            className="admin-focus inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-[#E2E8F0] text-slate-500 transition hover:border-[#E31E24] hover:text-[#E31E24]"
                            title="Xóa bậc sỉ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Xóa bậc chiết khấu sỉ"
        description="Khách hàng B2B sẽ không còn được hưởng mức giá này khi đặt ngưỡng số lượng tương ứng. Bạn có chắc chắn muốn xóa?"
        itemName="Bậc giá sỉ đã chọn"
        confirmLabel="Xóa bậc sỉ"
        onConfirm={async () => {
          if (!confirmDeleteId) {
            return { ok: false, error: 'Thiếu ID bậc giá sỉ.' };
          }

          return deleteProductDiscountAction(confirmDeleteId);
        }}
        onSuccess={async () => {
          toast('Đã xóa bậc giá sỉ.', 'success');
          setConfirmDeleteId(null);
          if (onMutated) await onMutated();
          router.refresh();
        }}
      />
    </div>
  );
}
