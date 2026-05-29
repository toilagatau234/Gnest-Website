import { AlertCircle } from 'lucide-react';

import { InquiriesTable } from '@/components/admin/InquiriesTable';
import { getInquiries } from '@/lib/services/admin/inquiries';

export const revalidate = 60;

export default async function AdminInquiriesPage() {
  const { data: inquiries, error } = await getInquiries({ limit: 100 });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">Yêu cầu báo giá</h1>
        <p className="mt-2 text-slate-600">Theo dõi và xử lý các yêu cầu gửi từ khách hàng.</p>
      </div>

      {error ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải yêu cầu báo giá</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      {!error && (!inquiries || inquiries.length === 0) ? (
        <div className="rounded-2xl border border-[#D7E0EC] bg-white p-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-[#F4F7FB] p-3">
              <AlertCircle className="h-6 w-6 text-[#1B3A6B]" />
            </div>
          </div>
          <p className="text-slate-700">Chưa có yêu cầu báo giá nào</p>
          <p className="mt-2 text-sm text-slate-500">
            Khi khách hàng gửi form, dữ liệu sẽ hiển thị tại đây.
          </p>
        </div>
      ) : null}

      {!error && inquiries && inquiries.length > 0 ? <InquiriesTable inquiries={inquiries} /> : null}
    </div>
  );
}
