import { FolderOpen, MessageSquare, Package, Phone } from 'lucide-react';

import { getInquiryCount, getNewInquiriesCount } from '@/lib/services/admin/inquiries';

interface StatCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export default async function AdminDashboardPage() {
  const [{ count: totalInquiries }, { count: newInquiries }] = await Promise.all([
    getInquiryCount(),
    getNewInquiriesCount(),
  ]);

  const stats: StatCard[] = [
    {
      title: 'Tổng sản phẩm',
      value: '-',
      icon: <Package className="w-6 h-6" />,
      color: 'bg-[#F4F7FB] text-[#1B3A6B]',
    },
    {
      title: 'Tổng danh mục',
      value: '-',
      icon: <FolderOpen className="w-6 h-6" />,
      color: 'bg-white text-[#1B3A6B]',
    },
    {
      title: 'Yêu cầu mới',
      value: String(newInquiries),
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'bg-[#FFF5F5] text-[#E31E24]',
    },
    {
      title: 'Tổng yêu cầu',
      value: String(totalInquiries),
      icon: <Phone className="w-6 h-6" />,
      color: 'bg-white text-[#1B3A6B]',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">Tổng quan quản trị</h1>
        <p className="mt-2 text-slate-600">
          Theo dõi nhanh khu vực quản trị và chuẩn bị cho các phase CRUD tiếp theo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`${stat.color} rounded-2xl border border-[#D7E0EC] p-6 transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="opacity-50">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-[#D7E0EC] bg-white p-8">
        <h2 className="mb-4 text-xl font-bold text-[#1B3A6B]">Trạng thái hiện tại</h2>
        <p className="mb-6 text-slate-600">
          Dashboard đã chuyển sang guard server-side. CRUD sản phẩm, danh mục và nhân sự sẽ được
          triển khai ở phase riêng như yêu cầu.
        </p>
        <ul className="space-y-2 text-slate-600">
          <li>- Guard server-side cho toàn bộ nhóm route dashboard</li>
          <li>- Đăng nhập quản trị bằng email/mật khẩu của Supabase Auth</li>
          <li>- Nền tảng `admin_users` sẵn sàng cho phase quản trị nhân sự</li>
        </ul>
      </div>
    </div>
  );
}
