'use client';

import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ImageIcon, 
  Plus, 
  Trash2, 
  Check, 
  Star, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { useToast } from '@/components/admin/AdminToast';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { 
  uploadProductImageAction, 
  updateProductImageAction,
  deleteProductImageAction, 
  toggleProductImageActiveAction, 
  setProductPrimaryImageAction,
  reorderProductImagesAction
} from '@/app/admin/(dashboard)/products/media-discount-actions';

interface ProductImage {
  id: string;
  public_url: string | null;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  is_active: boolean;
}

interface ProductMediaManagerProps {
  productId: string;
  images: ProductImage[];
}

export function ProductMediaManager({ productId, images }: ProductMediaManagerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog / Edit states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [editIsActive, setEditIsActive] = useState(true);

  // Upload Form states
  const [file, setFile] = useState<File | null>(null);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadSortOrder, setUploadSortOrder] = useState(0);
  const [uploadIsPrimary, setUploadIsPrimary] = useState(false);

  // Upload Action
  const [uploadState, uploadAction, isUploading] = useActionState(
    async (state: any, formData: FormData) => {
      if (file) {
        formData.append('file', file);
      }
      formData.append('product_id', productId);
      formData.append('alt', uploadAlt);
      formData.append('sort_order', String(uploadSortOrder));
      formData.append('is_primary', String(uploadIsPrimary));

      const res = await uploadProductImageAction(state, formData);
      if (res.ok) {
        toast('Đã tải hình ảnh lên thành công.', 'success');
        setFile(null);
        setUploadAlt('');
        setUploadSortOrder(0);
        setUploadIsPrimary(false);
        router.refresh();
      } else {
        toast(res.error || 'Tải ảnh lên thất bại.', 'error');
      }
      return res;
    },
    { ok: false }
  );

  // Edit Action
  const [editState, editAction, isSavingEdit] = useActionState(
    async (state: any, formData: FormData) => {
      if (!editingImageId) return state;

      formData.append('id', editingImageId);
      formData.append('alt', editAlt);
      formData.append('sort_order', String(editSortOrder));
      formData.append('is_active', String(editIsActive));

      const res = await updateProductImageAction(state, formData);
      if (res.ok) {
        toast('Đã cập nhật hình ảnh.', 'success');
        setEditingImageId(null);
        router.refresh();
      } else {
        toast(res.error || 'Cập nhật thất bại.', 'error');
      }
      return res;
    },
    { ok: false }
  );

  // Sorted images by sort_order
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  // Trigger Primary image setting
  const handleSetPrimary = (imageId: string) => {
    startTransition(async () => {
      const res = await setProductPrimaryImageAction(productId, imageId);
      if (res.ok) {
        toast('Đã thiết lập làm ảnh chính.', 'success');
        router.refresh();
      } else {
        toast(res.error || 'Không thể thiết lập ảnh chính.', 'error');
      }
    });
  };

  // Trigger Active status toggling
  const handleToggleActive = (imageId: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleProductImageActiveAction(imageId, !currentActive);
      if (res.ok) {
        toast(!currentActive ? 'Đã hiển thị hình ảnh.' : 'Đã ẩn hình ảnh.', 'success');
        router.refresh();
      } else {
        toast(res.error || 'Không thể thay đổi trạng thái hình ảnh.', 'error');
      }
    });
  };

  // Reorder Handler: Shift Up or Down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedImages.length) return;

    startTransition(async () => {
      const reorderedList = [...sortedImages];
      // Swap elements
      const temp = reorderedList[index];
      reorderedList[index] = reorderedList[targetIndex];
      reorderedList[targetIndex] = temp;

      const orderedIds = reorderedList.map(img => img.id);
      const res = await reorderProductImagesAction(productId, orderedIds);
      if (res.ok) {
        toast('Đã thay đổi thứ tự hình ảnh.', 'success');
        router.refresh();
      } else {
        toast(res.error || 'Không thể thay đổi thứ tự.', 'error');
      }
    });
  };

  return (
    <div className="space-y-6 text-xs text-slate-700">
      
      {/* Upload image form */}
      <form action={uploadAction} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
        <h4 className="font-extrabold text-[#1B3A6B] text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <ImageIcon className="w-4 h-4 text-blue-600" /> Tải lên hình ảnh mới
        </h4>

        {uploadState.error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 border border-red-100 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{uploadState.error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Chọn tệp ảnh (JPG, PNG, WebP dưới 5MB):</label>
            <input 
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg p-2"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Mô tả ảnh (Alt text):</label>
            <input 
              type="text"
              placeholder="Ví dụ: Bình sữa Gnest 500ml màu đỏ..."
              value={uploadAlt}
              onChange={(e) => setUploadAlt(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg p-2"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">Thứ tự sắp xếp:</label>
              <input 
                type="number"
                min="0"
                value={uploadSortOrder}
                onChange={(e) => setUploadSortOrder(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg p-1.5 text-center font-bold font-mono"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-700">
              <input 
                type="checkbox"
                checked={uploadIsPrimary}
                onChange={(e) => setUploadIsPrimary(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Đặt làm ảnh đại diện chính</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isUploading || !file}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B3A6B] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0c1a30] transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Tải lên ảnh sỉ
          </button>
        </div>
      </form>

      {/* Inline Metadata Editing form */}
      {editingImageId && (
        <form action={editAction} className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 space-y-4">
          <h4 className="font-extrabold text-[#1B3A6B] text-xs flex items-center gap-1.5 uppercase tracking-wider">
            Cập nhật chi tiết ảnh
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Mô tả ảnh (Alt text):</label>
              <input 
                type="text"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg p-2"
                required
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <label className="block font-bold text-slate-700">Thứ tự sắp xếp:</label>
                <input 
                  type="number"
                  min="0"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg p-2 font-mono font-bold"
                />
              </div>

              <div className="space-y-2 pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-700">
                  <input 
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Kích hoạt (Hiển thị)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditingImageId(null)}
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

      {/* Image gallery listing */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-slate-800 text-xs">Danh sách hình ảnh hiện có ({sortedImages.length})</h4>

        {sortedImages.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/20 text-slate-400">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold">Sản phẩm này chưa có hình ảnh nào.</p>
            <p className="text-[10px] mt-0.5">Tải lên hình ảnh đầu tiên ở form trên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sortedImages.map((img, index) => {
              const hasUrl = !!img.public_url;
              return (
                <div 
                  key={img.id}
                  className={`rounded-xl border p-3 flex flex-col justify-between transition relative bg-white hover:shadow-md ${
                    img.is_primary 
                      ? 'border-blue-200 shadow-xs ring-1 ring-blue-500/25 bg-blue-50/5' 
                      : 'border-slate-200'
                  }`}
                >
                  {/* Primary & Active badges */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    {img.is_primary && (
                      <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-wide uppercase flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-white shrink-0" /> Ảnh đại diện
                      </span>
                    )}
                    {!img.is_active && (
                      <span className="bg-slate-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-wide uppercase">
                        Đang ẩn
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Image display */}
                  <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-100 relative bg-slate-50 flex items-center justify-center mb-3">
                    {hasUrl ? (
                      <img src={img.public_url!} alt={img.alt || 'Ảnh sản phẩm'} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  {/* Alt text and sort order details */}
                  <div className="space-y-1.5 mb-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-slate-800 line-clamp-1" title={img.alt || 'Không có mô tả'}>
                        {img.alt || <span className="text-slate-400 font-medium italic">Không có mô tả (alt)</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Lớp xếp: <span className="font-bold text-slate-700">#{img.sort_order}</span>
                      </p>
                    </div>

                    {/* Up / Down reordering buttons */}
                    <div className="flex gap-1 pt-1.5">
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0 || isPending}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Di chuyển lên trước"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === sortedImages.length - 1 || isPending}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Di chuyển xuống sau"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Action row buttons */}
                  <div className="flex items-center gap-1 border-t border-slate-100 pt-2 shrink-0">
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.id)}
                        disabled={isPending || !img.is_active}
                        className="flex-1 text-[9px] font-bold text-center bg-blue-50 text-blue-700 hover:bg-blue-100 rounded py-1 transition disabled:opacity-40 cursor-pointer"
                      >
                        Đặt chính
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleActive(img.id, img.is_active)}
                      disabled={isPending}
                      className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 cursor-pointer"
                      title={img.is_active ? 'Ẩn ảnh' : 'Hiện ảnh'}
                    >
                      {img.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingImageId(img.id);
                        setEditAlt(img.alt || '');
                        setEditSortOrder(img.sort_order);
                        setEditIsActive(img.is_active);
                      }}
                      disabled={isPending}
                      className="flex-1 text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-center rounded py-1 cursor-pointer"
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(img.id)}
                      disabled={isPending}
                      className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer"
                      title="Xóa hình ảnh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Xóa hình ảnh sản phẩm"
        description="Hành động này sẽ xóa vĩnh viễn hình ảnh khỏi dữ liệu và dọn dẹp bộ nhớ Storage. Bạn có chắc chắn muốn tiếp tục?"
        itemName="Hình ảnh đã chọn"
        confirmLabel="Xóa hình ảnh"
        onConfirm={async () => {
          if (!confirmDeleteId) return { ok: false, error: 'Thiếu ID hình ảnh.' };
          return deleteProductImageAction(confirmDeleteId);
        }}
        onSuccess={() => {
          toast('Đã xóa hình ảnh sản phẩm.', 'success');
          setConfirmDeleteId(null);
          router.refresh();
        }}
      />
    </div>
  );
}
