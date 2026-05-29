import { FolderOpen, MessageSquare, Package, Phone } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export default function AdminDashboardPage() {
  const stats: StatCard[] = [
    {
      title: 'Tổng sản phẩm',
      value: '-',
      icon: <Package className="w-6 h-6" />,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Tổng danh mục',
      value: '-',
      icon: <FolderOpen className="w-6 h-6" />,
      color: 'bg-green-50 text-green-700',
    },
    {
      title: 'Yêu cầu mới',
      value: '-',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'bg-orange-50 text-orange-700',
    },
    {
      title: 'Liên hệ đang bật',
      value: '-',
      icon: <Phone className="w-6 h-6" />,
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600 mt-2">Chào mừng quay lại bảng điều khiển quản trị</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`${stat.color} rounded-lg p-6 transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className="opacity-50">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Bắt đầu</h2>
        <p className="text-gray-600 mb-6">
          Dùng menu bên trái để quản lý nội dung website. Các phần CRUD đầy đủ sẽ được làm ở
          phase riêng.
        </p>
        <ul className="space-y-2 text-gray-600">
          <li>- Xem yêu cầu báo giá của khách hàng</li>
          <li>- Chuẩn bị quản lý danh mục, sản phẩm và dịch vụ</li>
          <li>- Chuẩn bị cập nhật liên hệ bán hàng, tuyển dụng và nội dung website</li>
        </ul>
      </div>
    </div>
  );
}
