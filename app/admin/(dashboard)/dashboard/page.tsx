import {
  ArrowRight,
  CheckCircle2,
  Database,
  EyeOff,
  FolderOpen,
  FolderTree,
  ImageOff,
  MessageSquare,
  Package,
  PackageMinus,
  Phone,
  Plus,
  ScrollText,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

import { AdminCard } from '@/components/admin/AdminCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminStatusChip, type AdminStatusTone } from '@/components/admin/AdminStatusChip';
import { getDashboardData } from '@/lib/services/admin/dashboard';
import type { InquiryStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

const INQUIRY_STATUS: Record<InquiryStatus, { label: string; tone: AdminStatusTone }> = {
  new: { label: 'Mới', tone: 'info' },
  contacted: { label: 'Đã liên hệ', tone: 'warning' },
  quoted: { label: 'Đã báo giá', tone: 'success' },
  closed: { label: 'Đã đóng', tone: 'neutral' },
  spam: { label: 'Spam', tone: 'alert' },
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Tạo mới',
  update: 'Cập nhật',
  activate: 'Hiển thị',
  deactivate: 'Ẩn',
};

const ENTITY_LABELS: Record<string, string> = {
  products: 'sản phẩm',
  categories: 'danh mục',
  inquiries: 'yêu cầu',
};

function formatTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function metadataName(metadata: unknown): string | null {
  if (metadata && typeof metadata === 'object' && 'name' in metadata) {
    const name = (metadata as { name?: unknown }).name;
    return typeof name === 'string' ? name : null;
  }
  return null;
}

interface AttentionCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

function AttentionCard({ icon, label, value, href, colorClass, bgClass, borderClass }: AttentionCardProps) {
  return (
    <Link
      href={href}
      className={`admin-focus group flex flex-col gap-3 rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-admin-pop ${bgClass} ${borderClass}`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/60 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className={`text-[30px] font-extrabold leading-none tracking-tight ${colorClass}`}>{value}</p>
        <p className={`mt-1 text-[13px] font-medium ${colorClass} opacity-80`}>{label}</p>
      </div>
      <div className={`flex items-center gap-1 text-[12px] font-semibold ${colorClass} opacity-60 transition-opacity group-hover:opacity-100`}>
        Xem ngay <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const { counts, attention, recentInquiries, recentActivity, hasSupabase } = data;

  const stats = [
    {
      label: 'Yêu cầu mới',
      value: counts.newInquiries,
      icon: <MessageSquare className="h-[17px] w-[17px]" />,
      hint: `Trong tổng ${counts.totalInquiries} yêu cầu`,
      tone: counts.newInquiries > 0 ? ('accent' as const) : ('default' as const),
      href: '/admin/inquiries',
    },
    {
      label: 'Tổng sản phẩm',
      value: hasSupabase ? counts.products : '—',
      icon: <Package className="h-[17px] w-[17px]" />,
      hint: 'Đang có trong catalog',
      href: '/admin/products',
    },
    {
      label: 'Tổng danh mục',
      value: hasSupabase ? counts.categories : '—',
      icon: <FolderOpen className="h-[17px] w-[17px]" />,
      hint: 'Sản phẩm & dịch vụ',
      href: '/admin/categories',
    },
    {
      label: 'Liên hệ sỉ',
      value: hasSupabase ? counts.activeContacts : '—',
      icon: <Phone className="h-[17px] w-[17px]" />,
      hint: 'Đầu mối đang hoạt động',
      href: '/admin/sales-contacts',
    },
  ];

  const attentionCards = [
    {
      label: 'Sản phẩm thiếu ảnh',
      value: attention.missingImages,
      icon: <ImageOff className="h-5 w-5" />,
      href: '/admin/products',
      colorClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
    },
    {
      label: 'Sản phẩm sắp hết hàng',
      value: attention.lowStock,
      icon: <PackageMinus className="h-5 w-5" />,
      href: '/admin/products',
      colorClass: 'text-orange-700',
      bgClass: 'bg-orange-50',
      borderClass: 'border-orange-200',
    },
    {
      label: 'Sản phẩm đang ẩn',
      value: attention.hiddenProducts,
      icon: <EyeOff className="h-5 w-5" />,
      href: '/admin/products',
      colorClass: 'text-slate-600',
      bgClass: 'bg-slate-50',
      borderClass: 'border-slate-200',
    },
    {
      label: 'Danh mục đang ẩn',
      value: attention.hiddenCategories,
      icon: <FolderTree className="h-5 w-5" />,
      href: '/admin/categories',
      colorClass: 'text-slate-600',
      bgClass: 'bg-slate-50',
      borderClass: 'border-slate-200',
    },
  ].filter((item) => item.value > 0);

  const hasAttention = attentionCards.length > 0;

  return (
    <AdminSection>
      <AdminPageHeader
        title="Bảng Điều Khiển Quản Trị"
        description="Theo dõi nhanh việc cần xử lý, yêu cầu báo giá mới và hoạt động hệ thống."
        action={
          <Link
            href="/admin/products"
            className="admin-focus inline-flex items-center gap-2 rounded-lg bg-[#1B3A6B] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#162e57] hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Đăng sản phẩm mới
          </Link>
        }
      />

      {!hasSupabase && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-[13px] font-semibold text-amber-800">Chưa kết nối Supabase</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-amber-700">
              Cấu hình biến môi trường Supabase để hiển thị số liệu thực tế và lưu dữ liệu lâu dài.
            </p>
          </div>
        </div>
      )}

      {/* Attention section */}
      {hasAttention ? (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 admin-pulse-dot" />
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-slate-600">
              Việc cần xử lý ngay
            </h2>
          </div>
          <div className={`grid gap-3 ${attentionCards.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : attentionCards.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {attentionCards.map((card) => (
              <AttentionCard key={card.label} {...card} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-[13px] font-semibold text-emerald-800">Mọi thứ ổn định</p>
            <p className="text-[12px] text-emerald-700">Không có dữ liệu catalog nào cần xử lý ngay.</p>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <AdminCard
            title="Yêu cầu báo giá gần đây"
            subtitle="5 yêu cầu mới nhất từ khách hàng"
            headerAction={
              <Link
                href="/admin/inquiries"
                className="admin-focus inline-flex items-center gap-1 rounded-md text-[13px] font-semibold text-[#1B3A6B] hover:underline"
              >
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
            noPadding
          >
            {recentInquiries.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-slate-400">
                Chưa có yêu cầu báo giá nào.
              </p>
            ) : (
              <ul className="divide-y divide-[#EEF2F6]">
                {recentInquiries.map((inquiry) => {
                  const meta =
                    INQUIRY_STATUS[inquiry.status as InquiryStatus] ?? INQUIRY_STATUS.new;
                  const isNew = inquiry.status === 'new';
                  return (
                    <li
                      key={inquiry.id}
                      className={`flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 ${isNew ? 'bg-[#1B3A6B]/[0.018]' : ''}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-900">
                          {inquiry.customer_name}
                        </p>
                        <p className="truncate text-[12px] text-slate-400">
                          {inquiry.phone}
                          {inquiry.message ? ` · ${inquiry.message}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <AdminStatusChip tone={meta.tone} dot={isNew}>
                          {meta.label}
                        </AdminStatusChip>
                        <span className="hidden text-[11px] text-slate-400 sm:block">
                          {formatTime(inquiry.created_at)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </div>

        {/* Secondary column */}
        <div className="space-y-5">
          <AdminCard title="Trạng thái hệ thống">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-lg border border-[#EEF2F6] bg-slate-50/70 px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-[13px] font-medium text-slate-700">
                  <Database
                    className={`h-4 w-4 ${hasSupabase ? 'text-emerald-500' : 'text-slate-400'}`}
                  />
                  Cơ sở dữ liệu
                </span>
                <AdminStatusChip tone={hasSupabase ? 'success' : 'warning'} dot>
                  {hasSupabase ? 'Đã kết nối' : 'Fallback'}
                </AdminStatusChip>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              Mọi thao tác quan trọng của admin được ghi lại trong nhật ký hoạt động.
            </p>
          </AdminCard>

          <AdminCard
            title="Hoạt động gần đây"
            headerAction={
              <Link
                href="/admin/audit-logs"
                className="admin-focus inline-flex items-center gap-1 rounded-md text-[13px] font-semibold text-[#1B3A6B] hover:underline"
              >
                Tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
            noPadding
          >
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                <ScrollText className="h-5 w-5 text-slate-300" />
                <p className="text-[13px] text-slate-400">Chưa có hoạt động nào.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#EEF2F6]">
                {recentActivity.map((log) => {
                  const name = metadataName(log.metadata);
                  const action = ACTION_LABELS[log.action] ?? log.action;
                  const entity = ENTITY_LABELS[log.entity] ?? log.entity;
                  return (
                    <li key={log.id} className="px-5 py-3 transition-colors hover:bg-slate-50">
                      <p className="text-[13px] text-slate-700">
                        <span className="font-semibold text-slate-900">{action}</span>{' '}
                        {entity}
                        {name ? (
                          <span className="text-slate-500"> · {name}</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {log.actorEmail ?? 'Hệ thống'} · {formatTime(log.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>
    </AdminSection>
  );
}
