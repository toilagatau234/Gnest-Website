'use client';

import { useRef, useState, useTransition } from 'react';
import { AlertCircle, CheckCircle2, ImageIcon, Loader2, Upload, X } from 'lucide-react';

import { AdminToggle } from '@/components/admin/AdminToggle';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { CategoryType } from '@/lib/types/database';
import type { AdminFormState } from '@/app/admin/(dashboard)/categories/actions';
import {
  uploadCategoryImageAction,
  type CategoryImageUploadState,
} from '@/app/admin/(dashboard)/categories/actions';

interface CategoryFormProps {
  formId: string;
  formAction: (payload: FormData) => void;
  state: AdminFormState;
  categories: AdminCategory[];
  category?: AdminCategory;
  fixedType?: CategoryType;
}

const fieldClass = 'admin-input text-xs';
const selectClass = 'admin-select text-xs';
const labelClass = 'mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]';
const helperClass = 'mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400';

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function CategoryForm({ formId, formAction, state, categories, category, fixedType }: CategoryFormProps) {
  const availableParents = categories.filter((item) => {
    if (item.id === category?.id) return false;
    if (fixedType && item.type !== fixedType) return false;
    return true;
  });
  const defaultType: CategoryType = fixedType ?? category?.type ?? 'product';
  const isService = fixedType === 'service' || defaultType === 'service';

  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? '');

  // Upload state
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadState, setUploadState] = useState<CategoryImageUploadState>({ ok: false });
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const canUpload = isService && Boolean(category?.id);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  function handleFileUpload(file: File) {
    setUploadState({ ok: false });
    setUploadSuccess(false);

    const fd = new FormData();
    fd.append('category_id', category!.id);
    fd.append('file', file);

    startTransition(async () => {
      const result = await uploadCategoryImageAction({ ok: false }, fd);
      if (result.ok && result.url) {
        setImageUrl(result.url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 4000);
      } else {
        setUploadState(result);
      }
    });
  }

  return (
    <form id={formId} action={formAction} className="space-y-5">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      {state.error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
          <p className="text-xs font-medium text-[#B42318]">{state.error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>
            {isService ? 'Tên dịch vụ' : 'Tên danh mục'} <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="name"
            required
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            className={fieldClass}
            placeholder={fixedType === 'service' ? 'VD: In chai lọ thủy tinh' : 'VD: Hũ thủy tinh'}
          />
        </label>

        <label className="block">
          <span className={labelClass}>
            Slug / Đường dẫn URL <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="slug"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className={`${fieldClass} font-mono`}
            placeholder="hu-thuy-tinh"
          />
        </label>

        {fixedType ? (
          <input type="hidden" name="type" value={fixedType} />
        ) : (
          <label className="block">
            <span className={labelClass}>Loại danh mục</span>
            <select name="type" defaultValue={defaultType} className={selectClass}>
              <option value="product">Sản phẩm</option>
              <option value="service">Dịch vụ</option>
            </select>
          </label>
        )}

        {fixedType !== 'service' && (
          <label className="block">
            <span className={labelClass}>Danh mục cha</span>
            <select name="parent_id" defaultValue={category?.parent_id ?? ''} className={selectClass}>
              <option value="">Không có (danh mục gốc)</option>
              {availableParents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Service image upload */}
      {isService && (
        <div className="rounded-2xl border border-[#EEF2F6] bg-white p-4 space-y-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#1B3A6B]">
              <ImageIcon className="h-4 w-4 text-slate-400" /> Ảnh nền dịch vụ
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              {canUpload
                ? 'Ảnh được dùng làm nền mờ trong thẻ dịch vụ trên trang chủ. Khuyến nghị ảnh ngang, tỉ lệ 16:9.'
                : 'Lưu dịch vụ trước để mở khoá tính năng tải ảnh lên. Hoặc dán URL ảnh trực tiếp.'}
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
          />

          {/* Upload button */}
          {canUpload && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileRef.current?.click()}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-2.5 text-xs font-semibold transition-colors
                ${isPending
                  ? 'cursor-wait border-blue-200 bg-blue-50/60 text-blue-500'
                  : uploadSuccess
                    ? 'border-emerald-300 bg-emerald-50/60 text-emerald-600'
                    : 'border-slate-200 bg-slate-50/60 text-slate-500 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-600'
                }`}
            >
              {isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải lên...</>
              ) : uploadSuccess ? (
                <><CheckCircle2 className="h-3.5 w-3.5" /> Đã tải lên thành công!</>
              ) : (
                <><Upload className="h-3.5 w-3.5" /> {imageUrl ? 'Thay ảnh dịch vụ' : 'Tải ảnh dịch vụ lên'}</>
              )}
            </button>
          )}

          {uploadState.error ? (
            <p className="flex items-start gap-1 text-[10px] font-medium text-rose-600">
              <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
              {uploadState.error}
            </p>
          ) : null}

          {/* URL input */}
          <div>
            {canUpload && (
              <p className="mb-1.5 text-[10px] font-medium text-slate-400">hoặc dán URL ảnh trực tiếp</p>
            )}
            <input
              name="image_url"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={fieldClass}
              placeholder="https://..."
            />
          </div>

          {/* Preview */}
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden h-[120px] border border-slate-200">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})`, filter: 'blur(2px) brightness(0.5)', transform: 'scale(1.05)' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-bold drop-shadow-md">Preview — ảnh nền mờ</span>
              </div>
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                title="Xoá ảnh"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="admin-soft-panel space-y-2.5 px-4 py-3.5">
        {fixedType !== 'service' && (
          <AdminToggle
            name="has_filters"
            defaultChecked={category?.has_filters ?? false}
            label="Có bộ lọc tìm kiếm"
            description="Hiển thị thanh lọc thuộc tính trong danh mục này."
          />
        )}
        <AdminToggle
          name="is_active"
          defaultChecked={category?.is_active ?? true}
          label="Đang hiển thị trên catalog"
          description="Tắt để ẩn danh mục khỏi website công khai."
        />
      </div>
    </form>
  );
}
