'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, FileSpreadsheet, Loader2, Plus, Table2, Trash2, Upload } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { ProductImportDialog } from '@/components/admin/ProductImportDialog';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminCategory } from '@/lib/services/admin/categories';
import { createProductAction } from '@/app/admin/(dashboard)/products/actions';

type RowStatus = 'waiting' | 'validating' | 'uploading' | 'creating' | 'success' | 'failed';

type BulkRow = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  price: string;
  stock: string;
  isActive: boolean;
  files: File[];
  primaryImageIndex: number;
  status: RowStatus;
  error?: string;
};

const BATCH_SIZE = 10;
const MAX_IMAGES_PER_ROW = 5;

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function createRow(seed = Date.now()): BulkRow {
  return {
    id: `${seed}-${Math.random().toString(36).slice(2)}`,
    name: '',
    slug: '',
    categoryId: '',
    price: '',
    stock: '0',
    isActive: true,
    files: [],
    primaryImageIndex: 0,
    status: 'waiting',
  };
}

function statusLabel(status: RowStatus) {
  switch (status) {
    case 'validating':
      return 'Validating';
    case 'uploading':
      return 'Uploading images';
    case 'creating':
      return 'Creating product';
    case 'success':
      return 'Success';
    case 'failed':
      return 'Failed';
    default:
      return 'Waiting';
  }
}

export function ProductBulkCreateDialog({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'manual' | 'excel'>('manual');
  const [rows, setRows] = useState<BulkRow[]>(() => [createRow()]);
  const [isPending, startTransition] = useTransition();

  const activeCategories = useMemo(() => categories.filter((category) => category.is_active), [categories]);
  const successCount = rows.filter((row) => row.status === 'success').length;
  const failedCount = rows.filter((row) => row.status === 'failed').length;

  function patchRow(rowId: string, patch: Partial<BulkRow>) {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch, error: patch.error } : row)));
  }

  function addRows(count: number) {
    setRows((current) => [...current, ...Array.from({ length: count }, (_, index) => createRow(Date.now() + index))]);
  }

  function duplicateRow(row: BulkRow) {
    setRows((current) => [
      ...current,
      { ...row, id: createRow().id, status: 'waiting', error: undefined, files: [] },
    ]);
  }

  function validateRow(row: BulkRow): string | null {
    if (!row.name.trim()) return 'Tên sản phẩm là bắt buộc.';
    if (!row.slug.trim()) return 'Slug là bắt buộc.';
    if (Number(row.stock || 0) < 0) return 'Tồn kho không được âm.';
    if (row.price && Number(row.price) < 0) return 'Giá không được âm.';
    if (row.files.length > MAX_IMAGES_PER_ROW) return `Tối đa ${MAX_IMAGES_PER_ROW} ảnh cho mỗi dòng.`;
    return null;
  }

  async function submitRow(row: BulkRow) {
    patchRow(row.id, { status: 'validating', error: undefined });
    const error = validateRow(row);
    if (error) {
      patchRow(row.id, { status: 'failed', error });
      return false;
    }

    patchRow(row.id, { status: row.files.length > 0 ? 'uploading' : 'creating' });
    const formData = new FormData();
    formData.set('name', row.name.trim());
    formData.set('slug', row.slug.trim());
    formData.set('category_id', row.categoryId);
    formData.set('price', row.price);
    formData.set('stock', row.stock || '0');
    formData.set('description', '');
    formData.set('specs', '{}');
    formData.set('is_active', String(row.isActive));
    formData.set('primary_image_index', String(row.primaryImageIndex));
    row.files.forEach((file) => formData.append('product_images', file));

    patchRow(row.id, { status: 'creating' });
    const result = await createProductAction({ ok: false }, formData);
    if (!result.ok) {
      patchRow(row.id, { status: 'failed', error: result.error ?? 'Tạo sản phẩm thất bại.' });
      return false;
    }

    patchRow(row.id, { status: 'success', error: undefined });
    return true;
  }

  function submitManualRows() {
    startTransition(async () => {
      let created = 0;
      const editableRows = rows.filter((row) => row.status !== 'success');
      for (let index = 0; index < editableRows.length; index += BATCH_SIZE) {
        const batch = editableRows.slice(index, index + BATCH_SIZE);
        for (const row of batch) {
          const ok = await submitRow(row);
          if (ok) created += 1;
        }
      }

      if (created > 0) {
        toast(`Đã tạo ${created} sản phẩm.`, 'success');
        router.refresh();
      } else {
        toast('Chưa có sản phẩm nào được tạo. Kiểm tra lỗi từng dòng.', 'error');
      }
    });
  }

  return (
    <>
      <AdminActionButton variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => setOpen(true)}>
        Thêm nhiều sản phẩm
      </AdminActionButton>

      <AdminModal
        open={open}
        onClose={() => {
          if (!isPending) setOpen(false);
        }}
        title="Thêm nhiều sản phẩm"
        description="Tạo theo bảng thủ công hoặc nhập dữ liệu từ Excel. Excel không nhập ảnh."
        size="2xl"
        dismissible={!isPending}
      >
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-slate-200">
            {[
              { id: 'manual' as const, label: 'Manual Table Input', icon: Table2 },
              { id: 'excel' as const, label: 'Excel Import', icon: FileSpreadsheet },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                    active ? 'border-[#1B3A6B] text-[#1B3A6B]' : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {tab === 'excel' ? (
            <ProductImportDialog embedded />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold text-slate-600">
                  {rows.length} dòng · {successCount} thành công · {failedCount} lỗi
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => addRows(1)} className="admin-button-secondary px-3 py-2 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Thêm dòng
                  </button>
                  <button type="button" onClick={() => addRows(5)} className="admin-button-secondary px-3 py-2 text-xs">
                    +5 dòng
                  </button>
                  <button
                    type="button"
                    onClick={submitManualRows}
                    disabled={isPending}
                    className="admin-button-primary px-4 py-2 text-xs"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Tạo theo batch {BATCH_SIZE}
                  </button>
                </div>
              </div>

              <div className="max-h-[520px] overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-[1120px] w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Tên</th>
                      <th className="px-3 py-2">Slug</th>
                      <th className="px-3 py-2">Danh mục</th>
                      <th className="px-3 py-2">Giá</th>
                      <th className="px-3 py-2">Kho</th>
                      <th className="px-3 py-2">Ảnh</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                      <tr key={row.id} className={row.status === 'success' ? 'bg-emerald-50/50' : 'bg-white'}>
                        <td className="px-3 py-2">
                          <input
                            value={row.name}
                            disabled={row.status === 'success' || isPending}
                            onChange={(event) => {
                              const name = event.target.value;
                              patchRow(row.id, { name, slug: row.slug ? row.slug : slugify(name), status: 'waiting' });
                            }}
                            className="admin-input h-9 min-w-48 text-xs"
                            placeholder="Tên sản phẩm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={row.slug}
                            disabled={row.status === 'success' || isPending}
                            onChange={(event) => patchRow(row.id, { slug: event.target.value, status: 'waiting' })}
                            className="admin-input h-9 min-w-44 font-mono text-xs"
                            placeholder="slug-san-pham"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={row.categoryId}
                            disabled={row.status === 'success' || isPending}
                            onChange={(event) => patchRow(row.id, { categoryId: event.target.value, status: 'waiting' })}
                            className="admin-select h-9 min-w-44 text-xs"
                          >
                            <option value="">Chưa phân loại</option>
                            {activeCategories.map((category) => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={row.price}
                            disabled={row.status === 'success' || isPending}
                            onChange={(event) => patchRow(row.id, { price: event.target.value, status: 'waiting' })}
                            className="admin-input h-9 w-28 text-xs"
                            type="number"
                            min="0"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={row.stock}
                            disabled={row.status === 'success' || isPending}
                            onChange={(event) => patchRow(row.id, { stock: event.target.value, status: 'waiting' })}
                            className="admin-input h-9 w-24 text-xs"
                            type="number"
                            min="0"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            disabled={row.status === 'success' || isPending}
                            onChange={(event) =>
                              patchRow(row.id, {
                                files: Array.from(event.target.files ?? []).slice(0, MAX_IMAGES_PER_ROW),
                                primaryImageIndex: 0,
                                status: 'waiting',
                              })
                            }
                            className="block w-40 text-[10px] text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-slate-600"
                          />
                          {row.files.length > 1 ? (
                            <select
                              value={row.primaryImageIndex}
                              disabled={row.status === 'success' || isPending}
                              onChange={(event) => patchRow(row.id, { primaryImageIndex: Number(event.target.value) })}
                              className="mt-1 w-40 rounded border border-slate-200 bg-white px-2 py-1 text-[10px]"
                            >
                              {row.files.map((file, index) => (
                                <option key={`${file.name}-${index}`} value={index}>Thumbnail #{index + 1}</option>
                              ))}
                            </select>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${
                            row.status === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : row.status === 'failed'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {statusLabel(row.status)}
                          </span>
                          {row.error ? <p className="mt-1 max-w-48 text-[10px] font-medium text-rose-600">{row.error}</p> : null}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => duplicateRow(row)}
                              disabled={isPending}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                              title="Nhân bản dòng"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                              disabled={isPending || rows.length === 1}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600 disabled:opacity-40"
                              title="Xóa dòng"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AdminModal>
    </>
  );
}
