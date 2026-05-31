import {
  ArrowRight,
  Briefcase,
  Database,
  FolderOpen,
  MessageSquare,
  Package,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

import { AdminCard } from '@/components/admin/AdminCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { getInquiryCount, getInquiries, getNewInquiriesCount } from '@/lib/services/admin/inquiries';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { InquiryStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

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

  try {
    const supabase = createServiceRoleClient();
    hasSupabase = true;

    const [prodRes, catRes, contactRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('sales_contacts').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    productsCount = prodRes.count || 0;
    categoriesCount = catRes.count || 0;
    salesContactsCount = contactRes.count || 0;
  } catch (err) {
    console.warn('Failed to fetch counts from Supabase. Using default placeholders.', err);
  }

  return { productsCount, categoriesCount, salesContactsCount, hasSupabase };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default async function AdminDashboardPage() {
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

  return (
    <AdminSection>
      <AdminPageHeader
        title="Tổng quan quản trị"
        description="Theo dõi nhanh catalog, yêu cầu báo giá và trạng thái vận hành của CMS Gnest."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
      </div>
    </AdminSection>
  );
}
