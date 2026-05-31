'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { CategoryForm } from '@/components/admin/CategoryForm';
import type { AdminCategory } from '@/lib/services/admin/categories';

interface CategoryFormDialogProps {
  categories: AdminCategory[];
  /** When provided the dialog edits this category; otherwise it creates a new one. */
  category?: AdminCategory;
}

export function CategoryFormDialog({ categories, category }: CategoryFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(category);

  const handleSuccess = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  return (
    <>
      {isEdit ? (
        <AdminActionButton variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
          Sửa
        </AdminActionButton>
      ) : (
        <AdminActionButton icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
          Thêm danh mục
        </AdminActionButton>
      )}

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? 'Cập nhật danh mục' : 'Thêm danh mục'}
        description="Quản lý danh mục cha/con hiển thị trên catalog."
        size="lg"
      >
        <CategoryForm categories={categories} category={category} onSuccess={handleSuccess} />
      </AdminModal>
    </>
  );
}
