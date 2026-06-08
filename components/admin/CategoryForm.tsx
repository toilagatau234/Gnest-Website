'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

import { AdminToggle } from '@/components/admin/AdminToggle';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { CategoryType } from '@/lib/types/database';
import type { AdminFormState } from '@/app/admin/(dashboard)/categories/actions';

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

export function CategoryForm({ formId, formAction, state, categories, category, fixedType }: CategoryFormProps) {
  const availableParents = categories.filter((item) => {
    if (item.id === category?.id) return false;
    if (fixedType && item.type !== fixedType) return false;
    return true;
  });
  const defaultType: CategoryType = fixedType ?? category?.type ?? 'product';

  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(category));

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

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
            Tên danh mục <span className="text-[#E31E24]">*</span>
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
