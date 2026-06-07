'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';

import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { BannerFormDialog } from '@/components/admin/BannerFormDialog';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminBanner } from '@/lib/services/admin/banners';
import {
  deleteBannerAction,
  toggleBannerActiveAction,
} from '@/app/admin/(dashboard)/banners/actions';

interface BannerRowActionsProps {
  banner: AdminBanner;
}

export function BannerRowActions({ banner }: BannerRowActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isToggling, startToggle] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleToggle = () => {
    startToggle(async () => {
      const formData = new FormData();
      formData.set('id', banner.id);
      formData.set('next_is_active', String(!banner.is_active));

      try {
        await toggleBannerActiveAction(formData);
        toast(banner.is_active ? 'Đã ẩn banner quảng cáo.' : 'Đã hiển thị banner quảng cáo.', 'success');
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Không thể đổi trạng thái.', 'error');
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <BannerFormDialog banner={banner} />

      <button
        type="button"
        onClick={handleToggle}
        disabled={isToggling}
        className="admin-focus inline-flex h-8 items-center gap-1 rounded-lg border border-[#E5E7EF] bg-white px-2.5 text-[10px] font-bold text-slate-600 transition-[transform,border-color,background-color,color] hover:-translate-y-0.5 hover:border-[#4880FF] hover:bg-[#4880FF]/5 hover:text-[#3749A6] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isToggling ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : banner.is_active ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
        {banner.is_active ? 'Ẩn' : 'Hiện'}
      </button>

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label="Xóa banner"
        title="Xóa banner"
        className="admin-focus inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EF] bg-white text-slate-500 transition-[transform,border-color,background-color,color] hover:-translate-y-0.5 hover:border-[#E31E24] hover:bg-[#E31E24]/5 hover:text-[#E31E24] active:translate-y-0 active:scale-[0.98]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <AdminConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xóa banner quảng cáo"
        description="Hành động này sẽ xóa vĩnh viễn banner khỏi hệ thống và không thể hiển thị lại."
        itemName={banner.name}
        confirmLabel="Xóa banner"
        onConfirm={() => deleteBannerAction(banner.id)}
        onSuccess={() => {
          toast('Đã xóa banner quảng cáo.', 'success');
          router.refresh();
        }}
      />
    </div>
  );
}
