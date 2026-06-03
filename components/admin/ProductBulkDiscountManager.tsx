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

function formatCurrencyInput(value: string) {
  const clean = value.replace(/[^0-9]/g, '');
  if (!clean) {
    return '';
  }

  return Number(clean).toLocaleString('vi-VN');
}

function parseCurrencyInput(value: string) {
  return Number(value.replace(/[^0-9]/g, '') || 0);
}

export function ProductBulkDiscountManager({
  productId,
  discounts,
  retailPrice,
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
        toast('Da them bac gia si thanh cong.', 'success');
        setAddMinQuantity('');
        setAddPricePerUnit('');
        setAddIsActive(true);
        router.refresh();
      } else {
        toast(result.error || 'Them bac si that bai.', 'error');
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
        toast('Da cap nhat bac gia si.', 'success');
        setEditingDiscountId(null);
        router.refresh();
      } else {
        toast(result.error || 'Cap nhat that bai.', 'error');
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

  const handleToggleActive = (discountId: string, currentActive: boolean) => {
    startTransition(async () => {
      const result = await toggleProductDiscountActiveAction(discountId, !currentActive);
      if (result.ok) {
        toast(!currentActive ? 'Da kich hoat bac gia si.' : 'Da tam khoa bac gia si.', 'success');
        router.refresh();
      } else {
        toast(result.error || 'Khong the thay doi trang thai bac si.', 'error');
      }
    });
  };

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/30 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-bold text-slate-800">Gia ban le niem yet</p>
          <p className="mt-0.5 text-sm font-black text-[#1B3A6B]">
            {retailPrice !== null
              ? `${retailPrice.toLocaleString('vi-VN')} d/san pham`
              : 'Chua niem yet gia le'}
          </p>
        </div>
        <div className="max-w-md text-[11px] font-medium leading-relaxed text-slate-500">
          Bac gia si duoc ap dung theo so luong mua tren trang chi tiet san pham. Nen dat gia si thap hon gia le
          de tranh cau hinh khong hop le.
        </div>
      </div>

      {!hasRetailPrice ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
          <p className="font-bold">Gia le dang thieu</p>
          <p className="mt-1 leading-relaxed">
            Ban van co the cau hinh bac gia si tu bay gio, nhung he thong chua tinh duoc ty le giam va khach hang
            se thay pricing dang o trang thai chua day du cho den khi co `Retail Price`.
          </p>
        </div>
      ) : null}

      <form action={addAction} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1B3A6B]">
          <Percent className="h-4 w-4 text-emerald-600" />
          Them bac gia si
        </h4>

        {addActionState.error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 font-medium text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{addActionState.error}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Mua toi thieu tu</label>
            <input
              type="number"
              min="1"
              placeholder="Vi du: 50"
              value={addMinQuantity}
              onChange={(event) => setAddMinQuantity(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Don gia si</label>
            <input
              type="text"
              placeholder="Vi du: 8,500"
              value={formatCurrencyInput(addPricePerUnit)}
              onChange={(event) => setAddPricePerUnit(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              required
            />
            {hasRetailPrice && addDiscountValue > 0 ? (
              <p className="text-[10px] font-medium text-slate-500">
                {addDiscountValue >= retailPrice
                  ? 'Canh bao: gia si dang lon hon hoac bang gia le.'
                  : `Uoc tinh giam ${Math.round(((retailPrice - addDiscountValue) / retailPrice) * 100)}% so voi gia le.`}
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
              <span>Kich hoat bac nay ngay</span>
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 text-[10px] font-medium leading-relaxed text-slate-500">
          Bac gia si khong thay the gia le. No chi duoc su dung khi khach mua dat nguong so luong toi thieu.
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isAdding || !addMinQuantity || !addPricePerUnit}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Them bac si
          </button>
        </div>
      </form>

      {editingDiscountId ? (
        <form action={editAction} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/20 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1B3A6B]">
            Cap nhat chi tiet bac gia si
          </h4>

          {editActionState.error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{editActionState.error}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Mua toi thieu tu</label>
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
              <label className="block font-bold text-slate-700">Don gia si</label>
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
                <span>Kich hoat bac si</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditingDiscountId(null)}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Luu thay doi
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-slate-800">
          Cac bac gia si hien hanh ({sortedDiscounts.length})
        </h4>

        {sortedDiscounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/20 p-8 text-center text-slate-400">
            <Percent className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="font-bold">Chua cau hinh bac gia si nao.</p>
            <p className="mt-0.5 text-[10px]">San pham nay hien chi co gia le / gia lien he.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-3">Mua toi thieu</th>
                  <th className="p-3">Don gia si</th>
                  <th className="p-3">Ty le giam</th>
                  <th className="p-3">Trang thai</th>
                  <th className="p-3 text-right">Thao tac</th>
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
                        Tu {discount.min_quantity.toLocaleString('vi-VN')} san pham
                      </td>

                      <td className="p-3 font-mono font-black text-slate-800">
                        {discount.price_per_unit.toLocaleString('vi-VN')} d/san pham
                      </td>

                      <td className="p-3">
                        {discountPercent === null ? (
                          <span className="font-normal italic text-slate-400">Can retail price</span>
                        ) : hasInvalidPriceGap ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700">
                            Chua hop le
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[9px] font-black leading-none text-green-700">
                            Giam -{discountPercent}%
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
                            {discount.is_active ? 'Dang ap dung' : 'Tam khoa'}
                          </span>
                          {hasInvalidPriceGap ? (
                            <span className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                              Gia si {'>='} gia le
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
                            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-bold transition-all disabled:opacity-60 ${
                              discount.is_active
                                ? 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {discount.is_active ? 'Tam khoa' : 'Kich hoat'}
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
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            <Edit3 className="h-3 w-3" />
                            Chinh sua
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(discount.id)}
                            disabled={isPending}
                            className="admin-focus inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#E2E8F0] text-slate-500 transition hover:border-[#E31E24] hover:text-[#E31E24]"
                            title="Xoa bac si"
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
        title="Xoa bac chiet khau si"
        description="Khach hang B2B se khong con duoc huong muc gia nay khi dat nguong so luong tuong ung. Ban co chac chan muon xoa?"
        itemName="Bac gia si da chon"
        confirmLabel="Xoa bac si"
        onConfirm={async () => {
          if (!confirmDeleteId) {
            return { ok: false, error: 'Thieu ID bac gia si.' };
          }

          return deleteProductDiscountAction(confirmDeleteId);
        }}
        onSuccess={() => {
          toast('Da xoa bac gia si.', 'success');
          setConfirmDeleteId(null);
          router.refresh();
        }}
      />
    </div>
  );
}
