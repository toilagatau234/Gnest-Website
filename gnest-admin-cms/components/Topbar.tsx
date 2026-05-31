'use client';

import React from 'react';
import { 
  Search, 
  Menu, 
  LogOut, 
  Bell, 
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Server,
  CloudLightning,
  CheckCircle2,
  Sliders
} from 'lucide-react';

interface TopbarProps {
  currentTab: string;
  onMenuClick: () => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  userRole: string;
  onLogout: () => void;
  
  // Simulation switches
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  isEmpty: boolean;
  setIsEmpty: (val: boolean) => void;
  hasError: boolean;
  setHasError: (val: boolean) => void;
  triggerToast: (msg: string, type: 'success' | 'error') => void;
}

export default function Topbar({
  currentTab,
  onMenuClick,
  searchText,
  onSearchChange,
  userRole,
  onLogout,
  isLoading,
  setIsLoading,
  isEmpty,
  setIsEmpty,
  hasError,
  setHasError,
  triggerToast
}: TopbarProps) {
  
  // Format tab name for breadcrumbs
  const getBreadcrumbName = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Tổng quan / Bảng điều khiển';
      case 'inquiries': return 'Tổng quan / Yêu cầu báo giá';
      case 'categories': return 'Catalog sản phẩm / Quản lý danh mục';
      case 'products': return 'Catalog sản phẩm / Quản lý sản phẩm';
      case 'contacts': return 'Catalog sản phẩm / Liên hệ bán hàng';
      case 'jobs': return 'Hệ thống / Tuyển dụng nhân sự';
      case 'content': return 'Hệ thống / Cấu hình nội dung website';
      case 'users': return 'Hệ thống / Tài khoản quản trị';
      case 'audit': return 'Hệ thống / Nhật ký hoạt động truy vết';
      default: return 'Trang quản trị';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Hệ thống Admin';
      case 'editor': return 'Biên Tập Viên';
      default: return 'Người Xem';
    }
  };

  return (
    <header className="sticky top-0 right-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-md h-16 px-8 border-b border-[#E2E8F0] shadow-xs">
      
      {/* Search and Navigation trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-lg md:max-w-2xl">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>

        {/* Breadcrumb Info */}
        <div className="flex items-center gap-2 text-sm hidden lg:flex select-none">
          <span className="text-slate-400 uppercase tracking-tighter text-[10px] font-bold">Trang chủ</span>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-[#1B3A6B] uppercase tracking-tighter text-[10px]">{getBreadcrumbName(currentTab)}</span>
        </div>
      </div>

      {/* Simulator Tools and Profile actions */}
      <div className="flex items-center gap-6">
        
        {/* Global Search Bar */}
        <div className="relative w-full max-w-xs hidden sm:block">
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-[#F7F9FB] border border-[#E2E8F0] rounded-full px-10 py-1.5 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] text-slate-700"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-2 pointer-events-none" />
          {searchText && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 hover:text-slate-600 bg-slate-200/50 px-1.5 py-0.5 rounded-full"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Floating Simulation Controls */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1 bg-white border border-slate-200/50 rounded-md py-0.5 shadow-xs mr-1 text-slate-500">
            <Sliders className="w-3 h-3 text-[#1B3A6B]" /> Giả Lập UI:
          </span>
          
          <button
            onClick={() => {
              setIsLoading(!isLoading);
              triggerToast(isLoading ? "Đã tắt tải chậm" : "Đang giả lập tải chậm (Skeletons)", "success");
            }}
            className={`px-2.5 py-1 rounded-md font-medium text-[10px] transition-all flex items-center gap-1 cursor-pointer ${
              isLoading 
                ? 'bg-[#1B3A6B] text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isLoading ? 'animate-spin' : ''}`} /> Skeletons
          </button>

          <button
            onClick={() => {
              setIsEmpty(!isEmpty);
              triggerToast(isEmpty ? "Đã trả lại database thực" : "Hệ thống giả lập cơ sở dữ liệu trống", "success");
            }}
            className={`px-2.5 py-1 rounded-md font-medium text-[10px] transition-all flex items-center gap-1 cursor-pointer ${
              isEmpty 
                ? 'bg-amber-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <CloudLightning className="w-2.5 h-2.5" /> Dữ liệu trống
          </button>

          <button
            onClick={() => {
              setHasError(!hasError);
              triggerToast(hasError ? "Hệ thống đã phục hồi" : "Giả lập lỗi kết nối máy chủ", "error");
            }}
            className={`px-2.5 py-1 rounded-md font-medium text-[10px] transition-all flex items-center gap-1 cursor-pointer ${
              hasError 
                ? 'bg-[#E31E24] text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <AlertTriangle className="w-2.5 h-2.5" /> Lỗi DB
          </button>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 text-xs font-semibold cursor-pointer"
             onClick={() => triggerToast("Toàn bộ cổng đồng bộ Supabase đang kết nối an toàn", "success")}>
          <Server className="w-3 h-3 text-emerald-600" />
          <span className="hidden md:inline uppercase text-[9px] tracking-wider font-bold">SUPABASE LIVE</span>
        </div>

        {/* Notifications and Profile triggers */}
        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Role Badge */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-800">Đại Tài Lợi Co.</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-[#1B3A6B] rounded-full font-bold uppercase border border-blue-100">
              {getRoleLabel(userRole)}
            </span>
          </div>
          
          <button 
            onClick={onLogout}
            title="Đăng xuất"
            className="p-2 text-slate-400 hover:text-[#E31E24] transition-colors rounded-xl hover:bg-[#E31E24]/5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
