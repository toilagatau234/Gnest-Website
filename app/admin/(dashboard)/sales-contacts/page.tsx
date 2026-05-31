'use client';

import { useState } from 'react';
import { Plus, Edit2, Phone, MessageCircle, ArrowUpDown, Shield, Search } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  zalo: string;
  avatar_url: string;
  sort_order: number;
  is_active: boolean;
}

const mockContacts: Contact[] = [
  {
    id: 'c-1',
    name: 'Nguyễn Văn Tài',
    role: 'Trưởng Phòng Kinh Doanh Sỉ',
    phone: '0908123456',
    zalo: 'https://zalo.me/0908123456',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'c-2',
    name: 'Trần Thị Lợi',
    role: 'Tư Vấn Đại Lý Khu Vực Miền Nam',
    phone: '0909654321',
    zalo: 'https://zalo.me/0909654321',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'c-3',
    name: 'Phạm Quốc Đại',
    role: 'Hỗ Trợ Báo Giá B2B Dự Án',
    phone: '0912111222',
    zalo: 'https://zalo.me/0912111222',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    sort_order: 3,
    is_active: true
  }
];

export default function SalesContactsPage() {
  const [searchText, setSearchText] = useState('');
  const [contacts] = useState<Contact[]>(mockContacts);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.role.toLowerCase().includes(searchText.toLowerCase()) ||
    c.phone.includes(searchText)
  );

  return (
    <div className="space-y-6">
      {/* Tab Header layout */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#1B3A6B]">Đội Ngũ Nhân Sự Tư Vấn</h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị viên liên hệ bán hàng, số hotline và nút nhấn chát Zalo nổi hiển thị ở mặt client
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Tìm kiếm tư vấn viên..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-[#F7F9FB] py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          </div>

          <button
            onClick={() => alert('Tính năng CRUD đầy đủ cho nhân sự sẽ được bổ sung ở phase Storage.')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B3A6B] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#112546]"
          >
            <Plus className="w-4 h-4" /> Thêm nhân sự
          </button>
        </div>
      </div>

      {/* Grid of contacts for previewing */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredContacts.map((contact) => (
          <div key={contact.id} className="group relative flex min-w-0 flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md">
            
            {/* Options absolute header button */}
            <button 
              onClick={() => alert('Chi tiết chỉnh sửa nhân sự đang ở chế độ visual mockup.')}
              className="absolute right-4 top-4 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 opacity-80 shadow-xs transition-all hover:border-slate-300 hover:text-slate-800 group-hover:opacity-100"
              title="Chỉnh sửa thông tin"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Avatar & basic details */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-200 shadow-md relative bg-slate-200 shrink-0">
                  <img 
                    src={contact.avatar_url} 
                    alt={contact.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{contact.name}</h3>
                  <p className="text-slate-500 text-[11px] font-semibold mt-0.5">{contact.role}</p>
                </div>
              </div>

              {/* Direct links list */}
              <div className="space-y-2 border-t border-slate-200/40 pt-4 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Hotline: <strong className="text-slate-800">{contact.phone}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Zalo: <strong className="text-emerald-700">{contact.phone}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Độ ưu tiên hiển thị: <strong className="text-slate-800">Thứ tự {contact.sort_order}</strong></span>
                </div>
              </div>
            </div>

            {/* Status indicators */}
            <div className="mt-5 pt-3 border-t border-slate-200/40 flex items-center justify-between text-[11px]">
              <span className={`px-2 py-0.5 rounded-md font-bold ${
                contact.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {contact.is_active ? 'Đang hiển thị' : 'Đang ẩn'}
              </span>
              
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Shield className="w-3.5 h-3.5" />
                <span>Client Card ready</span>
              </div>
            </div>

          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div className="col-span-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
            <Phone className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-bold text-sm">Không tìm thấy tư vấn viên nào</p>
            <p className="text-slate-400 text-xs">Vui lòng kiểm tra lại từ khóa tìm kiếm của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
