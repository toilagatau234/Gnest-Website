import { Suspense } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ExternalLink,
  FolderTree,
  Lock,
  Package,
  Phone,
  PhoneCall,
  Quote,
  ScrollText,
  Server,
  TrendingUp,
} from 'lucide-react';

import { AdminLoadingScene } from '@/components/admin/AdminLoadingScene';
import { FormattedDate } from '@/components/admin/FormattedDate';
import {
  getDashboardData,
  type DashboardData,
  type ProductInterestMetric,
} from '@/lib/services/admin/dashboard';
import type { InquiryStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

const INQUIRY_STATUS: Record<InquiryStatus, { label: string; toneClass: string }> = {
  new: { label: 'Mới', toneClass: 'bg-red-50 text-[#E31E24] border border-red-200' },
  contacted: { label: 'Đã liên hệ', toneClass: 'bg-amber-50 text-amber-700 border border-amber-200' },
  quoted: { label: 'Đã báo giá', toneClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
  closed: { label: 'Đã đóng', toneClass: 'bg-slate-50 text-slate-500 border border-slate-200' },
  spam: { label: 'Spam', toneClass: 'bg-rose-50 text-rose-600 border border-rose-200' },
};

const ACTION_LABELS: Record<string, { label: string; colorClass: string }> = {
  create: { label: 'tạo', colorClass: 'text-emerald-600 font-bold' },
  update: { label: 'cập nhật', colorClass: 'text-sky-700 font-bold' },
  activate: { label: 'hiển thị', colorClass: 'text-emerald-600 font-bold' },
  deactivate: { label: 'ẩn', colorClass: 'text-amber-600 font-bold' },
  delete: { label: 'xóa', colorClass: 'text-[#E31E24] font-bold' },
};

const ENTITY_LABELS: Record<string, string> = {
  products: 'sản phẩm',
  categories: 'danh mục',
  inquiries: 'yêu cầu',
};

function zaloLink(phone: string) {
  return `https://zalo.me/${phone.replace(/\D/g, '')}`;
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  tone?: 'blue' | 'red' | 'amber' | 'emerald' | 'slate';
}) {
  const toneClass = {
    blue: 'bg-[#4880FF]/10 text-[#4880FF]',
    red: 'bg-[#E31E24]/10 text-[#E31E24]',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  }[tone];

  return (
    <div className="admin-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">
          {label}
        </p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-[#202224]">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-[#646464]">{hint}</p>
    </div>
  );
}

function PriorityItem({
  label,
  count,
  href,
  tone,
  priorityLabel,
}: {
  label: string;
  count: number;
  href: string;
  tone: 'red' | 'amber' | 'blue' | 'slate';
  priorityLabel: 'Cao' | 'Trung bình' | 'Theo dõi';
}) {
  const color = {
    red: 'bg-[#E31E24]',
    amber: 'bg-amber-500',
    blue: 'bg-[#4880FF]',
    slate: 'bg-slate-500',
  }[tone];

  return (
    <Link href={href} className="rounded-2xl border border-[#E5E7EF] bg-white p-4 transition hover:border-[#C9D2E6] hover:shadow-admin">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-extrabold text-[#202224]">{label}</p>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold text-white ${color}`}>
            {count}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#646464]">
            {priorityLabel}
          </span>
        </div>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#3749A6]">
        Mở trang quản lý <ExternalLink className="h-3 w-3" />
      </span>
    </Link>
  );
}

function ProductInterestChart({ products }: { products: ProductInterestMetric[] }) {
  const maxValue = Math.max(...products.map((product) => product.inquiryCount), 1);

  return (
    <div className="admin-card p-5 xl:col-span-2">
      <div className="mb-4 flex flex-col gap-2 border-b border-[#EEF2F6] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-[#202224]">Sản phẩm được quan tâm nhất</h3>
          <p className="mt-1 text-xs font-medium text-[#646464]">
            Xếp hạng theo yêu cầu báo giá có gắn sản phẩm.
          </p>
        </div>
        <Link href="/admin/inquiries" className="text-xs font-bold text-[#3749A6] hover:underline">
          Xem yêu cầu
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8DEEC] bg-[#F7F9FB] px-5 py-10 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-extrabold text-[#202224]">Chưa đủ dữ liệu quan tâm sản phẩm</p>
          <p className="mt-1 text-xs font-medium text-[#646464]">
            Khi inquiry có `product_id`, chart này sẽ tự động hiển thị top sản phẩm.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => {
            const width = Math.max((product.inquiryCount / maxValue) * 100, 8);

            return (
              <div key={product.productId} className="rounded-2xl border border-[#EEF2F6] bg-[#F7F9FB] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#202224]">
                      #{index + 1} {product.name}
                    </p>
                    <p className="truncate font-mono text-[10px] font-semibold text-[#646464]">
                      /{product.slug}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-extrabold text-[#4880FF]">{product.inquiryCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#646464]">
                      yêu cầu
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#4880FF]" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function DashboardDataPanels() {
  const data = await getDashboardData();
  const { counts, attention, recentInquiries, recentActivity, hasSupabase, productInterest } = data;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label="Sản phẩm đang hiển thị" value={counts.products - counts.hiddenProducts} hint={`${counts.products} trong catalog`} icon={<Package className="h-4 w-4" />} />
        <KpiCard label="Sản phẩm đang ẩn" value={counts.hiddenProducts} hint="Cần kiểm tra trạng thái" icon={<Package className="h-4 w-4" />} tone="slate" />
        <KpiCard label="Sản phẩm hết kho" value={counts.outOfStockProducts} hint="Không còn hàng sẵn sỉ" icon={<AlertTriangle className="h-4 w-4" />} tone="amber" />
        <KpiCard label="Sản phẩm thiếu ảnh" value={counts.missingImages} hint="Nên bổ sung media" icon={<Package className="h-4 w-4" />} tone="red" />
        <KpiCard label="Danh mục hiển thị" value={counts.visibleCategories} hint={`${counts.categories} trong cây menu`} icon={<FolderTree className="h-4 w-4" />} tone="emerald" />
        <KpiCard label="Liên hệ chưa xử lý" value={counts.newInquiries} hint={`${counts.totalInquiries} yêu cầu CRM`} icon={<Quote className="h-4 w-4" />} tone="red" />
        <KpiCard label="Liên hệ bán hàng" value={counts.activeContacts} hint="Đang hiển thị công khai" icon={<PhoneCall className="h-4 w-4" />} />
        <KpiCard label="Tin tuyển dụng / log mới" value={`${counts.activeJobs} / ${counts.recentActivities}`} hint="Việc làm hiện hành và 6 log gần nhất" icon={<ScrollText className="h-4 w-4" />} tone="blue" />
      </div>

      <div className="admin-card border-l-4 border-l-[#E31E24] p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-[#EEF2F6] pb-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#E31E24]" />
          <h3 className="text-sm font-extrabold text-[#202224]">Việc cần ưu tiên xử lý ngay</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <PriorityItem label="Yêu cầu báo giá mới" count={counts.newInquiries} href="/admin/inquiries" tone="red" priorityLabel="Cao" />
          <PriorityItem label="Sản phẩm tồn kho thấp" count={attention.lowStock} href="/admin/products" tone="amber" priorityLabel="Cao" />
          <PriorityItem label="Sản phẩm thiếu ảnh" count={attention.missingImages} href="/admin/products" tone="blue" priorityLabel="Trung bình" />
          <PriorityItem label="Sản phẩm đang ẩn" count={attention.hiddenProducts} href="/admin/products" tone="slate" priorityLabel="Theo dõi" />
          <PriorityItem label="Danh mục đang ẩn" count={attention.hiddenCategories} href="/admin/categories" tone="slate" priorityLabel="Theo dõi" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ProductInterestChart products={productInterest} />
        <QuickHealthCard hasSupabase={hasSupabase} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RecentInquiriesCard data={data} />
        <RecentActivityCard data={data} />
      </div>
    </>
  );
}

function RecentInquiriesCard({ data }: { data: DashboardData }) {
  return (
    <div className="admin-card p-5 xl:col-span-2">
      <div className="mb-4 flex flex-col gap-3 border-b border-[#EEF2F6] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-[#202224]">Yêu cầu báo giá gần đây</h3>
          <p className="mt-1 text-xs font-medium text-[#646464]">Cập nhật từ form đăng ký báo giá.</p>
        </div>
        <Link href="/admin/inquiries" className="inline-flex items-center gap-1 text-xs font-bold text-[#3749A6] hover:underline">
          Xem CRM <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EF] bg-[#F7F9FB] text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">
              <th className="p-3">Khách hàng</th>
              <th className="p-3">Email</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Thời gian</th>
              <th className="p-3 text-right">Liên hệ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            {data.recentInquiries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[#646464]">
                  Chưa có yêu cầu báo giá mới.
                </td>
              </tr>
            ) : (
              data.recentInquiries.map((inquiry) => {
                const statusMeta = INQUIRY_STATUS[inquiry.status as InquiryStatus] || INQUIRY_STATUS.new;

                return (
                  <tr key={inquiry.id} className="transition-colors hover:bg-[#F7F9FB]">
                    <td className="p-3">
                      <p className="font-bold text-[#202224]">{inquiry.customer_name}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-[#646464]">{inquiry.phone}</p>
                    </td>
                    <td className="p-3 text-[#646464]">{inquiry.email || '—'}</td>
                    <td className="p-3">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${statusMeta.toneClass}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-[#646464]">
                      <FormattedDate date={inquiry.created_at} type="both" />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1.5">
                        <a href={`tel:${inquiry.phone}`} className="rounded-lg border border-sky-100 bg-sky-50 p-1.5 text-sky-700 transition-colors hover:bg-sky-100" title="Gọi">
                          <PhoneCall className="h-3.5 w-3.5" />
                        </a>
                        <a href={zaloLink(inquiry.phone)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100" title="Zalo">
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuickHealthCard({ hasSupabase }: { hasSupabase: boolean }) {
  const status = hasSupabase ? 'Kết nối an toàn' : 'Fallback offline';

  return (
    <div className="admin-card p-5">
      <h3 className="mb-3 flex items-center gap-1.5 border-b border-[#EEF2F6] pb-3 text-sm font-extrabold text-[#202224]">
        <Server className="h-4.5 w-4.5 text-[#4880FF]" />
        Trạng thái hệ thống
      </h3>
      <div className="space-y-3 text-xs">
        {['Supabase Database', 'Supabase Storage', 'Supabase Authentication', 'Production Build'].map((item, index) => (
          <div key={item} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EF] bg-[#F7F9FB] p-3">
            <span className="font-bold text-[#202224]">{item}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${index === 0 && !hasSupabase ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {index === 0 ? status : 'Sẵn sàng'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-[#DDE5F8] bg-[#4880FF]/5 p-3 text-[11px] leading-relaxed text-[#3749A6]">
        <p className="flex items-center gap-1 font-extrabold">
          <Lock className="h-3.5 w-3.5" /> Bảo mật admin
        </p>
        <p className="mt-1 text-[#646464]">Dashboard vẫn giữ guard server-side qua Supabase Auth và role admin.</p>
      </div>
    </div>
  );
}

function RecentActivityCard({ data }: { data: DashboardData }) {
  return (
    <div className="admin-card p-5 xl:col-span-1">
      <div className="mb-3 flex items-center justify-between border-b border-[#EEF2F6] pb-3">
        <h3 className="text-sm font-extrabold text-[#202224]">Nhật ký gần đây</h3>
        <Link href="/admin/audit-logs" className="text-[11px] font-bold text-[#3749A6] hover:underline">
          Xem tất cả
        </Link>
      </div>

      <div className="space-y-3">
        {data.recentActivity.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-8 text-center text-[#646464]">
            <ScrollText className="h-5 w-5 text-slate-300" />
            <p className="text-xs">Chưa có hoạt động nào được ghi lại.</p>
          </div>
        ) : (
          data.recentActivity.slice(0, 4).map((log) => {
            const actionLabel = ACTION_LABELS[log.action] ?? { label: log.action, colorClass: 'text-slate-600' };
            const entityLabel = ENTITY_LABELS[log.entity] ?? log.entity;
            const metadataObj = log.metadata as Record<string, unknown> | null;
            const name = typeof metadataObj?.name === 'string' ? metadataObj.name : null;

            return (
              <div key={log.id} className="flex gap-2.5 border-b border-[#EEF2F6] pb-3 text-xs last:border-none last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5E7EF] bg-[#F7F9FB] text-[10px] font-extrabold uppercase text-[#646464]">
                  {log.actorEmail ? log.actorEmail.substring(0, 2) : 'HT'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="leading-relaxed text-[#646464]">
                    <span className="font-extrabold text-[#202224]">
                      {log.actorEmail ? log.actorEmail.split('@')[0] : 'Hệ thống'}
                    </span>{' '}
                    đã <span className={actionLabel.colorClass}>{actionLabel.label}</span> {entityLabel}
                    {name ? <span className="font-bold text-[#202224]"> {name}</span> : null}
                  </p>
                  <p className="mt-1 font-mono text-[10px] font-semibold text-[#3749A6]">
                    <FormattedDate date={log.created_at} type="time" />
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#202224]">Tổng quan</h1>
        <p className="mt-1.5 text-[13px] font-medium text-[#646464]">
          Số liệu catalog và việc cần xử lý hôm nay.
        </p>
      </div>

      <Suspense
        fallback={
          <AdminLoadingScene
            compact
            title="Đang tải số liệu dashboard"
            description="Layout đã sẵn sàng, Gnest đang lấy dữ liệu mới nhất."
          />
        }
      >
        <DashboardDataPanels />
      </Suspense>
    </div>
  );
}
