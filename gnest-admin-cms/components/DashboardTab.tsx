'use client';

import React from 'react';
import { 
  Package, 
  FolderTree, 
  Quote, 
  PhoneCall, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Plus, 
  ExternalLink, 
  Calendar,
  Zap,
  TrendingUp,
  Database,
  Lock,
  Server,
  CloudLightning
} from 'lucide-react';
import { Product, Category, Inquiry, Contact, AuditLog } from '@/lib/mock-data';
import FormattedDate from './FormattedDate';

interface DashboardTabProps {
  products: Product[];
  categories: Category[];
  inquiries: Inquiry[];
  contacts: Contact[];
  auditLogs: AuditLog[];
  setTab: (tab: string) => void;
  onOpenDrawer: (type: string, data?: any) => void;
  triggerToast: (msg: string, type: 'success' | 'error') => void;
}

export default function DashboardTab({
  products,
  categories,
  inquiries,
  contacts,
  auditLogs,
  setTab,
  onOpenDrawer,
  triggerToast
}: DashboardTabProps) {

  // Dynamic KPI calculations
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const pendingInquiriesCount = inquiries.filter(i => i.status === 'Mới').length;
  const activeContactsCount = contacts.filter(c => c.is_active).length;
  
  // Real-world operational warnings
  const lowStockProducts = products.filter(p => p.stock <= p.low_stock_threshold);
  const productsWithoutImages = products.filter(p => p.images.length === 0);
  
  // System Health Mock Metrics
  const systemHealth = [
    { name: 'Supabase Database', status: 'Kết nối an toàn', ping: '12ms', color: 'emerald' },
    { name: 'Supabase Storage', status: 'Hoạt động bình thường', ping: '45ms', color: 'emerald' },
    { name: 'Supabase Authentication', status: 'Đang chạy', ping: '8ms', color: 'emerald' },
    { name: 'Production Build Stack', status: 'Sẵn sàng deployment', ping: '100%', color: 'sky' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome & System Status Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 bg-white rounded-2xl border border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1B3A6B] animate-pulse"></span>
            <span className="text-[10px] font-extrabold text-[#1B3A6B] tracking-wider uppercase font-mono">ĐẠI TÀI LỢI • CMS CONSOLE</span>
          </div>
          <h2 className="text-lg font-bold text-slate-800 leading-tight mt-1.5 font-sans">
            Bảng Điều Khiển Quản Trị Hệ Thống Gnest
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chào mừng bạn trở lại! Bán lẻ/sỉ catalog sản phẩm, quản lý danh mục và phản hồi yêu cầu sỉ tức thì.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => onOpenDrawer('product_add')}
            className="px-4 py-2 bg-[#1B3A6B] hover:bg-[#112546] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Đăng Sản Phẩm Mới
          </button>
        </div>
      </div>

      {/* PRIORITIZED ACTION DESK (VIỆC CẦN XỬ LÝ TRƯỚC) */}
      <div className="bg-white rounded-2xl border-l-4 border-l-[#E31E24] border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <AlertTriangle className="w-5 h-5 text-[#E31E24] shrink-0" />
          <div>
            <h3 className="font-bold text-slate-950 text-sm">Việc Cần Ưu Tiên Xử Lý Ngay</h3>
            <p className="text-[10px] text-slate-500">Các vấn đề ảnh hưởng trực tiếp đến trải nghiệm đặt hàng & đối tác sỉ B2B</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
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
              <button 
                onClick={() => setTab('inquiries')}
                className="mt-3 text-xs font-bold text-[#E31E24] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
              >
                Nhấp phản hồi ngay &rarr;
              </button>
            )}
          </div>

          {/* Urgent Item 2: Low Stock */}
          <div className={`p-4 rounded-xl border transition-all ${
            lowStockProducts.length > 0 
              ? 'bg-amber-50/50 border-amber-200' 
              : 'bg-slate-50/40 border-slate-200/50'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${lowStockProducts.length > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                SẢN PHẨM SẮP CẠN KHO SỈ
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                lowStockProducts.length > 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {lowStockProducts.length}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {lowStockProducts.length > 0 
                ? `Cần nhập bổ sung kho cho ${lowStockProducts.length} mặt hàng để tránh hết số lượng hiển thị.` 
                : 'Sản lượng tồn kho ở mức an toàn, sẵn sàng đáp ứng nhu cầu cung ứng.'
              }
            </p>
            {lowStockProducts.length > 0 && (
              <button 
                onClick={() => setTab('products')}
                className="mt-3 text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
              >
                Cập nhật số tồn sỉ &rarr;
              </button>
            )}
          </div>

          {/* Urgent Item 3: Missing Catalog Media */}
          <div className={`p-4 rounded-xl border transition-all ${
            productsWithoutImages.length > 0 
              ? 'bg-indigo-50/40 border-indigo-200' 
              : 'bg-slate-50/40 border-slate-200/50'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${productsWithoutImages.length > 0 ? 'text-indigo-700' : 'text-slate-500'}`}>
                SẢN PHẨM THIẾU ẢNH CATALOG
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                productsWithoutImages.length > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {productsWithoutImages.length}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {productsWithoutImages.length > 0 
                ? `Có ${productsWithoutImages.length} sản phẩm sỉ chưa có hình ảnh mẫu để hiển thị ngoài trang web.` 
                : '100% catalog sản phẩm đã đầy đủ hình ảnh đại diện tiêu chuẩn.'
              }
            </p>
            {productsWithoutImages.length > 0 && (
              <button 
                onClick={() => setTab('products')}
                className="mt-3 text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
              >
                Bổ sung hình ảnh &rarr;
              </button>
            )}
          </div>

        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">TỔNG SẢN PHẨM</span>
            <div className="p-1.5 bg-[#1B3A6B]/5 text-[#1B3A6B] rounded-lg group-hover:bg-[#1B3A6B]/15 transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#1B3A6B] tracking-tight">{totalProducts}</h3>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-bold">100%</span> trong catalog
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
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

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
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

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
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

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">TỒN KHO THẤP</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-500 tracking-tight">{lowStockProducts.length}</h3>
            <p className="text-[10px] text-amber-600 mt-1 font-medium">Sắp báo động cạn kho</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">THIẾU HÌNH ẢNH</span>
            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-slate-100 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-700 tracking-tight">{productsWithoutImages.length}</h3>
            <p className="text-[10px] text-red-500 mt-1 font-semibold">Chưa có ảnh catalog</p>
          </div>
        </div>

      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Inquiries CRM (Col Span 2) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm xl:col-span-2">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
            <div>
              <h3 className="font-bold text-[#1B3A6B] text-sm">Yêu Cầu Báo Giá Gần Đây</h3>
              <p className="text-[10px] text-slate-400">Các yêu cầu từ form đăng ký sỉ được cập nhật tức thì</p>
            </div>
            <button 
              onClick={() => setTab('inquiries')}
              className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200"
            >
              Xem chi tiết CRM <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inquiries.slice(0, 4).map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{inq.customer_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{inq.phone}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#1B3A6B]/5 text-[#1B3A6B] font-medium text-[10px] rounded-md border border-[#1B3A6B]/10">
                        {inq.product_name}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] rounded-md font-bold ${
                        inq.status === 'Mới' ? 'bg-red-50 text-[#E31E24] border border-red-200' :
                        inq.status === 'Đã liên hệ' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        inq.status === 'Đã báo giá' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {inq.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[10px]">
                      <FormattedDate date={inq.created_at} type="both" />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={`tel:${inq.phone}`}
                          onClick={() => triggerToast(`Đang kết nối cuộc gọi mô phỏng đến ${inq.phone}`, 'success')}
                          className="bg-sky-50 text-sky-700 p-1.5 rounded-lg hover:bg-sky-100 border border-sky-100 transition-colors"
                          title="Gọi hotline"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                        <button 
                          onClick={() => onOpenDrawer('inquiry_details', inq)}
                          className="bg-[#1B3A6B]/5 text-[#1B3A6B] p-1.5 rounded-lg hover:bg-[#1B3A6B]/15 border border-[#1B3A6B]/10 transition-colors"
                          title="Xem chi tiết"
                        >
                          Xem
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions (Col 1) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-[#1B3A6B] text-sm pb-2 border-b border-slate-50">Lối Tắt Hành Động Nhanh</h3>
          
          <div className="grid grid-cols-1 gap-2.5">
            <button 
              onClick={() => onOpenDrawer('product_add')}
              className="w-full flex items-center gap-3 p-3 bg-[#1B3A6B] text-white hover:bg-[#112546] rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 bg-white/20 p-0.5 rounded-md" /> Đăng Sản Phẩm Mới (Catalog)
            </button>

            <button 
              onClick={() => onOpenDrawer('category_add')}
              className="w-full flex items-center gap-3 p-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 bg-slate-100 text-slate-600 p-0.5 rounded-md border border-slate-200" /> Thêm Danh Mục Mới (Cây)
            </button>

            <button 
              onClick={() => setTab('content')}
              className="w-full flex items-center gap-3 p-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold transition-colors animate-pulse"
            >
              <Zap className="w-4 h-4 text-[#E31E24]" /> Cấu Hình Trang Chủ / Báo Giá
            </button>
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Operational Warnings / Alert List (Col 1) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="font-bold text-[#1B3A6B] text-sm mb-3 pb-2 border-b border-slate-50 flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="w-4.5 h-4.5" /> Cảnh Báo Cần Xử Lý
          </h3>

          <div className="space-y-2.5">
            {productsWithoutImages.length > 0 && (
              <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl flex gap-3">
                <div className="w-2 h-2 rounded-full bg-[#E31E24] mt-1.5 animate-ping"></div>
                <div className="flex-1 text-xs">
                  <p className="font-bold text-slate-800">Sản phẩm chưa có ảnh catalog</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Sản phẩm này mờ mịt ngoài website đại lý.</p>
                  <div className="mt-1.5 flex gap-2">
                    {productsWithoutImages.map((p, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => onOpenDrawer('product_edit', p)}
                        className="text-[10px] text-[#E31E24] font-bold hover:underline"
                      >
                        Sửa {p.name.slice(0, 15)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {lowStockProducts.length > 0 && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex gap-3">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-slate-800">Sản phẩm có tồn kho thấp</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Cần cập nhật số lượng nhập kho sỉ để tránh hết hàng hiển thị.</p>
                  <button 
                    onClick={() => { setTab('products'); }} 
                    className="text-[10px] text-amber-700 font-bold hover:underline mt-1 block"
                  >
                    Xem kho sản phẩm &rarr;
                  </button>
                </div>
              </div>
            )}

            {productsWithoutImages.length === 0 && lowStockProducts.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Tuyệt vời, hệ thống ổn định!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Không phát hiện sản phẩm thiếu ảnh hay tồn kho thấp bất thường.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Technical States (Col 1) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="font-bold text-[#1B3A6B] text-sm mb-3 pb-2 border-b border-slate-50 flex items-center gap-1.5">
            <Server className="w-4.5 h-4.5 text-[#1B3A6B]" /> Trạng Thái Máy Chủ
          </h3>

          <div className="space-y-3">
            {systemHealth.map((sy, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-700">{sy.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 font-bold">
                    {sy.status}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{sy.ping}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Audit Stream (Col 1) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50">
            <h3 className="font-bold text-[#1B3A6B] text-sm">Nhật Ký Gần Đây</h3>
            <button 
              onClick={() => setTab('audit')} 
              className="text-[11px] text-[#1B3A6B] font-semibold hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="text-xs flex gap-2.5 pb-2.5 border-b border-slate-50 last:border-none last:pb-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0 text-[10px] uppercase">
                  {log.actor.substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 line-clamp-2">
                    <span className="font-bold text-slate-900">{log.actor.split('@')[0]}</span>
                    {' '}đã{' '}
                    <span className={`font-semibold ${
                      log.action === 'CREATE' ? 'text-emerald-600' :
                      log.action === 'DELETE_SOFT' ? 'text-red-500' :
                      'text-sky-700'
                    }`}>
                      {log.action === 'CREATE' ? 'tạo' : log.action === 'DELETE_SOFT' ? 'xóa mềm' : 'cập nhật'}
                    </span>
                    {' '}{log.entity}{' '}
                    <span className="font-semibold text-slate-900 border-b border-dashed border-slate-400">
                      {log.metadata.name || log.entity_id}
                    </span>
                  </p>
                  <p className="text-[9px] text-[#1B3A6B] font-mono mt-1">
                    <FormattedDate date={log.created_at} type="time" options={{ hour: '2-digit', minute: '2-digit', second: '2-digit' }} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
