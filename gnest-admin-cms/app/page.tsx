'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

// Tab screens loading
import DashboardTab from '@/components/DashboardTab';
import CategoriesTab from '@/components/CategoriesTab';
import ProductsTab from '@/components/ProductsTab';
import InquiriesTab from '@/components/InquiriesTab';
import ContactsTab from '@/components/ContactsTab';
import JobsTab from '@/components/JobsTab';
import ContentTab from '@/components/ContentTab';
import AdminUsersTab from '@/components/AdminUsersTab';
import AuditLogsTab from '@/components/AuditLogsTab';

// Drawer & Visual Modal loading
import Drawers from '@/components/Drawers';
import ProductPreviewModal from '@/components/ProductPreviewModal';

// Mock Databases
import { 
  initialCategories, 
  initialProducts, 
  initialInquiries, 
  initialContacts, 
  initialJobs, 
  initialSiteContent, 
  initialAdminUsers, 
  initialAuditLogs,
  Category,
  Product,
  Inquiry,
  Contact,
  JobVacancy,
  SiteContent,
  AdminUser,
  AuditLog
} from '@/lib/mock-data';
import { RefreshCw, CloudLightning, ShieldAlert, X, Sparkles, CheckCircle2, Shield } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function AdminPage() {
  
  // Responsive sidebar toggler index
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Active Admin Auth Info
  const [currentUser, setCurrentUser] = useState<string>('toilagatau234@gmail.com');
  const [userRole, setUserRole] = useState<string>('super_admin');

  // React State Memory Database Arrays
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [jobs, setJobs] = useState<JobVacancy[]>(initialJobs);
  const [siteContent, setSiteContent] = useState<SiteContent>(initialSiteContent);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  // Global Simulator switches for designer testing
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Drawer / Modals controllers
  const [activeDrawer, setActiveDrawer] = useState<{ type: string; data?: any } | null>(null);

  // Notification Toast Stack
  const [toasts, setToasts] = useState<Toast[]>([]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-dismiss in 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Helper adding to technical Audit logs automatically as we save, delete, or clone items
  const pushAuditLog = (action: string, entity: string, id: string, metadata: any) => {
    const newLog: AuditLog = {
      id: `log-added-${Date.now()}`,
      actor: currentUser,
      action,
      entity,
      entity_id: id,
      metadata,
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- COMPREHENSIVE MUTATION CONTROLLERS ---
  
  // 1. PRODUCTS MUTATIONS
  const handleSaveProduct = (p: Product) => {
    const exists = products.some(prod => prod.id === p.id);
    if (exists) {
      setProducts(prev => prev.map(prod => prod.id === p.id ? p : prod));
      pushAuditLog('UPDATE', 'Sản phẩm', p.id, { name: p.name, category: p.category_id });
      triggerToast(`Đã lưu thay đổi cho sản phẩm '${p.name}' sỉ`, 'success');
    } else {
      setProducts(prev => [p, ...prev]);
      pushAuditLog('CREATE', 'Sản phẩm', p.id, { name: p.name });
      triggerToast(`Đã tạo thành công sản phẩm '${p.name}' sỉ vào catalog`, 'success');
    }
    setActiveDrawer(null);
  };

  const handleDeleteProduct = (id: string) => {
    const p = products.find(prod => prod.id === id);
    if (p) {
      setProducts(prev => prev.filter(prod => prod.id !== id));
      pushAuditLog('DELETE_SOFT', 'Sản phẩm', id, { name: p.name });
      triggerToast(`Đã chuyển sản phẩm sỉ '${p.name}' vào thùng rác mềm`, 'success');
    }
  };

  const handleCloneProduct = (p: Product) => {
    const cloned: Product = {
      ...p,
      id: `prod-clone-${Date.now()}`,
      name: `${p.name} - Bản Sao`,
      slug: `${p.slug}-ban-sao`,
      stock: 500,
      updated_at: new Date().toISOString()
    };
    setProducts(prev => [cloned, ...prev]);
    pushAuditLog('CREATE_CLONE', 'Sản phẩm', cloned.id, { original: p.name, alias: cloned.name });
    triggerToast(`Đã sao bản sỉ thành công từ '${p.name}'!`, 'success');
  };

  const handleToggleProductStatus = (p: Product) => {
    const updated = { ...p, is_active: !p.is_active };
    setProducts(prev => prev.map(prod => prod.id === p.id ? updated : prod));
    pushAuditLog('UPDATE_STATUS', 'Sản phẩm', p.id, { name: p.name, active: updated.is_active });
    triggerToast(`Đã ${updated.is_active ? 'BẬT hiển thị' : 'ẨN'} sản phẩm ngoài danh mục`, 'success');
  };

  // 2. CATEGORIES MUTATIONS
  const handleSaveCategory = (c: Category) => {
    const exists = categories.some(cat => cat.id === c.id);
    if (exists) {
      setCategories(prev => prev.map(cat => cat.id === c.id ? c : cat));
      pushAuditLog('UPDATE', 'Danh mục', c.id, { name: c.name });
      triggerToast(`Đã cập nhật danh mục '${c.name}'`, 'success');
    } else {
      setCategories(prev => [...prev, c]);
      pushAuditLog('CREATE', 'Danh mục', c.id, { name: c.name });
      triggerToast(`Đã thêm danh mục '${c.name}' lên cây menu`, 'success');
    }
    setActiveDrawer(null);
  };

  const handleDeleteCategory = (id: string) => {
    const c = categories.find(cat => cat.id === id);
    if (c) {
      // Check references
      const hasProducts = products.some(p => p.category_id === id);
      if (hasProducts) {
        return triggerToast(`Không được xóa danh mục này vì đang có sản phẩm liên kết tới!`, 'error');
      }
      setCategories(prev => prev.filter(cat => cat.id !== id));
      pushAuditLog('DELETE', 'Danh mục', id, { name: c.name });
      triggerToast(`Đã xóa danh mục '${c.name}'`, 'success');
    }
  };

  // 3. CONTACTS MUTATIONS
  const handleSaveContact = (c: Contact) => {
    const exists = contacts.some(co => co.id === c.id);
    if (exists) {
      setContacts(prev => prev.map(co => co.id === c.id ? c : co));
      pushAuditLog('UPDATE', 'Liên hệ bán hàng', c.id, { name: c.name });
      triggerToast(`Đã sửa thông tin liên hệ sỉ của tư vấn viên ${c.name}`, 'success');
    } else {
      setContacts(prev => [...prev, c]);
      pushAuditLog('CREATE', 'Liên hệ bán hàng', c.id, { name: c.name });
      triggerToast(`Thêm tư vấn viên sỉ ${c.name} lên kênh liên lạc`, 'success');
    }
    setActiveDrawer(null);
  };

  // 4. INQUIRIES MUTATIONS
  const handleSaveInquiry = (i: Inquiry) => {
    setInquiries(prev => prev.map(inq => inq.id === i.id ? i : inq));
    pushAuditLog('UPDATE_STATUS', 'Yêu cầu báo giá', i.id, { status: i.status, assignee: i.assigned_to });
    triggerToast(`Đã cập nhật tình trạng xử lý sỉ cho ${i.customer_name}`, 'success');
    setActiveDrawer(null);
  };

  // 5. JOBS MUTATIONS
  const handleSaveJob = (j: JobVacancy) => {
    const exists = jobs.some(jo => jo.id === j.id);
    if (exists) {
      setJobs(prev => prev.map(jo => jo.id === j.id ? j : jo));
      pushAuditLog('UPDATE', 'Tuyển dụng', j.id, { title: j.title });
      triggerToast(`Đã cập nhật tin tuyển dụng '${j.title}'`, 'success');
    } else {
      setJobs(prev => [...prev, j]);
      pushAuditLog('CREATE', 'Tuyển dụng', j.id, { title: j.title });
      triggerToast(`Đã đăng bổ sung vị trí tuyển dụng '${j.title}'`, 'success');
    }
    setActiveDrawer(null);
  };

  // 6. ADMIN USER MATRIX
  const handleSaveAdmin = (u: AdminUser) => {
    setAdminUsers(prev => [...prev, u]);
    pushAuditLog('CREATE_ADMIN', 'Tài khoản quản trị', u.id, { email: u.email, role: u.role });
    triggerToast(`Đã gửi email khôi phục bọc mật đến quản trị viên mới '${u.email}'`, 'success');
    setActiveDrawer(null);
  };

  // Site Configurations Update
  const handleSiteContentUpdate = (updated: SiteContent) => {
    setSiteContent(updated);
    pushAuditLog('UPDATE', 'Nội dung website', 'site-config', { fields: ['hero', 'footer', 'cta', 'seo'] });
  };

  // Logout simulator
  const handleLogout = () => {
    triggerToast("Hệ thống đã thu hồi Token an toàn. Chuyển hướng về cổng đăng nhập Supabase Auth...", "success");
  };

  // --- MOCK OVERRIDE RETURNING EMPTY ARRAY SIMULATIONS ---
  const activeProducts = isEmpty ? [] : products;
  const activeCategories = isEmpty ? [] : categories;
  const activeInquiries = isEmpty ? [] : inquiries;
  const activeContacts = isEmpty ? [] : contacts;
  const activeJobs = isEmpty ? [] : jobs;
  const activeAdminUsers = isEmpty ? [] : adminUsers;
  const activeAuditLogs = isEmpty ? [] : auditLogs;

  // Render Skeleton Skeletons for Loading State Simulations
  const renderLoadingSkeletons = () => (
    <div className="space-y-6">
      <div className="h-32 bg-slate-200 animate-pulse rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-xl"></div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl w-full"></div>
        ))}
      </div>
    </div>
  );

  // Render Server Connection Error Block State
  const renderErrorState = () => (
    <div className="py-20 text-center max-w-lg mx-auto bg-white border border-red-200 rounded-3xl p-8 shadow-md space-y-4">
      <div className="p-4 bg-red-50 text-[#E31E24] inline-block rounded-2xl border border-red-200">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h3 className="text-base font-bold text-slate-800 uppercase font-mono tracking-wider">
        Mất kết nối đồng bộ cơ sở dữ liệu (Supabase Offline)
      </h3>
      <p className="text-slate-500 text-xs leading-relaxed font-normal">
        Không thể kết nối đến Supabase PostgreSQL thông qua kết nối Client. Lỗi bảo mật token API key hoặc CORS policy trên server bị gián đoạn bất thường.
      </p>
      <div className="pt-4 flex justify-center gap-3">
        <button
          onClick={() => {
            setHasError(false);
            triggerToast("Hệ thống đã kết nối đồng bộ an toàn đến máy chủ Supabase", "success");
          }}
          className="bg-[#1B3A6B] hover:bg-[#112546] text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 outline-none shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 animate-spin" /> Click bọc phục hồi (Retry)
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      
      {/* 1. Side Fixed Menu */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentUser={currentUser}
        userRole={userRole}
      />

      {/* Main Panel Wrapper */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen min-w-0 overflow-hidden">
        
        {/* 2. Top Navigation header */}
        <Topbar 
          currentTab={currentTab}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          searchText={globalSearch}
          onSearchChange={setGlobalSearch}
          userRole={userRole}
          onLogout={handleLogout}
          
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          isEmpty={isEmpty}
          setIsEmpty={setIsEmpty}
          hasError={hasError}
          setHasError={setHasError}
          triggerToast={triggerToast}
        />

        {/* 3. Operational Main Canvas Container */}
        <main className="flex-grow p-6">
          {hasError ? (
            renderErrorState()
          ) : isLoading ? (
            renderLoadingSkeletons()
          ) : (
            <>
              {/* Conditional tabs router */}
              {currentTab === 'dashboard' && (
                <DashboardTab 
                  products={activeProducts}
                  categories={activeCategories}
                  inquiries={activeInquiries}
                  contacts={activeContacts}
                  auditLogs={activeAuditLogs}
                  setTab={setCurrentTab}
                  onOpenDrawer={(type, data) => setActiveDrawer({ type, data })}
                  triggerToast={triggerToast}
                />
              )}

              {currentTab === 'categories' && (
                <CategoriesTab 
                  categories={activeCategories}
                  products={products}
                  onOpenDrawer={(type, data) => setActiveDrawer({ type, data })}
                  onDeleteCategory={handleDeleteCategory}
                  searchText={globalSearch}
                />
              )}

              {currentTab === 'products' && (
                <ProductsTab 
                  products={activeProducts}
                  categories={categories}
                  onOpenDrawer={(type, data) => setActiveDrawer({ type, data })}
                  onDeleteProduct={handleDeleteProduct}
                  onCloneProduct={handleCloneProduct}
                  onToggleProductStatus={handleToggleProductStatus}
                  searchText={globalSearch}
                  triggerToast={triggerToast}
                />
              )}

              {currentTab === 'inquiries' && (
                <InquiriesTab 
                  inquiries={activeInquiries}
                  onOpenDrawer={(type, data) => setActiveDrawer({ type, data })}
                  searchText={globalSearch}
                  triggerToast={triggerToast}
                />
              )}

              {currentTab === 'contacts' && (
                <ContactsTab 
                  contacts={activeContacts}
                  onOpenDrawer={(type, data) => setActiveDrawer({ type, data })}
                  searchText={globalSearch}
                />
              )}

              {currentTab === 'jobs' && (
                <JobsTab 
                  jobs={activeJobs}
                  onOpenDrawer={(type, data) => setActiveDrawer({ type, data })}
                  searchText={globalSearch}
                />
              )}

              {currentTab === 'content' && (
                <ContentTab 
                  siteContent={siteContent}
                  onChangeContent={handleSiteContentUpdate}
                  triggerToast={triggerToast}
                />
              )}

              {currentTab === 'users' && (
                <AdminUsersTab 
                  adminUsers={activeAdminUsers}
                  onOpenDrawer={(type, data) => setActiveDrawer({ type, data })}
                  triggerToast={triggerToast}
                />
              )}

              {currentTab === 'audit' && (
                <AuditLogsTab 
                  auditLogs={activeAuditLogs}
                  searchText={globalSearch}
                />
              )}
            </>
          )}
        </main>

        {/* CMS system compliance credit footer */}
        <footer className="py-4 text-center text-[10px] text-slate-400 font-medium bg-white border-t border-slate-20070 select-none">
          <p>© 2026 Đại Tài Lợi • Gnest Administration Portal. Đồng bộ Supabase TLS 1.3 encrypted secure platform.</p>
        </footer>

      </div>

      {/* --- DRAWERS & MODALS SLIDING CANVAS PORT --- */}
      {activeDrawer && activeDrawer.type !== 'preview_product' && (
        <Drawers 
          drawerType={activeDrawer.type}
          drawerData={activeDrawer.data}
          categories={categories}
          adminUsers={adminUsers}
          onClose={() => setActiveDrawer(null)}
          onSaveProduct={handleSaveProduct}
          onSaveCategory={handleSaveCategory}
          onSaveInquiry={handleSaveInquiry}
          onSaveContact={handleSaveContact}
          onSaveJob={handleSaveJob}
          onSaveAdmin={handleSaveAdmin}
          triggerToast={triggerToast}
        />
      )}

      {/* Client product preview modal */}
      {activeDrawer && activeDrawer.type === 'preview_product' && (
        <ProductPreviewModal 
          product={activeDrawer.data}
          categories={categories}
          onClose={() => setActiveDrawer(null)}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FLOATING NOTIFICATIONS TOAST STACK --- */}
      <div className="fixed top-4 right-4 z-55 space-y-2 pointer-events-none w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              p-4 rounded-xl border flex items-start gap-3 shadow-lg pointer-events-auto transition-transform duration-300 transform translate-y-0
              ${t.type === 'success' 
                ? 'bg-white border-emerald-250 text-slate-800' 
                : 'bg-white border-red-200 text-slate-800'
              }
            `}
          >
            <div className={`p-1 rounded-lg shrink-0 ${t.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#E31E24]'}`}>
              {t.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </div>
            
            <div className="flex-1 text-xs">
              <p className="font-bold text-slate-900">{t.type === 'success' ? 'Thành công' : 'Đã xảy ra lỗi'}</p>
              <p className="text-slate-500 mt-0.5 leading-relaxed font-normal">{t.message}</p>
            </div>

            <button 
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
