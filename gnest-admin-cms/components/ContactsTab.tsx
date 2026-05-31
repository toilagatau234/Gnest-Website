'use client';

import React from 'react';
import { Plus, Edit2, Phone, MessageCircle, ArrowUpDown, Shield } from 'lucide-react';
import { Contact } from '@/lib/mock-data';

interface ContactsTabProps {
  contacts: Contact[];
  onOpenDrawer: (type: string, data?: any) => void;
  searchText: string;
}

export default function ContactsTab({
  contacts,
  onOpenDrawer,
  searchText
}: ContactsTabProps) {

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.role.toLowerCase().includes(searchText.toLowerCase()) ||
    c.phone.includes(searchText)
  );

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
      
      {/* Tab Header layout */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-base font-bold text-[#1B3A6B]">Đội Ngũ Nhân Sự Tư Vấn</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Quản trị viên liên hệ bán hàng, số hotline và nút nhấn chát Zalo nổi hiển thị ở mặt client
          </p>
        </div>

        <button
          onClick={() => onOpenDrawer('contact_add')}
          className="bg-[#1B3A6B] text-white hover:bg-[#112546] transition-all text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 max-w-max"
        >
          <Plus className="w-4 h-4" /> Thêm nhân sự tư vấn
        </button>
      </div>

      {/* Grid of contacts for previewing and editing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <div key={contact.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-5 shadow-xs relative flex flex-col justify-between group transition-all hover:shadow-md">
            
            {/* Options absolute header button */}
            <button 
              onClick={() => onOpenDrawer('contact_edit', contact)}
              className="absolute top-4 right-4 p-1.5 bg-white text-slate-500 hover:text-slate-800 rounded-lg shadow-xs border border-slate-100 hover:border-slate-200 transition-all opacity-80 group-hover:opacity-100"
              title="Chỉnh sửa thông tin"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Avatar & basic details */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md relative bg-slate-200 shrink-0">
                  <img 
                    src={contact.avatar_url} 
                    alt={contact.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}`;
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{contact.name}</h3>
                  <p className="text-slate-500 text-[11px] font-medium mt-0.5">{contact.role}</p>
                </div>
              </div>

              {/* Direct links list */}
              <div className="space-y-2 border-t border-slate-200/40 pt-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Hotline: <strong className="text-slate-800">{contact.phone}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Zalo link: <strong className="text-emerald-700">{contact.zalo}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Mức hiển thị ưu tiên: <strong className="text-slate-800">Thứ tự {contact.sort_order}</strong></span>
                </div>
              </div>
            </div>

            {/* Status indicators */}
            <div className="mt-5 pt-3 border-t border-slate-200/40 flex items-center justify-between text-[11px]">
              <span className={`px-2 py-0.5 rounded-md font-bold ${
                contact.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {contact.is_active ? 'Đang hoạt động' : 'Tạm khóa ẩn'}
              </span>
              
              <div className="flex items-center gap-1.5 text-slate-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Client Card ready</span>
              </div>
            </div>

          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Phone className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-bold text-sm">Không tìm thấy tư vấn viên nào</p>
            <p className="text-slate-400 text-xs">Vui lòng kiểm tra lại từ khóa tìm kiếm của bạn.</p>
          </div>
        )}
      </div>

    </div>
  );
}
