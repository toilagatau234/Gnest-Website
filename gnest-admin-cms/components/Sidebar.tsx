'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Quote, 
  FolderTree, 
  Package, 
  PhoneCall, 
  Briefcase, 
  Globe, 
  Users, 
  History, 
  X,
  Menu
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  userRole: string;
}

export default function Sidebar({
  currentTab,
  setTab,
  isOpen,
  onClose,
  currentUser,
  userRole
}: SidebarProps) {
  const menuGroups = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inquiries', label: 'Yêu cầu báo giá', icon: Quote, badge: 'Mới' }
      ]
    },
    {
      title: 'CATALOG SẢN PHẨM',
      items: [
        { id: 'categories', label: 'Danh mục', icon: FolderTree },
        { id: 'products', label: 'Sản phẩm', icon: Package },
        { id: 'contacts', label: 'Liên hệ bán hàng', icon: PhoneCall }
      ]
    },
    {
      title: 'CẤU HÌNH HỆ THỐNG',
      items: [
        { id: 'jobs', label: 'Tuyển dụng', icon: Briefcase },
        { id: 'content', label: 'Nội dung website', icon: Globe },
        { id: 'users', label: 'Người dùng quản trị', icon: Users },
        { id: 'audit', label: 'Nhật ký hoạt động', icon: History }
      ]
    }
  ];

  const handleNav = (tabId: string) => {
    setTab(tabId);
    onClose(); // Close mobile sidebar if open
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 z-50 transform lg:translate-x-0 transition-transform duration-300 ease-in-out
        bg-gradient-to-b from-[#1B3A6B] to-[#132d56] text-white flex flex-col border-r border-white/10
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-[#1B3A6B] font-extrabold text-xl font-mono">G</span>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none tracking-tight uppercase flex items-center gap-1.5">
                ĐẠI TÀI LỢI
                <span className="w-2 h-2 rounded-full bg-[#E31E24] animate-pulse"></span>
              </h1>
              <p className="text-[10px] text-white/60 mt-1 uppercase tracking-widest leading-none">Admin CMS v2.0</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-4 lg:hidden p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <p className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 select-none">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNav(item.id)}
                        className={`
                          w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all group duration-150 text-left cursor-pointer
                          ${isActive 
                            ? 'bg-white/10 text-white border-l-4 border-white font-medium shadow-sm' 
                            : 'text-white/70 hover:bg-white/5 hover:text-white font-normal'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-white scale-105' : 'text-white/60 group-hover:text-white group-hover:scale-105'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="ml-auto bg-[#E31E24] text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer Admin Card */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E31E24] flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
              {currentUser.substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-150">{currentUser.split('@')[0]}</p>
              <p className="text-[10px] text-white/50 truncate font-mono">{currentUser}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
