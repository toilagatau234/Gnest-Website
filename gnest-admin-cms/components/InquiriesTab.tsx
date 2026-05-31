'use client';

import React, { useState } from 'react';
import { 
  Quote, 
  Search, 
  PhoneCall, 
  MessageSquare, 
  Mail, 
  UserPlus, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertOctagon,
  EyeOff
} from 'lucide-react';
import { Inquiry } from '@/lib/mock-data';
import FormattedDate from './FormattedDate';

interface InquiriesTabProps {
  inquiries: Inquiry[];
  onOpenDrawer: (type: string, data?: any) => void;
  searchText: string;
  triggerToast: (msg: string, type: 'success' | 'error') => void;
}

type StatusFilter = 'Tất cả' | 'Mới' | 'Đã liên hệ' | 'Đã báo giá' | 'Đã đóng' | 'Spam';

export default function InquiriesTab({
  inquiries,
  onOpenDrawer,
  searchText,
  triggerToast
}: InquiriesTabProps) {
  const [activeStatusTab, setActiveStatusTab] = useState<StatusFilter>('Tất cả');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');

  // Status Counts
  const getStatusCount = (status: StatusFilter) => {
    if (status === 'Tất cả') return inquiries.length;
    return inquiries.filter(i => i.status === status).length;
  };

  const statusToggles: { label: StatusFilter; count: number; colorClass: string }[] = [
    { label: 'Tất cả', count: getStatusCount('Tất cả'), colorClass: 'bg-slate-100 text-slate-700' },
    { label: 'Mới', count: getStatusCount('Mới'), colorClass: 'bg-red-50 text-[#E31E24] border-red-200' },
    { label: 'Đã liên hệ', count: getStatusCount('Đã liên hệ'), colorClass: 'bg-amber-50 text-amber-700' },
    { label: 'Đã báo giá', count: getStatusCount('Đã báo giá'), colorClass: 'bg-emerald-50 text-emerald-800' },
    { label: 'Đã đóng', count: getStatusCount('Đã đóng'), colorClass: 'bg-slate-100 text-slate-500' },
    { label: 'Spam', count: getStatusCount('Spam'), colorClass: 'bg-rose-100 text-rose-800' }
  ];

  // List products in current inquiries for filtering
  const distinctProducts = Array.from(new Set(inquiries.map(i => i.product_name)));

  // Filtering list
  const filteredInquiries = inquiries.filter(i => {
    const matchesSearch = i.customer_name.toLowerCase().includes(searchText.toLowerCase()) || 
                          i.phone.includes(searchText) || 
                          i.email.toLowerCase().includes(searchText.toLowerCase()) ||
                          i.message.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = activeStatusTab === 'Tất cả' || i.status === activeStatusTab;
    const matchesProduct = selectedProductFilter === 'all' || i.product_name === selectedProductFilter;

    return matchesSearch && matchesStatus && matchesProduct;
  });

  const handleQuickCall = (phone: string, name: string) => {
    triggerToast(`Đang giả lập cuộc gọi VoIP đến ${name} (${phone})...`, "success");
  };

  const handleQuickZalo = (phone: string, name: string) => {
    triggerToast(`Đang mở chuyển tiếp URL chat Zalo cho số điện thoại ${phone} (${name})`, "success");
    window.open(`https://zalo.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
      
      {/* Tab Header title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-base font-bold text-[#1B3A6B]">Yêu Cầu Báo Giá (B2B CRM)</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Quản trị và phản hồi dữ liệu khách hàng đăng ký lấy bảng giá sỉ hộp quà, hũ thủy tinh
          </p>
        </div>
        
        {/* Product interested quick filter filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Lọc SP Quan Tâm:</span>
          <select 
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] text-slate-600 font-semibold"
          >
            <option value="all">Tất cả sản phẩm</option>
            {distinctProducts.map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CRM Stage Kanban Toggles / Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusToggles.map((toggle, idx) => (
          <button
            key={idx}
            onClick={() => setActiveStatusTab(toggle.label)}
            className={`
              px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-2
              ${activeStatusTab === toggle.label 
                ? 'bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-sm' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }
            `}
          >
            <span>{toggle.label}</span>
            <span className={`
              px-1.5 py-0.2 rounded-md text-[9px] font-mono leading-none
              ${activeStatusTab === toggle.label ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}
            `}>
              {toggle.count}
            </span>
          </button>
        ))}
      </div>

      {/* Inquiries CRM Core Table */}
      {filteredInquiries.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
          <Quote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-sm">Không có yêu cầu báo giá nào</p>
          <p className="text-slate-400 text-xs mt-1">Hộp thư ở trạng thái trống hoặc không có yêu cầu nào khớp bộ lọc phù hợp.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
          <table className="w-full text-xs text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="p-3">Khách hàng / Liên hệ</th>
                <th className="p-3">Sản phẩm quan tâm</th>
                <th className="p-3 max-w-xs">Nội dung tin nhắn</th>
                <th className="p-3">Người phụ trách</th>
                <th className="p-3">Ngày gửi</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Liên hệ nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="p-3">
                    <p className="font-bold text-slate-800">{inq.customer_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{inq.phone}</p>
                    <p className="text-[10px] text-slate-400 truncate">{inq.email}</p>
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 bg-[#1B3A6B]/5 text-[#1B3A6B] font-bold text-[10px] rounded-md border border-[#1B3A6B]/10 block max-w-max">
                      {inq.product_name}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs">
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">{inq.message}</p>
                    {inq.notes.length > 0 && (
                      <span className="block mt-1 font-bold text-[#E31E24] text-[9px] uppercase tracking-wider font-mono bg-red-100/10 max-w-max px-1 rounded">
                        • Có {inq.notes.length} ghi chú nội bộ
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-slate-700">
                    {inq.assigned_to || (
                      <span className="text-slate-400 italic font-normal text-[10px]">Chưa tiếp nhận</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[10px] text-slate-500">
                    <span className="block"><FormattedDate date={inq.created_at} type="date" /></span>
                    <span className="block text-[9px] text-[#1B3A6B]"><FormattedDate date={inq.created_at} type="time" /></span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] rounded-md font-bold border ${
                      inq.status === 'Mới' ? 'bg-red-50 text-[#E31E24] border-red-200 animate-pulse' :
                      inq.status === 'Đã liên hệ' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      inq.status === 'Đã báo giá' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      inq.status === 'Đã đóng' ? 'bg-slate-50 text-slate-400 border-slate-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {inq.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleQuickCall(inq.phone, inq.customer_name)}
                        className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg border border-sky-100 transition-colors"
                        title="Gọi hotline"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        onClick={() => handleQuickZalo(inq.phone, inq.customer_name)}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                        title="Mở Chat Zalo"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        onClick={() => onOpenDrawer('inquiry_details', inq)}
                        className="p-2 bg-[#1B3A6B]/5 hover:bg-[#1B3A6B]/15 text-[#1B3A6B] rounded-lg border border-[#1B3A6B]/10 transition-colors font-bold text-[10px]"
                        title="Xử lý chi tiết CRM"
                      >
                        Xử lý
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CRM Tips footer */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-slate-400 text-[10px] border-t border-slate-100 pt-3 font-medium">
        <p>Tìm thấy {filteredInquiries.length} lượt yêu cầu báo giá.</p>
        <p className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-[#1B3A6B]" /> Thời gian phản hồi khuyến nghị sỉ B2B: <span className="font-bold text-red-650 text-red-600 uppercase font-mono">&lt; 15 phút</span>
        </p>
      </div>

    </div>
  );
}
