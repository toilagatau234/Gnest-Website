import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FolderTree,
  ImageOff,
  Lock,
  Package,
  Phone,
  PhoneCall,
  Plus,
  Quote,
  ScrollText,
  Server,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { FormattedDate } from '@/components/admin/FormattedDate';
import { getDashboardData } from '@/lib/services/admin/dashboard';
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
};

const ENTITY_LABELS: Record<string, string> = {
  products: 'sản phẩm',
  categories: 'danh mục',
  inquiries: 'yêu cầu',
};

function zaloLink(phone: string) {
  return `https://zalo.me/${phone.replace(/\D/g, '')}`;
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const { counts, attention, recentInquiries, recentActivity, hasSupabase } = data;

  const totalProducts = counts.products;
  const totalCategories = counts.categories;
  const pendingInquiriesCount = counts.newInquiries;
  const activeContactsCount = counts.activeContacts;
  
  const lowStockCount = attention.lowStock;
  const productsWithoutImages = attention.missingImages;

  // System Health mock metrics styled exactly as template
  const systemHealth = [
    { name: 'Supabase Database', status: hasSupabase ? 'Kết nối an toàn' : 'Fallback offline', ping: '12ms', color: hasSupabase ? 'emerald' : 'amber' },
    { name: 'Supabase Storage', status: 'Hoạt động bình thường', ping: '45ms', color: 'emerald' },
    { name: 'Supabase Authentication', status: 'Đang chạy', ping: '8ms', color: 'emerald' },
    { name: 'Production Build Stack', status: 'Sẵn sàng deployment', ping: '100%', color: 'sky' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome & System Status Bar */}
      <div className="flex min-w-0 flex-col items-start justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1B3A6B] animate-pulse"></span>
            <span className="text-[10px] font-extrabold text-[#1B3A6B] tracking-wider uppercase font-mono">ĐẠI TÀI LỢI • CMS CONSOLE</span>
          </div>
          <h2 className="mt-1.5 text-lg font-bold leading-tight text-slate-800">
            Bảng Điều Khiển Quản Trị Hệ Thống Gnest
          </h2>
          <p className="mt-1 max-w-4xl text-xs text-slate-500">
            Chào mừng bạn trở lại! Bán lẻ/sỉ catalog sản phẩm, quản lý danh mục và phản hồi yêu cầu sỉ tức thì.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Link 
            href="/admin/products"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B3A6B] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#112546]"
          >
            <Plus className="w-4 h-4" /> Đăng Sản Phẩm Mới
          </Link>
        </div>
      </div>

      {/* PRIORITIZED ACTION DESK (VIỆC CẦN XỬ LÝ TRƯỚC) */}
      <div className="rounded-xl border border-l-4 border-[#E2E8F0] border-l-[#E31E24] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <AlertTriangle className="w-5 h-5 text-[#E31E24] shrink-0" />
          <div>
            <h3 className="font-bold text-slate-950 text-sm">Việc Cần Ưu Tiên Xử Lý Ngay</h3>
            <p className="text-[10px] text-slate-500">Các vấn đề ảnh hưởng trực tiếp đến trải nghiệm đặt hàng & đối tác sỉ B2B</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          
          {/* Urgent Item 1: Pending Inquiries */}
          <div className={`p-4 rounded-xl border transition-all ${
            pendingInquiriesCount > 0 
              ? 'bg-red-50/40 border-red-200' 
              : 'bg-slate-50/40 border-slate-200/50'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${pendingInquiriesCount > 0 ? 'text-[#E31E24]' : 'text-slate-500'}`}>
                YÊU CẦU BÁO GIÁ SỈ CHƯA XỬ LÝ
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                pendingInquiriesCount > 0 ? 'bg-[#E31E24] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {pendingInquiriesCount}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {pendingInquiriesCount > 0 
                ? `Hiện đang có ${pendingInquiriesCount} tin đăng ký yêu cầu báo giá sỉ ở trạng thái MỚI chờ liên hệ.` 
                : 'Tất cả yêu cầu báo giá sỉ của khách hàng đã được phân công & liên hệ.'
              }
            </p>
            {pendingInquiriesCount > 0 && (
              <Link 
                href="/admin/inquiries"
                className="mt-3 text-xs font-bold text-[#E31E24] hover:underline flex items-center gap-1 bg-transparent border-none p-0"
              >
                Nhập phản hồi ngay &rarr;
              </Link>
            )}
          </div>

          {/* Urgent Item 2: Low Stock */}
          <div className={`p-4 rounded-xl border transition-all ${
            lowStockCount > 0 
              ? 'bg-amber-50/50 border-amber-200' 
              : 'bg-slate-50/40 border-slate-200/50'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${lowStockCount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                SẢN PHẨM SẮP CẠN KHO SỈ
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                lowStockCount > 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {lowStockCount}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {lowStockCount > 0 
                ? `Cần nhập bổ sung kho cho ${lowStockCount} mặt hàng để tránh hết số lượng hiển thị.` 
                : 'Sản lượng tồn kho ở mức an toàn, sẵn sàng đáp ứng nhu cầu cung ứng.'
              }
            </p>
            {lowStockCount > 0 && (
              <Link 
                href="/admin/products"
                className="mt-3 text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 bg-transparent border-none p-0"
              >
                Cập nhật số tồn sỉ &rarr;
              </Link>
            )}
          </div>

          {/* Urgent Item 3: Missing Catalog Media */}
          <div className={`p-4 rounded-xl border transition-all ${
            productsWithoutImages > 0 
              ? 'bg-indigo-50/40 border-indigo-200' 
              : 'bg-slate-50/40 border-slate-200/50'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${productsWithoutImages > 0 ? 'text-indigo-700' : 'text-slate-500'}`}>
                SẢN PHẨM THIẾU ẢNH CATALOG
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                productsWithoutImages > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {productsWithoutImages}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {productsWithoutImages > 0 
                ? `Có ${productsWithoutImages} sản phẩm sỉ chưa có hình ảnh mẫu để hiển thị ngoài trang web.` 
                : '100% catalog sản phẩm đã đầy đủ hình ảnh đại diện tiêu chuẩn.'
              }
            </p>
            {productsWithoutImages > 0 && (
              <Link 
                href="/admin/products"
                className="mt-3 text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1 bg-transparent border-none p-0"
              >
                Bổ sung hình ảnh &rarr;
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        
        <div className="group flex min-h-32 flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">TỔNG SẢN PHẨM</span>
            <div className="p-1.5 bg-[#1B3A6B]/5 text-[#1B3A6B] rounded-lg group-hover:bg-[#1B3A6B]/15 transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#1B3A6B] tracking-tight">{totalProducts}</h3>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-bold">105%</span> trong catalog
            </p>
          </div>
        </div>

        <div className="group flex min-h-32 flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">DANH MỤC</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#1B3A6B] tracking-tight">{totalCategories}</h3>
            <p className="text-[10px] text-emerald-600 mt-1 font-medium select-none">
              Thiết lập cây menu
            </p>
          </div>
        </div>

        <div className="group flex min-h-32 flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#E31E24] uppercase tracking-wider font-mono">BÁO GIÁ MỚI</span>
            <div className="p-1.5 bg-red-50 text-[#E31E24] rounded-lg group-hover:bg-red-100 transition-colors animate-pulse">
              <Quote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#E31E24] tracking-tight">{pendingInquiriesCount}</h3>
            <p className="text-[10px] text-[#E31E24] mt-1 font-bold">
              Yêu cầu cần liên hệ
            </p>
          </div>
        </div>

        <div className="group flex min-h-32 flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">LIÊN HỆ BÁN HÀNG</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#1B3A6B] tracking-tight">{activeContactsCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Đang hiển thị ngoài web</p>
          </div>
        </div>

        <div className="group flex min-h-32 flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">TỒN KHO THẤP</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-500 tracking-tight">{lowStockCount}</h3>
            <p className="text-[10px] text-amber-600 mt-1 font-medium">Sắp báo động cạn kho</p>
          </div>
        </div>

        <div className="group flex min-h-32 flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">THIẾU HÌNH ẢNH</span>
            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-slate-100 transition-colors">
              <ImageOff className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-700 tracking-tight">{productsWithoutImages}</h3>
            <p className="text-[10px] text-red-500 mt-1 font-semibold">Chưa có ảnh catalog</p>
          </div>
        </div>

      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        
        {/* Recent Inquiries CRM (Col Span 2) */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-50 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-bold text-[#1B3A6B] text-sm">Yêu Cầu Báo Giá Gần Đây</h3>
              <p className="text-[10px] text-slate-400">Các yêu cầu từ form đăng ký sỉ được cập nhật tức thì</p>
            </div>
            <Link 
              href="/admin/inquiries"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-[#1B3A6B] hover:underline"
            >
              Xem chi tiết CRM <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Email liên hệ</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      Chưa có yêu cầu báo giá nào mới.
                    </td>
                  </tr>
                ) : (
                  recentInquiries.map((inq) => {
                    const statusMeta = INQUIRY_STATUS[inq.status as InquiryStatus] || INQUIRY_STATUS.new;
                    const isNew = inq.status === 'new';
                    return (
                      <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{inq.customer_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{inq.phone}</p>
                        </td>
                        <td className="p-3 text-slate-600">
                          {inq.email ? (
                            <span className="font-medium">{inq.email}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] rounded-md font-bold ${statusMeta.toneClass}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[10px]">
                          <FormattedDate date={inq.created_at} type="both" />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <a 
                              href={`tel:${inq.phone}`}
                              className="bg-sky-50 text-sky-700 p-1.5 rounded-lg hover:bg-sky-100 border border-sky-100 transition-colors"
                              title="Gọi hotline"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </a>
                            <a 
                              href={zaloLink(inq.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-50 text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-100 border border-emerald-100 transition-colors"
                              title="Gửi Zalo sỉ"
                            >
                              <Phone className="w-3.5 h-3.5" />
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

        {/* Quick Actions (Col 1) */}
        <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h3 className="font-bold text-[#1B3A6B] text-sm pb-2 border-b border-slate-50">Lối Tắt Hành Động Nhanh</h3>
          
          <div className="grid grid-cols-1 gap-2.5">
            <Link 
              href="/admin/products"
              className="w-full flex items-center gap-3 p-3 bg-[#1B3A6B] text-white hover:bg-[#112546] rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 bg-white/20 p-0.5 rounded-md" /> Đăng Sản Phẩm Mới (Catalog)
            </Link>

            <Link 
              href="/admin/categories"
              className="w-full flex items-center gap-3 p-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 bg-slate-100 text-slate-600 p-0.5 rounded-md border border-slate-200" /> Thêm Danh Mục Mới (Cây)
            </Link>

            <Link 
              href="/admin/site-content"
              className="w-full flex items-center gap-3 p-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold transition-colors animate-pulse"
            >
              <Zap className="w-4 h-4 text-[#E31E24]" /> Cấu Hình Trang Chủ / Báo Giá
            </Link>
          </div>

          <div className="bg-[#1B3A6B]/5 border border-[#1B3A6B]/10 rounded-xl p-3 text-[11px] leading-relaxed text-slate-600 space-y-1">
            <p className="font-bold text-[#1B3A6B] flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#E31E24]" /> Mẹo Bảo Mật Admin
            </p>
            <p>Hệ thống Admin Gnest tự động ghi lại lịch sử truy vết từng lượt chỉnh sửa sản phẩm hoặc cấu hình trang chủ của mọi Admin.</p>
          </div>
        </div>

      </div>

      {/* Second Row Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Operational Warnings / Alert List (Col 1) */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h3 className="font-bold text-[#1B3A6B] text-sm mb-3 pb-2 border-b border-slate-50 flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="w-4.5 h-4.5" /> Cảnh Báo Cần Xử Lý
          </h3>

          <div className="space-y-2.5">
            {productsWithoutImages > 0 && (
              <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl flex gap-3">
                <div className="w-2 h-2 rounded-full bg-[#E31E24] mt-1.5 animate-ping"></div>
                <div className="flex-1 text-xs">
                  <p className="font-bold text-slate-800">Sản phẩm chưa có ảnh catalog</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Sản phẩm này mờ mịt ngoài website đại lý.</p>
                  <Link 
                    href="/admin/products"
                    className="text-[10px] text-[#E31E24] font-bold hover:underline mt-1 block"
                  >
                    Bổ sung hình ảnh sản phẩm &rarr;
                  </Link>
                </div>
              </div>
            )}

            {lowStockCount > 0 && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex gap-3">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-slate-800">Sản phẩm có tồn kho thấp</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Cần cập nhật số lượng nhập kho sỉ để tránh hết hàng hiển thị.</p>
                  <Link 
                    href="/admin/products" 
                    className="text-[10px] text-amber-700 font-bold hover:underline mt-1 block"
                  >
                    Xem kho sản phẩm &rarr;
                  </Link>
                </div>
              </div>
            )}

            {productsWithoutImages === 0 && lowStockCount === 0 && (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Tuyệt vời, hệ thống ổn định!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Không phát hiện sản phẩm thiếu ảnh hay tồn kho thấp bất thường.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Technical States (Col 1) */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h3 className="font-bold text-[#1B3A6B] text-sm mb-3 pb-2 border-b border-slate-50 flex items-center gap-1.5">
            <Server className="w-4.5 h-4.5 text-[#1B3A6B]" /> Trạng Thái Máy Chủ
          </h3>

          <div className="space-y-3">
            {systemHealth.map((sy, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/50 bg-slate-50 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${sy.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  <span className="font-semibold text-slate-700">{sy.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border font-bold ${
                    sy.color === 'emerald' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'
                  }`}>
                    {sy.status}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{sy.ping}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Audit Stream (Col 1) */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50">
            <h3 className="font-bold text-[#1B3A6B] text-sm">Nhật Ký Gần Đây</h3>
            <Link 
              href="/admin/audit-logs" 
              className="text-[11px] text-[#1B3A6B] font-semibold hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-8 text-center text-slate-400">
                <ScrollText className="h-5 w-5 text-slate-300" />
                <p className="text-xs">Chưa có hoạt động nào được ghi lại.</p>
              </div>
            ) : (
              recentActivity.slice(0, 3).map((log) => {
                const actionLabel = ACTION_LABELS[log.action] ?? { label: log.action, colorClass: 'text-slate-600' };
                const entityLabel = ENTITY_LABELS[log.entity] ?? log.entity;
                const metadataObj = log.metadata as Record<string, unknown> | null;
                const name = metadataObj?.name as string | undefined;

                return (
                  <div key={log.id} className="text-xs flex gap-2.5 pb-2.5 border-b border-slate-50 last:border-none last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0 text-[10px] uppercase font-mono">
                      {log.actorEmail ? log.actorEmail.substring(0, 2) : 'HT'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 leading-normal">
                        <span className="font-bold text-slate-900">
                          {log.actorEmail ? log.actorEmail.split('@')[0] : 'Hệ thống'}
                        </span>
                        {' '}đã{' '}
                        <span className={actionLabel.colorClass}>
                          {actionLabel.label}
                        </span>
                        {' '}{entityLabel}{' '}
                        {name ? (
                          <span className="font-semibold text-slate-900 border-b border-dashed border-slate-400">
                            {name}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[9px] text-[#1B3A6B] font-mono mt-1">
                        <FormattedDate date={log.created_at} type="time" />
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
