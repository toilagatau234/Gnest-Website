'use client';

import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Percent, 
  Plus, 
  Trash2, 
  Check, 
  Edit3, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

import { useToast } from '@/components/admin/AdminToast';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { 
  addProductDiscountAction, 
  updateProductDiscountAction,
  deleteProductDiscountAction, 
  toggleProductDiscountActiveAction 
} from '@/app/admin/(dashboard)/products/media-discount-actions';

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
}

export function ProductBulkDiscountManager({ productId, discounts, retailPrice }: ProductBulkDiscountManagerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Editing discount state
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [editMinQuantity, setEditMinQuantity] = useState(0);
  const [editPricePerUnit, setEditPricePerUnit] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Add tier form state
  const [addMinQuantity, setAddMinQuantity] = useState('');
  const [addPricePerUnit, setAddPricePerUnit] = useState('');
  const [addIsActive, setAddIsActive] = useState(true);

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Action states
  const [addActionState, addAction, isAdding] = useActionState(
    async (state: any, formData: FormData) => {
      formData.append('product_id', productId);
      formData.append('min_quantity', addMinQuantity);
      formData.append('price_per_unit', addPricePerUnit);
      formData.append('is_active', String(addIsActive));

      const res = await addProductDiscountAction(state, formData);
      if (res.ok) {
        toast('Đã thêm bậc giá sỉ thành công.', 'success');
        setAddMinQuantity('');
        setAddPricePerUnit('');
        setAddIsActive(true);
        router.refresh();
      } else {
        toast(res.error || 'Thêm bậc sỉ thất bại.', 'error');
      }
      return res;
    },
    { ok: false }
  );

  const [editActionState, editAction, isSavingEdit] = useActionState(
    async (state: any, formData: FormData) => {
      if (!editingDiscountId) return state;

      formData.append('id', editingDiscountId);
      formData.append('min_quantity', String(editMinQuantity));
      formData.append('price_per_unit', editPricePerUnit);
      formData.append('is_active', String(editIsActive));

      const res = await updateProductDiscountAction(state, formData);
      if (res.ok) {
        toast('Đã cập nhật bậc giá sỉ.', 'success');
        setEditingDiscountId(null);
        router.refresh();
      } else {
        toast(res.error || 'Cập nhật thất bại.', 'error');
      }
      return res;
    },
    { ok: false }
  );

  // Sorted list of discounts by quantity ascending
  const sortedDiscounts = [...discounts].sort((a, b) => a.min_quantity - b.min_quantity);

  const handleToggleActive = (discountId: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleProductDiscountActiveAction(discountId, !currentActive);
      if (res.ok) {
        toast(!currentActive ? 'Đã kích hoạt bậc giá sỉ.' : 'Đã khóa bậc giá sỉ.', 'success');
        router.refresh();
      } else {
        toast(res.error || 'Không thể thay đổi trạng thái bậc sỉ.', 'error');
      }
    });
  };

  // Helper helper formatting to VND
  const formatCurrencyInput = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (!clean) return '';
    return Number(clean).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6 text-xs text-slate-700">
      
      {/* Pricing info cards */}
      <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/30 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-800">Giá bán lẻ niêm yết:</p>
          <p className="text-sm font-black text-[#1B3A6B] mt-0.5">
            {retailPrice !== null ? `${retailPrice.toLocaleString('vi-VN')} đ/sản phẩm` : 'Chưa niêm yết (Giá liên hệ)'}
          </p>
        </div>
        <div className="text-right text-[10px] text-slate-400 font-medium max-w-xs">
          Giá sỉ được áp dụng tự động cho khách mua buôn (B2B) dựa theo số lượng mua thực tế tại trang chi tiết sản phẩm.
        </div>
      </div>

      {/* Add discount form */}
      <form action={addAction} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
        <h4 className="font-extrabold text-[#1B3A6B] text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <Percent className="w-4 h-4 text-emerald-600" /> Thêm bậc giá sỉ (Wholesale Tier)
        </h4>

        {addActionState.error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 border border-red-100 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{addActionState.error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Mua tối thiểu từ (sản phẩm):</label>
            <input 
              type="number"
              min="1"
              placeholder="Ví dụ: 50"
              value={addMinQuantity}
              onChange={(e) => setAddMinQuantity(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg p-2 font-mono font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Đơn giá sỉ (đ/sản phẩm):</label>
            <input 
              type="text"
              placeholder="Ví dụ: 8,500"
              value={formatCurrencyInput(addPricePerUnit)}
              onChange={(e) => setAddPricePerUnit(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg p-2 font-mono font-bold"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-700">
              <input 
                type="checkbox"
                checked={addIsActive}
                onChange={(e) => setAddIsActive(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Kích hoạt bậc sỉ này</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isAdding || !addMinQuantity || !addPricePerUnit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Thêm bậc sỉ
          </button>
        </div>
      </form>

      {/* Edit discount form */}
      {editingDiscountId && (
        <form action={editAction} className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 space-y-4">
          <h4 className="font-extrabold text-[#1B3A6B] text-xs flex items-center gap-1.5 uppercase tracking-wider">
            Cập nhật chi tiết bậc giá sỉ
          </h4>

          {editActionState.error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 border border-red-100 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{editActionState.error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Mua tối thiểu từ (sản phẩm):</label>
              <input 
                type="number"
                min="1"
                value={editMinQuantity}
                onChange={(e) => setEditMinQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg p-2 font-mono font-bold"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Đơn giá sỉ (đ/sản phẩm):</label>
              <input 
                type="text"
                value={formatCurrencyInput(editPricePerUnit)}
                onChange={(e) => setEditPricePerUnit(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg p-2 font-mono font-bold"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-700">
                <input 
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
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
              className="px-3.5 py-2 border border-slate-200 bg-white rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSavingEdit ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}

      {/* Discount Tiers Table */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-slate-800 text-xs">Các bậc giá sỉ hiện hành ({sortedDiscounts.length})</h4>

        {sortedDiscounts.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/20 text-slate-400">
            <Percent className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-pulse" />
            <p className="font-bold">Chưa cấu hình bậc giá sỉ nào.</p>
            <p className="text-[10px] mt-0.5">Sản phẩm này sẽ chỉ hiển thị giá bán lẻ niêm yết trên Catalog.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-xs">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                  <th className="p-3">Mua tối thiểu</th>
                  <th className="p-3">Đơn giá bán sỉ</th>
                  <th className="p-3">Tỷ lệ chiết khấu</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sortedDiscounts.map((discount) => {
                  const discountPercent = retailPrice
                    ? Math.round(((retailPrice - discount.price_per_unit) / retailPrice) * 100)
                    : 0;

                  return (
                    <tr key={discount.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-700">
                        Từ {discount.min_quantity.toLocaleString('vi-VN')} sản phẩm
                      </td>
                      
                      <td className="p-3 font-mono font-black text-slate-800">
                        {discount.price_per_unit.toLocaleString('vi-VN')} đ/sản phẩm
                      </td>

                      <td className="p-3">
                        {discountPercent > 0 ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[9px] font-black text-green-700 leading-none">
                            Giảm -{discountPercent}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">N/A</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[9px] font-bold ${
                            discount.is_active
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                        >
                          {discount.is_active ? 'Đang áp dụng' : 'Tạm khóa'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(discount.id, discount.is_active)}
                            disabled={isPending}
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-bold transition-all disabled:opacity-60 ${
                              discount.is_active
                                ? 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {discount.is_active ? 'Khóa sỉ' : 'Kích hoạt'}
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
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" /> Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(discount.id)}
                            disabled={isPending}
                            className="admin-focus inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#E2E8F0] text-slate-500 transition hover:border-[#E31E24] hover:text-[#E31E24] cursor-pointer"
                            title="Xóa bậc sỉ"
                          >
                            <Trash2 className="w-3 h-3" />
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
        description="Khách hàng B2B sẽ không còn được chiết khấu mức giá này khi mua số lượng tương ứng nữa. Bạn có chắc chắn muốn xóa?"
        itemName="Bậc giá sỉ đã chọn"
        confirmLabel="Xóa bậc sỉ"
        onConfirm={async () => {
          if (!confirmDeleteId) return { ok: false, error: 'Thiếu ID bậc giá sỉ.' };
          return deleteProductDiscountAction(confirmDeleteId);
        }}
        onSuccess={() => {
          toast('Đã xóa bậc giá sỉ.', 'success');
          setConfirmDeleteId(null);
          router.refresh();
        }}
      />
    </div>
  );
}
