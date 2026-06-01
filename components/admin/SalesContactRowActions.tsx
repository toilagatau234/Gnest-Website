'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';

import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { SalesContactFormDialog } from '@/components/admin/SalesContactFormDialog';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminSalesContact } from '@/lib/services/admin/sales-contacts';
import {
  deleteSalesContactAction,
  toggleSalesContactActiveAction,
} from '@/app/admin/(dashboard)/sales-contacts/actions';

interface SalesContactRowActionsProps {
  contact: AdminSalesContact;
}

export function SalesContactRowActions({ contact }: SalesContactRowActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isToggling, startToggle] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleToggle = () => {
    startToggle(async () => {
      const formData = new FormData();
      formData.set('id', contact.id);
      formData.set('next_is_active', String(!contact.is_active));

      try {
        await toggleSalesContactActiveAction(formData);
        toast(contact.is_active ? 'Đã ẩn liên hệ bán hàng.' : 'Đã hiển thị liên hệ bán hàng.', 'success');
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Không thể đổi trạng thái.', 'error');
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <SalesContactFormDialog contact={contact} />

      <button
        type="button"
        onClick={handleToggle}
        disabled={isToggling}
        className="admin-focus inline-flex h-8 items-center gap-1 rounded-lg border border-[#E5E7EF] bg-white px-2.5 text-[10px] font-bold text-slate-600 transition-[transform,border-color,background-color,color] hover:-translate-y-0.5 hover:border-[#4880FF] hover:bg-[#4880FF]/5 hover:text-[#3749A6] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isToggling ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : contact.is_active ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
        {contact.is_active ? 'Ẩn' : 'Hiện'}
      </button>

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label="Xóa liên hệ bán hàng"
        title="Xóa liên hệ bán hàng"
        className="admin-focus inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EF] bg-white text-slate-500 transition-[transform,border-color,background-color,color] hover:-translate-y-0.5 hover:border-[#E31E24] hover:bg-[#E31E24]/5 hover:text-[#E31E24] active:translate-y-0 active:scale-[0.98]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <AdminConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xóa liên hệ bán hàng"
        description="Hành động này sẽ xóa vĩnh viễn nhân sự tư vấn khỏi hệ thống liên hệ trên website."
        itemName={`${contact.name} · ${contact.phone}`}
        confirmLabel="Xóa liên hệ"
        onConfirm={() => deleteSalesContactAction(contact.id)}
        onSuccess={() => {
          toast('Đã xóa liên hệ bán hàng.', 'success');
          router.refresh();
        }}
      />
    </div>
  );
}
