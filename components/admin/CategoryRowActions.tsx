'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';

import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminCategory } from '@/lib/services/admin/categories';
import {
  deleteCategoryAction,
  toggleCategoryActiveAction,
} from '@/app/admin/(dashboard)/categories/actions';

interface CategoryRowActionsProps {
  categories: AdminCategory[];
  category: AdminCategory;
  /** Slightly smaller buttons for nested child rows. */
  compact?: boolean;
}

export function CategoryRowActions({ categories, category, compact = false }: CategoryRowActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isToggling, startToggle] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleToggle = () => {
    startToggle(async () => {
      const formData = new FormData();
      formData.set('id', category.id);
      formData.set('next_is_active', String(!category.is_active));
      try {
        await toggleCategoryActiveAction(formData);
        toast(category.is_active ? 'Đã ẩn danh mục.' : 'Đã hiển thị danh mục.', 'success');
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Không thể đổi trạng thái.', 'error');
      }
    });
  };

  const sizeClass = compact ? 'h-7 px-2 text-[10px]' : 'h-7 px-2.5 text-[10px]';

  return (
    <div className="flex items-center gap-1.5">
      <CategoryFormDialog categories={categories} category={category} />

      <button
        type="button"
        onClick={handleToggle}
        disabled={isToggling}
        className={`admin-focus inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] font-bold text-slate-600 transition hover:border-[#1B3A6B] hover:text-[#1B3A6B] disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass}`}
      >
        {isToggling ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : category.is_active ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
        {category.is_active ? 'Ẩn' : 'Hiện'}
      </button>

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label="Xóa danh mục"
        title="Xóa danh mục"
        className={`admin-focus inline-flex items-center justify-center rounded-md border border-[#E2E8F0] text-slate-500 transition hover:border-[#E31E24] hover:text-[#E31E24] ${
          compact ? 'h-7 w-7' : 'h-7 w-7'
        }`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <AdminConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xóa danh mục"
        description="Hành động này sẽ xóa vĩnh viễn danh mục khỏi hệ thống. Nếu danh mục còn sản phẩm hoặc danh mục con, hãy ẩn thay vì xóa."
        itemName={category.name}
        confirmLabel="Xóa danh mục"
        onConfirm={() => deleteCategoryAction(category.id)}
        onSuccess={() => {
          toast('Đã xóa danh mục.', 'success');
          router.refresh();
        }}
      />
    </div>
  );
}
