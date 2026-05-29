import {
  FolderOpen,
  MessageSquare,
  Package,
  Phone,
  ArrowUpRight,
  Plus,
  Briefcase,
  Users,
  Database,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { getInquiryCount, getNewInquiriesCount } from '@/lib/services/admin/inquiries';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminSection } from '@/components/admin/AdminSection';

export const dynamic = 'force-dynamic';

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

export default async function AdminDashboardPage() {
  const [{ count: totalInquiries }, { count: newInquiries }, dbStats] = await Promise.all([
    getInquiryCount(),
    getNewInquiriesCount(),
    getStats(),
  ]);

  const stats = [
    {
      title: 'Tổng sản phẩm',
      value: dbStats.hasSupabase ? String(dbStats.productsCount) : '-',
      icon: <Package className="w-5 h-5" />,
      description: dbStats.hasSupabase ? 'Các sản phẩm hiện có trong catalog' : 'Cấu hình Supabase để xem số liệu',
    },
    {
      title: 'Tổng danh mục',
      value: dbStats.hasSupabase ? String(dbStats.categoriesCount) : '-',
      icon: <FolderOpen className="w-5 h-5" />,
      description: dbStats.hasSupabase ? 'Danh mục sản phẩm & dịch vụ' : 'Cấu hình Supabase để xem số liệu',
    },
    {
      title: 'Yêu cầu mới',
      value: String(newInquiries),
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Yêu cầu báo giá mới chưa phản hồi',
      trend: newInquiries > 0 ? { value: `${newInquiries} mới`, isPositive: false } : undefined,
    },
    {
      title: 'Liên hệ sỉ active',
      value: dbStats.hasSupabase ? String(dbStats.salesContactsCount) : '-',
      icon: <Phone className="w-5 h-5" />,
      description: dbStats.hasSupabase ? 'Đầu mối liên hệ bán hàng hoạt động' : 'Cấu hình Supabase để xem số liệu',
    },
  ];

  const quickActions = [
    {
      title: 'Quản lý Sản phẩm',
      desc: 'Thêm mới hoặc điều chỉnh danh sách sản phẩm, chai lọ, hũ thủy tinh.',
      href: '/admin/products',
      icon: <Package className="w-5 h-5 text-white" />,
      color: 'from-[#1B3A6B] to-[#254F8C]',
    },
    {
      title: 'Quản lý Danh mục',
      desc: 'Quản lý danh sách các danh mục sản phẩm sỉ & lẻ và dịch vụ.',
      href: '/admin/categories',
      icon: <FolderOpen className="w-5 h-5 text-white" />,
      color: 'from-[#E31E24] to-[#F14D52]',
    },
    {
      title: 'Yêu cầu báo giá',
      desc: 'Xem và liên hệ khách hàng gửi yêu cầu tư vấn, mua sỉ bao bì.',
      href: '/admin/inquiries',
      icon: <MessageSquare className="w-5 h-5 text-white" />,
      color: 'from-amber-500 to-amber-600',
    },
    {
      title: 'Hồ sơ tuyển dụng',
      desc: 'Cập nhật danh sách tin tuyển dụng vị trí làm việc tại xưởng.',
      href: '/admin/jobs',
      icon: <Briefcase className="w-5 h-5 text-white" />,
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  return (
    <AdminSection>
      <AdminPageHeader
        title="Tổng quan quản trị"
        description="Chào mừng bạn đến với trang quản trị Gnest. Theo dõi nhanh các số liệu kinh doanh và điều hành hệ thống."
      />

      {/* Grid of Stat Cards with 3D Hover Tilt */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={stat.description}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Left Column: Quick Actions (Takes 2 span) */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard
            title="Thao tác nhanh"
            subtitle="Truy cập nhanh các phân hệ chính để quản lý dữ liệu website"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl border border-[#D7E0EC] bg-white hover:bg-slate-50 transition-all duration-300 hover:shadow-md cursor-pointer overflow-hidden"
                >
                  {/* Backdrop subtle light glow */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-slate-100 to-transparent rounded-full opacity-40 transition-transform duration-500 group-hover:scale-125" />

                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-gradient-to-br ${action.color} rounded-xl shadow-sm`}>
                      {action.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-[#1B3A6B] transition-colors duration-300">
                        {action.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {action.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B3A6B] mt-4 self-end group-hover:text-[#E31E24] transition-colors duration-300">
                    <span>Truy cập</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </AdminCard>
        </div>

        {/* Right Column: Database Connection & Info */}
        <div>
          <AdminCard
            title="Trạng thái hệ thống"
            subtitle="Giám sát kết nối cơ sở dữ liệu Supabase"
          >
            <div className="space-y-6">
              {/* Connection status badge */}
              <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <Database className={`w-5 h-5 ${dbStats.hasSupabase ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Cơ sở dữ liệu</span>
                    <span className="text-[10px] text-slate-400 font-mono">SUPABASE DB</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${dbStats.hasSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${dbStats.hasSupabase ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {dbStats.hasSupabase ? 'Đã kết nối' : 'Fallback'}
                  </span>
                </div>
              </div>

              {!dbStats.hasSupabase && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800">Chưa cấu hình Supabase</h5>
                    <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                      Để lưu dữ liệu lâu dài và trải nghiệm đầy đủ tính năng, vui lòng cấu hình tệp tin <code>.env</code> ở local hoặc thiết lập biến môi trường trên Vercel.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3.5">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Thông báo phase sau</h4>
                <ul className="space-y-2 text-xs text-slate-500 leading-relaxed font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-[#E31E24] font-bold">•</span>
                    <span>Hệ thống phân quyền RLS đã hoàn thiện để bảo vệ dữ liệu.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#E31E24] font-bold">•</span>
                    <span>CRUD chi tiết các bảng sẽ được xây dựng ở các task riêng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#E31E24] font-bold">•</span>
                    <span>Toàn bộ hoạt động của admin sẽ được ghi nhận tại bảng logs.</span>
                  </li>
                </ul>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminSection>
  );
}
