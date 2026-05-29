import { AlertCircle, RefreshCw } from 'lucide-react';
import { getInquiries } from '@/lib/services/admin/inquiries';
import { InquiriesTable } from '@/components/admin/InquiriesTable';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function AdminInquiriesPage() {
  const { data: inquiries, error } = await getInquiries({ limit: 100 });

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Yêu cầu báo giá</h1>
        <p className="text-gray-600 mt-2">Quản lý yêu cầu báo giá từ khách hàng</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Không thể tải yêu cầu báo giá</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm">
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!error && (!inquiries || inquiries.length === 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 rounded-full p-3">
              <AlertCircle className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <p className="text-gray-600">Chưa có yêu cầu báo giá nào</p>
          <p className="text-sm text-gray-500 mt-2">
            Yêu cầu báo giá từ khách hàng sẽ xuất hiện ở đây
          </p>
        </div>
      )}

      {/* Table */}
      {!error && inquiries && inquiries.length > 0 && (
        <InquiriesTable inquiries={inquiries} />
      )}
    </div>
  );
}
