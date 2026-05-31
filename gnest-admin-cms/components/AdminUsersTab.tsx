'use client';

import React from 'react';
import { Plus, Users, ShieldAlert, KeyRound, Check, X, Shield, Lock } from 'lucide-react';
import { AdminUser } from '@/lib/mock-data';
import FormattedDate from './FormattedDate';

interface AdminUsersTabProps {
  adminUsers: AdminUser[];
  onOpenDrawer: (type: string, data?: any) => void;
  triggerToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AdminUsersTab({
  adminUsers,
  onOpenDrawer,
  triggerToast
}: AdminUsersTabProps) {

  // Role Capability Matrix Row
  const roleCapabilities = [
    { cap: 'Quản lý Tài Khoản & Phân Quyền', super: true, admin: false, editor: false, viewer: false },
    { cap: 'CRUD Thiết lập Sản Phẩm/Danh Mục', super: true, admin: true, editor: true, viewer: false },
    { cap: 'Tiếp nhận & Cập nhật Báo Giá CRM', super: true, admin: true, editor: true, viewer: false },
    { cap: 'Thay Đổi Cấu Hình Landing Page/SEO', super: true, admin: true, editor: false, viewer: false },
    { cap: 'Xem báo cáo/Tra cứu nhật ký', super: true, admin: true, editor: true, viewer: true }
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-50 text-[#E31E24] border-red-200';
      case 'admin': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'editor': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin (Tối cao)';
      case 'admin': return 'Hệ thống Admin';
      case 'editor': return 'Biên tập viên';
      default: return 'Chỉ xem (Viewer)';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top statistics overview info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Tài Khoản Phân Quyền</h4>
            <p className="text-xl font-bold text-slate-800 mt-1">{adminUsers.length} tài khoản</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Cổng bảo mật mã hóa</h4>
            <p className="text-sm font-bold text-slate-800 mt-1">MD5 & SHA-256 (Supabase)</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Xác thực 2 lớp (MFA)</h4>
            <p className="text-sm font-bold text-emerald-700 mt-1">Mã tuyển dụng active</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-650 rounded-xl">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
        </div>

      </div>

      {/* Main layout splitted into account list and role matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Account List (Col 2) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm xl:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <div>
              <h3 className="font-bold text-[#1B3A6B] text-sm">Danh Sách Người Dùng Quản Trị</h3>
              <p className="text-[10px] text-slate-400">Các quản trị viên sở hữu quyền lực truy cập CMS</p>
            </div>
            
            <button
              onClick={() => onOpenDrawer('admin_add')}
              className="bg-[#1B3A6B] text-white hover:bg-[#112546] transition-all text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Admin
            </button>
          </div>

          <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
            <table className="w-full text-xs text-left min-w-[750px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="p-3">Email nhận thư báo sỉ</th>
                  <th className="p-3">Phân loại vai trò</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Khởi tạo</th>
                  <th className="p-3 text-right">Phát hành mật khẩu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span>{user.email}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded border border-emerald-100">
                        Đang hoạt động
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">
                      <FormattedDate date={user.created_at} type="date" />
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => triggerToast(`Đã gửi email khôi phục hoặc phát sinh mật khẩu đến ${user.email} mẫu sỉ B2B`, "success")}
                        className="text-[10px] text-[#1B3A6B] hover:underline font-bold bg-slate-50 p-1.5 rounded-lg border border-slate-205 border-slate-200"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Access Rights Matrix Table (Col 1) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-[#1B3A6B] text-sm pb-2 border-b border-slate-50">Ma Trận Quyền Hạn Hệ Thống</h3>
          
          <div className="space-y-3.5 text-xs">
            {roleCapabilities.map((row, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl space-y-2">
                <p className="font-bold text-slate-700 leading-tight">{row.cap}</p>
                <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider font-mono">
                  
                  <span className={`px-2 py-0.5 rounded ${row.super ? 'bg-red-50 text-[#E31E24] border border-red-100' : 'bg-slate-100 text-slate-350 bg-slate-150'}`}>
                    Super: {row.super ? 'Có' : 'Không'}
                  </span>

                  <span className={`px-2 py-0.5 rounded ${row.admin ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-350'}`}>
                    Admin: {row.admin ? 'Có' : 'Không'}
                  </span>

                  <span className={`px-2 py-0.5 rounded ${row.editor ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-slate-100 text-slate-350'}`}>
                    Editor: {row.editor ? 'Có' : 'Không'}
                  </span>

                  <span className={`px-2 py-0.5 rounded ${row.viewer ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-350'}`}>
                    Viewer: {row.viewer ? 'Có' : 'Không'}
                  </span>

                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Critical Security Alert Warning Banner Card */}
      <div className="bg-red-50/70 border border-red-250 border-red-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2 bg-[#E31E24] text-white rounded-xl shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono">
            <Lock className="w-4 h-4 text-[#E31E24]" /> CẢNH BÁO BẢO MẬT PHÂN QUYỀN (CRITICAL SECURITY NOTICE)
          </h4>
          <p className="text-slate-600 leading-relaxed font-normal">
            Việc thêm mới tài khoản quản trị viên và sửa đổi cấu trúc vai trò (Role Matrix) ngoài thực tế luôn yêu cầu thực hiện thông qua **Server Actions** hoặc **Route Handlers** có sử dụng token bảo mật cấp cao (Supabase Service Role KEY).
          </p>
          <p className="text-slate-500 italic mt-1 font-bold">
            Tuyệt đối không được phép tiếp lộ mã KEY bí mật này lên các file Client, hoặc thực hiện thay đổi quyền lực không minh bạch!
          </p>
        </div>
      </div>

    </div>
  );
}
