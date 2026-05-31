import {
  ArrowRight,
<<<<<<< HEAD
  Briefcase,
  Database,
=======
  CheckCircle2,
  Database,
  EyeOff,
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
  FolderOpen,
  FolderTree,
  ImageOff,
  MessageSquare,
  Package,
  PackageMinus,
  Phone,
<<<<<<< HEAD
=======
  ScrollText,
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

import { AdminCard } from '@/components/admin/AdminCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
<<<<<<< HEAD
import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { getInquiryCount, getInquiries, getNewInquiriesCount } from '@/lib/services/admin/inquiries';
import { createServiceRoleClient } from '@/lib/supabase/server';
=======
import { AdminStatusChip, type AdminStatusTone } from '@/components/admin/AdminStatusChip';
import { getDashboardData } from '@/lib/services/admin/dashboard';
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
import type { InquiryStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

<<<<<<< HEAD
const statusLabels: Record<InquiryStatus, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  quoted: 'Đã báo giá',
  closed: 'Đã đóng',
  spam: 'Spam',
};

const statusTones: Record<InquiryStatus, 'success' | 'alert' | 'neutral' | 'info' | 'warning'> = {
  new: 'alert',
  contacted: 'info',
  quoted: 'warning',
  closed: 'success',
  spam: 'neutral',
};

async function getStats() {
  let productsCount = 0;
  let categoriesCount = 0;
  let salesContactsCount = 0;
  let hasSupabase = false;
=======
const INQUIRY_STATUS: Record<InquiryStatus, { label: string; tone: AdminStatusTone }> = {
  new: { label: 'Mới', tone: 'info' },
  contacted: { label: 'Đã liên hệ', tone: 'warning' },
  quoted: { label: 'Đã báo giá', tone: 'success' },
  closed: { label: 'Đã đóng', tone: 'neutral' },
  spam: { label: 'Spam', tone: 'alert' },
};
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6

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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default async function AdminDashboardPage() {
<<<<<<< HEAD
  const [
    { count: totalInquiries },
    { count: newInquiries },
    dbStats,
    { data: recentInquiries },
  ] = await Promise.all([
    getInquiryCount(),
    getNewInquiriesCount(),
    getStats(),
    getInquiries({ limit: 5 }),
  ]);

  const stats = [
    {
      title: 'Tổng sản phẩm',
      value: dbStats.hasSupabase ? String(dbStats.productsCount) : '-',
      icon: <Package className="h-5 w-5" />,
      description: dbStats.hasSupabase ? 'Sản phẩm và dịch vụ đang có trong catalog.' : 'Cần cấu hình Supabase.',
    },
    {
      title: 'Danh mục',
      value: dbStats.hasSupabase ? String(dbStats.categoriesCount) : '-',
      icon: <FolderOpen className="h-5 w-5" />,
      description: dbStats.hasSupabase ? 'Cấu trúc danh mục cha/con trên website.' : 'Cần cấu hình Supabase.',
    },
    {
      title: 'Yêu cầu mới',
      value: String(newInquiries),
      icon: <MessageSquare className="h-5 w-5" />,
      description: `${totalInquiries} yêu cầu báo giá đã ghi nhận.`,
      trend: newInquiries > 0 ? { value: `${newInquiries} cần xử lý`, isPositive: false } : undefined,
      tone: newInquiries > 0 ? 'attention' as const : 'default' as const,
    },
    {
      title: 'Liên hệ active',
      value: dbStats.hasSupabase ? String(dbStats.salesContactsCount) : '-',
      icon: <Phone className="h-5 w-5" />,
      description: dbStats.hasSupabase ? 'Đầu mối tư vấn đang hiển thị.' : 'Cần cấu hình Supabase.',
    },
  ];

  const quickActions = [
    {
      title: 'Quản lý sản phẩm',
      desc: 'Cập nhật tên, giá, tồn kho và trạng thái hiển thị.',
      href: '/admin/products',
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: 'Quản lý danh mục',
      desc: 'Sắp xếp danh mục cha/con cho catalog B2B.',
      href: '/admin/categories',
      icon: <FolderOpen className="h-5 w-5" />,
    },
    {
      title: 'Yêu cầu báo giá',
      desc: 'Theo dõi khách hàng cần tư vấn và phản hồi.',
      href: '/admin/inquiries',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: 'Tuyển dụng',
      desc: 'Chuẩn bị nội dung tuyển dụng cho các phase tiếp theo.',
      href: '/admin/jobs',
      icon: <Briefcase className="h-5 w-5" />,
    },
  ];
=======
  const data = await getDashboardData();
  const { counts, attention, recentInquiries, recentActivity, hasSupabase } = data;

  const stats = [
    {
      label: 'Yêu cầu mới',
      value: counts.newInquiries,
      icon: <MessageSquare className="h-[18px] w-[18px]" />,
      hint: `Trên tổng ${counts.totalInquiries} yêu cầu`,
      tone: counts.newInquiries > 0 ? ('accent' as const) : ('default' as const),
      href: '/admin/inquiries',
    },
    {
      label: 'Tổng sản phẩm',
      value: hasSupabase ? counts.products : '—',
      icon: <Package className="h-[18px] w-[18px]" />,
      hint: 'Đang có trong catalog',
      href: '/admin/products',
    },
    {
      label: 'Tổng danh mục',
      value: hasSupabase ? counts.categories : '—',
      icon: <FolderOpen className="h-[18px] w-[18px]" />,
      hint: 'Sản phẩm & dịch vụ',
      href: '/admin/categories',
    },
    {
      label: 'Liên hệ sỉ',
      value: hasSupabase ? counts.activeContacts : '—',
      icon: <Phone className="h-[18px] w-[18px]" />,
      hint: 'Đầu mối đang hoạt động',
      href: '/admin/sales-contacts',
    },
  ];

  const attentionItems = [
    { label: 'Sản phẩm thiếu ảnh', value: attention.missingImages, icon: <ImageOff className="h-4 w-4" />, href: '/admin/products' },
    { label: 'Sản phẩm sắp hết hàng', value: attention.lowStock, icon: <PackageMinus className="h-4 w-4" />, href: '/admin/products' },
    { label: 'Sản phẩm đang ẩn', value: attention.hiddenProducts, icon: <EyeOff className="h-4 w-4" />, href: '/admin/products' },
    { label: 'Danh mục đang ẩn', value: attention.hiddenCategories, icon: <FolderTree className="h-4 w-4" />, href: '/admin/categories' },
  ].filter((item) => item.value > 0);
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6

  return (
    <AdminSection>
      <AdminPageHeader
<<<<<<< HEAD
        title="Tổng quan quản trị"
        description="Theo dõi nhanh catalog, yêu cầu báo giá và trạng thái vận hành của CMS Gnest."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard key={stat.title} {...stat} />
=======
        title="Tổng quan"
        description="Theo dõi nhanh việc cần xử lý, yêu cầu báo giá mới và hoạt động của hệ thống."
      />

      {!hasSupabase && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Chưa kết nối Supabase</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-700">
              Cấu hình biến môi trường Supabase để hiển thị số liệu thực tế và lưu dữ liệu lâu dài.
            </p>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard key={stat.label} {...stat} />
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
<<<<<<< HEAD
        <AdminCard
          title="Việc cần chú ý"
          subtitle="Ưu tiên các điểm ảnh hưởng trực tiếp tới catalog và khách hàng."
          className="lg:col-span-2"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/admin/inquiries"
              className="admin-focus rounded-xl border border-[#E2E8F0] bg-red-50/50 p-4 transition-colors hover:border-red-200 hover:bg-red-50"
            >
              <p className="text-sm font-semibold text-[#B42318]">{newInquiries} yêu cầu mới</p>
              <p className="mt-1 text-sm leading-6 text-red-700/80">Cần kiểm tra và phản hồi sớm.</p>
            </Link>
            <Link
              href="/admin/products"
              className="admin-focus rounded-xl border border-[#E2E8F0] bg-white p-4 transition-colors hover:border-[#CBD5E1] hover:bg-slate-50"
            >
              <p className="text-sm font-semibold text-[#1B3A6B]">Catalog sản phẩm</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Kiểm tra giá, tồn kho và ảnh.</p>
            </Link>
            <Link
              href="/admin/categories"
              className="admin-focus rounded-xl border border-[#E2E8F0] bg-white p-4 transition-colors hover:border-[#CBD5E1] hover:bg-slate-50"
            >
              <p className="text-sm font-semibold text-[#1B3A6B]">Cây danh mục</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Giữ cấu trúc dễ tìm trên website.</p>
            </Link>
          </div>
        </AdminCard>

        <AdminCard title="Trạng thái hệ thống" subtitle="Kết nối dữ liệu và các nền tảng nền.">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Database className={`h-5 w-5 ${dbStats.hasSupabase ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Supabase DB</p>
                  <p className="text-xs text-slate-500">Dữ liệu CMS</p>
                </div>
              </div>
              <AdminStatusChip tone={dbStats.hasSupabase ? 'success' : 'warning'}>
                {dbStats.hasSupabase ? 'Đã kết nối' : 'Fallback'}
              </AdminStatusChip>
            </div>

            {!dbStats.hasSupabase && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm leading-6 text-amber-800">
                  Cấu hình biến môi trường Supabase để xem dữ liệu thật trong dashboard.
                </p>
              </div>
            )}
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard
          title="Yêu cầu báo giá gần đây"
          subtitle="Danh sách mới nhất từ form liên hệ trên website."
          className="lg:col-span-2"
          headerAction={
            <Link href="/admin/inquiries" className="text-sm font-semibold text-[#1B3A6B] hover:text-[#E31E24]">
              Xem tất cả
            </Link>
          }
        >
          <div className="divide-y divide-[#EEF2F6]">
            {(recentInquiries || []).length > 0 ? (
              recentInquiries?.map((inquiry) => {
                const status = inquiry.status as InquiryStatus;

                return (
                  <div key={inquiry.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{inquiry.customer_name}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">{inquiry.phone}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <AdminStatusChip tone={statusTones[status] || 'neutral'}>
                        {statusLabels[status] || statusLabels.new}
                      </AdminStatusChip>
                      <span className="text-sm text-slate-500">{formatDate(inquiry.created_at)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">Chưa có yêu cầu báo giá.</p>
            )}
          </div>
        </AdminCard>

        <AdminCard title="Thao tác nhanh" subtitle="Đi tới các phân hệ thường dùng.">
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="admin-focus flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B3A6B]/5 text-[#1B3A6B]">
                    {action.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{action.title}</span>
                    <span className="block truncate text-xs text-slate-500">{action.desc}</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </AdminCard>
=======
        {/* Primary column */}
        <div className="space-y-6 lg:col-span-2">
          <AdminCard title="Cần xử lý" subtitle="Dữ liệu catalog đang thiếu hoặc cần kiểm tra">
            {attentionItems.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Mọi dữ liệu catalog đang ổn định, không có mục nào cần xử lý.
              </div>
            ) : (
              <ul className="divide-y divide-[#EEF2F6]">
                {attentionItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="admin-focus -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-3 text-sm text-slate-700">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          {item.icon}
                        </span>
                        {item.label}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums text-slate-900">{item.value}</span>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard
            title="Yêu cầu báo giá gần đây"
            subtitle="5 yêu cầu mới nhất từ khách hàng"
            headerAction={
              <Link href="/admin/inquiries" className="admin-focus inline-flex items-center gap-1 rounded-md text-sm font-medium text-[#1B3A6B] hover:underline">
                Xem tất cả
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
            noPadding
          >
            {recentInquiries.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">Chưa có yêu cầu báo giá nào.</p>
            ) : (
              <ul className="divide-y divide-[#EEF2F6]">
                {recentInquiries.map((inquiry) => {
                  const meta = INQUIRY_STATUS[inquiry.status as InquiryStatus] ?? INQUIRY_STATUS.new;
                  return (
                    <li key={inquiry.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{inquiry.customer_name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {inquiry.phone}
                          {inquiry.message ? ` · ${inquiry.message}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <AdminStatusChip tone={meta.tone} dot={inquiry.status === 'new'}>
                          {meta.label}
                        </AdminStatusChip>
                        <span className="hidden text-xs text-slate-400 sm:block">{formatTime(inquiry.created_at)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </div>

        {/* Secondary column */}
        <div className="space-y-6">
          <AdminCard title="Trạng thái hệ thống">
            <div className="flex items-center justify-between rounded-xl border border-[#EEF2F6] bg-slate-50/60 px-4 py-3">
              <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <Database className={`h-4 w-4 ${hasSupabase ? 'text-emerald-500' : 'text-slate-400'}`} />
                Cơ sở dữ liệu
              </span>
              <AdminStatusChip tone={hasSupabase ? 'success' : 'warning'} dot>
                {hasSupabase ? 'Đã kết nối' : 'Fallback'}
              </AdminStatusChip>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Mọi thao tác quan trọng của admin được ghi lại trong nhật ký hoạt động.
            </p>
          </AdminCard>

          <AdminCard
            title="Hoạt động gần đây"
            headerAction={
              <Link href="/admin/audit-logs" className="admin-focus inline-flex items-center gap-1 rounded-md text-sm font-medium text-[#1B3A6B] hover:underline">
                Tất cả
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
            noPadding
          >
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-8 text-center text-sm text-slate-500">
                <ScrollText className="h-5 w-5 text-slate-300" />
                Chưa có hoạt động nào được ghi nhận.
              </div>
            ) : (
              <ul className="divide-y divide-[#EEF2F6]">
                {recentActivity.map((log) => {
                  const name = metadataName(log.metadata);
                  const action = ACTION_LABELS[log.action] ?? log.action;
                  const entity = ENTITY_LABELS[log.entity] ?? log.entity;
                  return (
                    <li key={log.id} className="px-5 py-3">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium text-slate-900">{action}</span> {entity}
                        {name ? <span className="text-slate-500"> · {name}</span> : null}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {log.actorEmail ?? 'Hệ thống'} · {formatTime(log.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </div>
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
      </div>
    </AdminSection>
  );
}
