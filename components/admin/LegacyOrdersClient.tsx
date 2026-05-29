'use client';

import React, { useState } from 'react';
import { Loader2, Phone, MapPin, Package, Clock, User, CheckCircle2, ChevronRight, LayoutDashboard, LogOut, Settings, ListPlus, Edit3, Trash2, Database, HelpCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/lib/categories-context';
import { useAuth } from '@/lib/auth-context';
import type { AdminUser } from '@/lib/types/admin';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  items: OrderItem[];
  status: 'pending' | 'assigned' | 'completed';
  assignedStaffId?: string;
  createdAt?: string;
}

const STAFF = [
  { id: 'hang', name: 'Thu Háº±ng' },
  { id: 'nhi', name: 'Yáº¿n Nhi' },
  { id: 'ngoc', name: 'Há»“ng Ngá»c' },
  { id: 'yen', name: 'Háº£i Yáº¿n' },
];

interface LegacyOrdersClientProps {
  adminUser: AdminUser;
}

export function LegacyOrdersClient({ adminUser }: LegacyOrdersClientProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = Boolean(user);
  const login = () => {
    router.push('/admin/login');
  };
  const { categories, addCategory, updateCategory, deleteCategory, seedDefaultCategories, isDbHealthy } = useCategories();
  const shouldUseClientGuard = false;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'assigned' | 'completed'>('pending');
  
  // Dashboard Tabs: 'orders' or 'categories'
  const [adminMenu, setAdminMenu] = useState<'orders' | 'categories'>('orders');

  // New Category Form Fields
  const [catId, setCatId] = useState('');
  const [catTitle, setCatTitle] = useState('');
  const [catType, setCatType] = useState<'product' | 'service'>('product');
  const [catParentId, setCatParentId] = useState('');
  const [catHasFilters, setCatHasFilters] = useState(false);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Edit Mode state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editParentId, setEditParentId] = useState('');
  const [editHasFilters, setEditHasFilters] = useState(false);

  const handleAssign = async (orderId: string, staffId: string) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              assignedStaffId: staffId,
              status: 'assigned',
            }
          : order
      )
    );
  };

  const handleComplete = async (orderId: string) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'completed',
            }
          : order
      )
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
    router.refresh();
  };

  // Add category submission
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId || !catTitle) {
      alert("Vui lÃ²ng Ä‘iá»n mÃ£ danh má»¥c (slug) vÃ  tiÃªu Ä‘á».");
      return;
    }
    
    setIsSubmittingCat(true);
    try {
      await addCategory(
        catId,
        catTitle,
        catParentId || null,
        catType,
        catHasFilters
      );
      setCatId('');
      setCatTitle('');
      setCatParentId('');
      setCatHasFilters(false);
      alert("ÄÃ£ thÃªm danh má»¥c thÃ nh cÃ´ng!");
    } catch (err) {
      console.error(err);
      alert("ÄÃ£ xáº£y ra lá»—i khi thÃªm danh má»¥c.");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  // Save changes to category
  const handleSaveEdit = async (id: string) => {
    if (!editTitle) return;
    try {
      await updateCategory(id, {
        title: editTitle,
        parentId: editParentId || null,
        hasFilters: editHasFilters
      });
      setEditingCatId(null);
      alert("ÄÃ£ cáº­p nháº­t thÃ´ng tin danh má»¥c.");
    } catch (err) {
      console.error(err);
      alert("Lá»—i khi cáº­p nháº­t danh má»¥c.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(`Báº¡n cháº¯c cháº¯n muá»‘n xÃ³a danh má»¥c [${id}]? CÃ¡c sáº£n pháº©m thuá»™c danh má»¥c nÃ y sáº½ hiá»ƒn thá»‹ dÆ°á»›i dáº¡ng cáº§n cáº­p nháº­t.`)) return;
    try {
      await deleteCategory(id);
      alert("ÄÃ£ xÃ³a danh má»¥c thÃ nh cÃ´ng.");
    } catch (err) {
      console.error(err);
    }
  };

  if (shouldUseClientGuard && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-5 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-dtl-red" />
          </div>
          <h1 className="text-2.5xl font-extrabold text-dtl-navy mb-2">Quyá»n Truy Cáº­p Háº¡n Cháº¿</h1>
          <p className="text-dtl-gray text-xs leading-relaxed mb-8">
            Trang nÃ y dÃ nh riÃªng cho quáº£n trá»‹ viÃªn CÃ´ng Ty Äáº¡i TÃ i Lá»£i. Vui lÃ²ng Ä‘Äƒng nháº­p vá»›i tÃ i khoáº£n Ä‘Æ°á»£c á»§y quyá»n.
          </p>
          {!user ? (
            <button 
              onClick={login}
              className="w-full bg-dtl-navy text-white font-bold py-3.5 rounded-lg hover:bg-dtl-navy-dark transition-all shadow-md"
            >
              ÄÄƒng nháº­p báº±ng Google
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-dtl-red bg-red-50 p-3 rounded">Email <strong className="font-bold underline">{adminUser.email}</strong> khÃ´ng náº±m trong danh sÃ¡ch Quáº£n trá»‹ viÃªn.</p>
              <button 
                onClick={handleLogout}
                className="w-full border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> ÄÄƒng xuáº¥t tÃ i khoáº£n
              </button>
            </div>
          )}
          <Link href="/" className="inline-block mt-6 text-sm text-dtl-red font-bold hover:underline">
            Quay láº¡i trang chá»§ Äáº¡i TÃ i Lá»£i
          </Link>
        </div>
      </div>
    );
  }

  // Count orders of different states
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const assignedCount = orders.filter(o => o.status === 'assigned').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  
  const filteredOrders = orders.filter(o => o.status === activeTab);

  // Group root categories for selection options (only products can have subcategories for now)
  const rootCategoriesOptions = categories.filter(c => c.type === 'product' && !c.parentId && c.id !== editingCatId);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Header bar */}
      <header className="bg-dtl-navy text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dtl-red rounded-lg flex items-center justify-center shadow-lg transform -rotate-2 select-none">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-tight">Äáº¡i TÃ i Lá»£i Dashboard</h1>
              <p className="text-[10px] text-white/60 tracking-widest uppercase">Báº£ng Äiá»u Phá»‘i & Quáº£n Trá»‹ Há»‡ Thá»‘ng</p>
            </div>
          </div>
          
          {/* Main Top Navigation Tab */}
          <div className="flex items-center gap-1.5 border-l border-slate-700/60 pl-6 h-full">
            <button 
              onClick={() => setAdminMenu('orders')}
              className={`px-4 py-2 font-black text-xs uppercase tracking-wider rounded-md transition-all ${
                adminMenu === 'orders' ? 'bg-dtl-red text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              YÃªu Cáº§u BÃ¡o GiÃ¡ ({orders.length})
            </button>
            <button 
              onClick={() => setAdminMenu('categories')}
              className={`px-4 py-2 font-black text-xs uppercase tracking-wider rounded-md transition-all ${
                adminMenu === 'categories' ? 'bg-dtl-red text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Quáº£n LÃ½ Danh Má»¥c
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold">
                {typeof user?.user_metadata?.full_name === 'string'
                  ? user.user_metadata.full_name
                  : adminUser.email}
              </div>
              <div className="text-[9px] text-white/50 tracking-wider">{adminUser.email}</div>
            </div>
            <button onClick={handleLogout} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors" title="ÄÄƒng xuáº¥t">
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 pt-8">

        {/* SECTION 1: INQUIRIES & ORDERS MANAGER */}
        {adminMenu === 'orders' && (
          <div className="space-y-6">
            {/* Realtime stats card buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Chá» phÃ¢n xá»­ lÃ½', key: 'pending', count: pendingCount, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Äang tÆ° váº¥n bÃ¡n hÃ ng', key: 'assigned', count: assignedCount, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'YÃªu cáº§u hoÃ n táº¥t', key: 'completed', count: completedCount, color: 'text-green-600', bg: 'bg-green-50' },
              ].map((stat) => (
                <button 
                  key={stat.key}
                  onClick={() => setActiveTab(stat.key as any)}
                  className={`p-6 rounded-2xl bg-white shadow-sm border transition-all text-left flex items-center justify-between group ${
                    activeTab === stat.key ? 'border-dtl-navy ring-4 ring-dtl-navy/5 shadow-md font-bold' : 'border-transparent hover:shadow'
                  }`}
                >
                  <div>
                    <h3 className="text-slate-400 text-[11px] font-black uppercase tracking-wider mb-1">{stat.label}</h3>
                    <p className={`text-3xl font-black ${stat.color}`}>{stat.count}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <ChevronRight className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <h2 className="text-lg font-black text-dtl-navy flex items-center gap-2 uppercase tracking-wide">
                Má»¥c: {activeTab === 'pending' ? 'BÃ¡o giÃ¡ chÆ°a bÃ n giao' : activeTab === 'assigned' ? 'Äang thá»±c hiá»‡n tÆ° váº¥n' : 'YÃªu cáº§u Ä‘Ã£ chÄƒm sÃ³c'}
                <span className="bg-dtl-navy text-white text-xs py-0.5 px-2.5 rounded-full font-black">{filteredOrders.length}</span>
              </h2>
            </div>

            {ordersLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-dtl-gray bg-white rounded-2xl border">
                <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
                <p className="text-sm font-medium">Äang truy cáº­p hÃ ng Ä‘á»£i dá»¯ liá»‡u...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
                <div className="w-20 h-20 bg-slate-50/70 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-base font-extrabold text-dtl-navy">HÃ ng Ä‘á»£i Ä‘ang rá»—ng</h3>
                <p className="text-dtl-gray text-xs mt-2">Tuyá»‡t vá»i! Táº¥t cáº£ quÃ½ khÃ¡ch hÃ ng trong hÃ ng Ä‘á»£i nÃ y Ä‘Ã£ hoÃ n táº¥t liÃªn phá»¥ trÃ¡ch.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow transition-shadow">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        
                        {/* Costumer context */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                              <User className="w-6 h-6 text-dtl-navy-dark" />
                            </div>
                            <div>
                              <div className="text-[10px] text-dtl-gray font-black uppercase tracking-wide">Danh tÃ­nh khÃ¡ch hÃ ng</div>
                              <h4 className="text-[16px] font-black text-dtl-navy leading-none mb-1.5">{order.customerName}</h4>
                              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mt-2">
                                <a href={`tel:${order.phoneNumber}`} className="flex items-center gap-1.5 text-dtl-red hover:underline">
                                  <Phone className="w-3.5 h-3.5" />
                                  {order.phoneNumber}
                                </a>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {order.createdAt
                                    ? new Date(order.createdAt).toLocaleString('vi-VN')
                                    : 'Má»›i cáº­p nháº­t'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-xs text-slate-500">
                            <MapPin className="w-4 h-4 mt-0.2 shrink-0 text-slate-400" />
                            Äá»‹a chá»‰ giao hÃ ng: {order.address}
                          </div>
                        </div>

                        {/* Product lists */}
                        <div className="flex-1 lg:max-w-md bg-[#fafafa] border border-slate-100 rounded-xl p-4">
                           <div className="text-[10px] font-black uppercase tracking-widest text-dtl-gray mb-3 pb-2 border-b border-slate-200 flex justify-between">
                              <span>Máº«u mÃ£ sá»‰ quan tÃ¢m</span>
                              <span className="text-dtl-navy">{order.items.length} phÃ¢n pháº©m</span>
                           </div>
                           <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[13px]">
                                  <span className="font-bold text-slate-700 truncate pr-4 grow">
                                    <span className="text-dtl-red font-black mr-2 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{item.quantity}</span>
                                    {item.name}
                                  </span>
                                  {item.price > 0 && (
                                    <span className="text-xs font-semibold text-slate-400">{(item.price * item.quantity).toLocaleString()}Ä‘</span>
                                  )}
                                </div>
                              ))}
                           </div>
                        </div>

                        {/* Assign and Controls */}
                        <div className="shrink-0 lg:w-[220px] flex flex-col gap-3">
                          {order.status === 'pending' && (
                            <div className="space-y-3">
                              <label className="text-[9px] font-bold text-dtl-gray uppercase block ml-1 tracking-wider">Giao phÃ³ cho nhÃ¢n viÃªn</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {STAFF.map(s => (
                                  <button 
                                    key={s.id}
                                    onClick={() => handleAssign(order.id, s.name)}
                                    className="text-[10px] font-bold py-2 rounded bg-white border border-slate-200 hover:border-dtl-red hover:text-dtl-red transition-all cursor-pointer text-center"
                                  >
                                    {s.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {order.status === 'assigned' && (
                            <div className="space-y-3.5">
                               <div className="bg-blue-50 border border-blue-100 px-3.5 py-3 rounded-xl">
                                  <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wide mb-1">NhÃ¢n viÃªn phá»¥ trÃ¡ch:</div>
                                  <div className="text-xs font-bold text-blue-700">{order.assignedStaffId}</div>
                               </div>
                               <button 
                                 onClick={() => handleComplete(order.id)}
                                 className="w-full flex items-center justify-center gap-1.5 bg-dtl-navy text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#0c1a30] transition-all shadow active:scale-95 cursor-pointer"
                               >
                                 <CheckCircle2 className="w-4 h-4 text-green-400" /> HoÃ n táº¥t tÆ° váº¥n sá»‰
                               </button>
                            </div>
                          )}

                          {order.status === 'completed' && (
                            <div className="bg-green-50 border border-green-100 py-3.5 px-4 rounded-xl flex flex-col items-center justify-center text-center">
                               <CheckCircle2 className="w-6 h-6 text-green-500 mb-1.5" />
                               <div className="text-xs font-bold text-green-700">ÄÃ£ chá»‘t thá»a thuáº­n</div>
                               <div className="text-[10px] text-green-600 mt-0.5 font-medium">Bá»Ÿi: {order.assignedStaffId}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: CATEGORIES MANAGER */}
        {adminMenu === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form: Create Category */}
            <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-sm p-6.5">
              <h2 className="text-base font-black uppercase text-dtl-navy tracking-wide mb-4.5 flex items-center gap-2">
                <ListPlus className="text-dtl-red w-5 h-5" /> ThÃªm danh má»¥c má»›i
              </h2>
              
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">MÃ£ Ä‘á»‹nh dáº¡ng / Slug ID (Dáº¡ng khÃ´ng dáº¥u, viáº¿t liá»n)</label>
                  <input 
                    type="text" 
                    placeholder="E.g. chai-ruou, nuoc-yen"
                    value={catId}
                    onChange={(e) => setCatId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-3 text-xs font-semibold focus:outline-none focus:border-dtl-red text-slate-800 bg-[#fafafa]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">TiÃªu Ä‘á» hiá»ƒn thá»‹ (Tiáº¿ng Viá»‡t)</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Chai RÆ°á»£u Thá»§y Tinh"
                    value={catTitle}
                    onChange={(e) => setCatTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-3 text-xs font-semibold focus:outline-none focus:border-dtl-red text-slate-800 bg-[#fafafa]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">PhÃ¢n loáº¡i tá»•ng quÃ¡t</label>
                    <select
                      value={catType}
                      onChange={(e) => setCatType(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-800 bg-white cursor-pointer"
                    >
                      <option value="product">Sáº£n pháº©m</option>
                      <option value="service">Dá»‹ch vá»¥ ká»¹ thuáº­t</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Bá»™ lá»c thÃ´ng sá»‘</label>
                    <div className="flex items-center gap-2.5 h-11 border border-slate-200 rounded-lg px-3 bg-white">
                      <input 
                        type="checkbox" 
                        id="hasFilters"
                        checked={catHasFilters}
                        onChange={(e) => setCatHasFilters(e.target.checked)}
                        className="w-4.5 h-4.5 accent-dtl-red cursor-pointer"
                      />
                      <label htmlFor="hasFilters" className="text-xs text-slate-600 font-bold cursor-pointer">Báº­t lá»c chai lá»</label>
                    </div>
                  </div>
                </div>

                {catType === 'product' && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Danh má»¥c Cha (Äá»ƒ táº¡o nhÃ³m danh má»¥c con)</label>
                    <select
                      value={catParentId}
                      onChange={(e) => setCatParentId(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-800 bg-white cursor-pointer"
                    >
                      <option value="">KhÃ´ng cÃ³ - Danh má»¥c Cáº¥p 1</option>
                      {rootCategoriesOptions.map(root => (
                        <option key={root.id} value={root.id}>{root.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingCat}
                  className="w-full bg-dtl-red hover:bg-dtl-red-dark text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListPlus className="w-4 h-4" />}
                  Khá»Ÿi Táº¡o Danh Má»¥c
                </button>
              </form>

              {/* Seeding section */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-blue-800 mb-1">
                    <Database className="w-4 h-4" /> TRÃŒNH PHá»¤C Há»’I DANH Má»¤C
                  </div>
                  <p className="text-blue-700 leading-relaxed mb-3.5 font-medium">
                    Náº¿u báº¡n vá»«a kÃ­ch hoáº¡t database hoáº·c muá»‘n thiáº¿t láº­p láº¡i Ä‘áº§y Ä‘á»§ cáº¥u trÃºc 24 danh má»¥c chuáº©n (Chai lá», há»™p nhá»±a, phá»¥ kiá»‡n yáº¿n, gia cÃ´ng CNC gá»— cÃ´ng nghiá»‡p...), nháº¥p vÃ o nÃºt dÆ°á»›i.
                  </p>
                  <button
                    onClick={seedDefaultCategories}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-black py-2.5 rounded-lg transition-colors cursor-pointer border border-transparent shadow uppercase tracking-wide flex items-center justify-center gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5" /> Äá»“ng Bá»™ 24 Danh Má»¥c Chuáº©n
                  </button>
                </div>
              </div>
            </div>

            {/* List: Manage/Edit Categories */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-xs text-dtl-navy uppercase tracking-wider">Danh má»¥c sá»‰ láº» Äáº¡i TÃ i Lá»£i ({categories.length})</h3>
                    <p className="text-[10px] text-dtl-gray mt-0.5">CÃ¡c danh má»¥c Ä‘Æ°á»£c quáº£n lÃ½ Ä‘á»“ng bá»™ theo thá»i gian thá»±c</p>
                  </div>
                  <span className={`text-[10px] font-black border uppercase px-2.5 py-0.5 rounded-full select-none ${
                    isDbHealthy ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {isDbHealthy ? 'â— DATABASE ONLINE' : 'â— SYSTEM OFFLINE'}
                  </span>
                </div>

                <div className="p-4 divide-y divide-slate-100 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {categories.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-25" />
                      <p className="text-xs font-semibold">ChÆ°a cÃ³ danh má»¥c nÃ o trong há»‡ thá»‘ng, nháº¥n Äá»“ng Bá»™ Ä‘á»ƒ khá»Ÿi táº¡o.</p>
                    </div>
                  ) : (
                    categories.map((cat) => {
                      const isEditing = editingCatId === cat.id;
                      const isChild = !!cat.parentId;

                      return (
                        <div key={cat.id} className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isChild ? 'pl-8 bg-slate-50/40 border-l-2 border-slate-100' : ''}`}>
                          
                          {/* Left contents or Edit View */}
                          {isEditing ? (
                            <div className="flex-1 space-y-2.5">
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="text" 
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="border p-2 rounded text-xs text-slate-800 font-bold bg-white"
                                  placeholder="TiÃªu Ä‘á» máº«u"
                                />
                                <select
                                  value={editParentId}
                                  onChange={(e) => setEditParentId(e.target.value)}
                                  className="border p-2 rounded text-xs text-slate-800 bg-white"
                                >
                                  <option value="">KhÃ´ng cÃ³ (Danh má»¥c máº¹)</option>
                                  {rootCategoriesOptions.map(root => (
                                    <option key={root.id} value={root.id}>{root.title}</option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  id={`edit-filters-${cat.id}`}
                                  checked={editHasFilters}
                                  onChange={(e) => setEditHasFilters(e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <label htmlFor={`edit-filters-${cat.id}`} className="text-xs font-bold text-slate-600">Báº­t bá»™ lá»c thÃ´ng sá»‘</label>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded select-none ${
                                  cat.type === 'service' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' : 'bg-amber-50 text-amber-700 border border-amber-150'
                                }`}>
                                  {cat.type === 'service' ? 'Dá»‹ch vá»¥' : 'Sáº£n pháº©m'}
                                </span>
                                {isChild && <span className="text-xs text-slate-400">â†³ Con cá»§a <strong className="text-slate-600 font-semibold">{cat.parentId}</strong></span>}
                              </div>
                              <h4 className="text-sm font-black text-dtl-navy mt-1">{cat.title}</h4>
                              <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">SLUG: {cat.id} | THá»¨ Tá»°: #{cat.sortOrder}</div>
                            </div>
                          )}

                          {/* Right Controls */}
                          <div className="flex items-center gap-2 shrink-0 justify-end">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(cat.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors"
                                >
                                  LÆ°u
                                </button>
                                <button
                                  onClick={() => setEditingCatId(null)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors"
                                >
                                  Há»§y
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingCatId(cat.id);
                                    setEditTitle(cat.title);
                                    setEditParentId(cat.parentId || '');
                                    setEditHasFilters(cat.hasFilters || false);
                                  }}
                                  className="p-1 px-2 border hover:bg-slate-50 border-slate-200 hover:border-dtl-navy hover:text-dtl-navy rounded text-slate-500 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
                                  title="Sá»­a danh má»¥c"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Sá»­a
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1 px-2 border border-slate-200 hover:border-dtl-red hover:text-dtl-red hover:bg-red-50 rounded text-slate-500 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
                                  title="XÃ³a danh má»¥c"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> XÃ³a
                                </button>
                              </>
                            )}
                          </div>

                        </div>
                      )
                    })
                  )}

                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
      `}</style>
    </div>
  );
}



