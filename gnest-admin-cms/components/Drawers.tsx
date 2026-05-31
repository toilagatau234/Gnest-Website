'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Info, 
  Database,
  Lock,
  PhoneCall,
  User,
  PlusCircle,
  Clock,
  Sparkles,
  Link,
  DollarSign
} from 'lucide-react';
import { 
  Product, 
  Category, 
  Inquiry, 
  Contact, 
  JobVacancy, 
  AdminUser,
  ProductSpec,
  BulkDiscount,
  ProductImage
} from '@/lib/mock-data';

interface DrawersProps {
  drawerType: string;
  drawerData: any;
  categories: Category[];
  adminUsers: AdminUser[];
  onClose: () => void;
  onSaveProduct: (p: Product) => void;
  onSaveCategory: (c: Category) => void;
  onSaveInquiry: (i: Inquiry) => void;
  onSaveContact: (c: Contact) => void;
  onSaveJob: (j: JobVacancy) => void;
  onSaveAdmin: (u: AdminUser) => void;
  triggerToast: (msg: string, type: 'success' | 'error') => void;
}

export default function Drawers({
  drawerType,
  drawerData,
  categories,
  adminUsers,
  onClose,
  onSaveProduct,
  onSaveCategory,
  onSaveInquiry,
  onSaveContact,
  onSaveJob,
  onSaveAdmin,
  triggerToast
}: DrawersProps) {
  
  // Dynamic Slug helper on tone removal
  const cleanVietnameseTone = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // State elements for Product Drawer
  const [pActiveTab, setPActiveTab] = useState<number>(1);
  const [pName, setPName] = useState('');
  const [pSlug, setPSlug] = useState('');
  const [pCatId, setPCatId] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState<number | 'Liên hệ'>(3000);
  const [pStock, setPStock] = useState(1000);
  const [pUnit, setPUnit] = useState('Chiếc');
  const [pThreshold, setPThreshold] = useState(100);
  const [pIsActive, setPIsActive] = useState(true);
  const [pImages, setPImages] = useState<ProductImage[]>([]);
  const [pSpecs, setPSpecs] = useState<ProductSpec[]>([]);
  const [pBulk, setPBulk] = useState<BulkDiscount[]>([]);

  // Category State
  const [cName, setCName] = useState('');
  const [cSlug, setCSlug] = useState('');
  const [cType, setCType] = useState<'Sản phẩm' | 'Dịch vụ'>('Sản phẩm');
  const [cParentId, setCParentId] = useState<string | null>(null);
  const [cOrder, setCOrder] = useState(1);
  const [cIsActive, setCIsActive] = useState(true);

  // Contact State
  const [coName, setCoName] = useState('');
  const [coRole, setCoRole] = useState('');
  const [coPhone, setCoPhone] = useState('');
  const [coZalo, setCoZalo] = useState('');
  const [coAvatar, setCoAvatar] = useState('');
  const [coOrder, setCoOrder] = useState(1);
  const [coIsActive, setCoIsActive] = useState(true);

  // Career State
  const [jTitle, setJTitle] = useState('');
  const [jSlug, setJSlug] = useState('');
  const [jLoc, setJLoc] = useState('Quận 12, TP.HCM');
  const [jSalary, setJSalary] = useState('');
  const [jDesc, setJDesc] = useState('');
  const [jReqs, setJReqs] = useState<string[]>([]);
  const [jBens, setJBens] = useState<string[]>([]);
  const [jIsActive, setJIsActive] = useState(true);

  // Inquiry CRM State
  const [inqStatus, setInqStatus] = useState<'Mới' | 'Đã liên hệ' | 'Đã báo giá' | 'Đã đóng' | 'Spam'>('Mới');
  const [inqAssignee, setInqAssignee] = useState('');
  const [inqNotes, setInqNotes] = useState<string[]>([]);
  const [newNoteText, setNewNoteText] = useState('');

  // Admin Account Add
  const [adEmail, setAdEmail] = useState('');
  const [adRole, setAdRole] = useState<'super_admin' | 'admin' | 'editor' | 'viewer'>('editor');

  // Trigger values binding on drawer opening
  useEffect(() => {
    const timer = setTimeout(() => {
      if (drawerType.includes('product') && drawerData) {
        setPActiveTab(1);
        setPName(drawerData.name);
        setPSlug(drawerData.slug);
        setPCatId(drawerData.category_id);
        setPDesc(drawerData.description);
        setPPrice(drawerData.price);
        setPStock(drawerData.stock);
        setPUnit(drawerData.unit);
        setPThreshold(drawerData.low_stock_threshold);
        setPIsActive(drawerData.is_active);
        setPImages([...drawerData.images]);
        setPSpecs([...drawerData.specs]);
        setPBulk([...drawerData.bulk_discounts]);
      } else if (drawerType === 'product_add') {
        setPActiveTab(1);
        setPName('');
        setPSlug('');
        setPCatId(categories[0]?.id || '');
        setPDesc('');
        setPPrice(2500);
        setPStock(5000);
        setPUnit('Chiếc');
        setPThreshold(200);
        setPIsActive(true);
        setPImages([
          { id: 'img-new-1', url: 'https://picsum.photos/seed/gnest-jar1/600/400', alt: 'Mẫu sản phẩm', is_primary: true, sort_order: 1 }
        ]);
        setPSpecs([
          { key: 'Dung tích', value: '75ml' },
          { key: 'Màu nắp', value: 'Thiếc Vàng' }
        ]);
        setPBulk([]);
      } else if (drawerType.includes('category') && drawerData) {
        setCName(drawerData.name);
        setCSlug(drawerData.slug);
        setCType(drawerData.type);
        setCParentId(drawerData.parent_id);
        setCOrder(drawerData.sort_order);
        setCIsActive(drawerData.is_active);
      } else if (drawerType === 'category_add') {
        setCName('');
        setCSlug('');
        setCType('Sản phẩm');
        setCParentId(null);
        setCOrder(1);
        setCIsActive(true);
      } else if (drawerType.includes('contact') && drawerData) {
        setCoName(drawerData.name);
        setCoRole(drawerData.role);
        setCoPhone(drawerData.phone);
        setCoZalo(drawerData.zalo);
        setCoAvatar(drawerData.avatar_url);
        setCoOrder(drawerData.sort_order);
        setCoIsActive(drawerData.is_active);
      } else if (drawerType === 'contact_add') {
        setCoName('');
        setCoRole('Bộ phận Bán Hàng');
        setCoPhone('');
        setCoZalo('');
        setCoAvatar('https://picsum.photos/seed/user-tai/200/200');
        setCoOrder(1);
        setCoIsActive(true);
      } else if (drawerType.includes('job') && drawerData) {
        setJTitle(drawerData.title);
        setJSlug(drawerData.slug);
        setJLoc(drawerData.location);
        setJSalary(drawerData.salary);
        setJDesc(drawerData.description);
        setJReqs([...drawerData.requirements]);
        setJBens([...drawerData.benefits]);
        setJIsActive(drawerData.is_active);
      } else if (drawerType === 'job_add') {
        setJTitle('');
        setJSlug('');
        setJLoc('Quận 12, TP.HCM');
        setJSalary('Đạt thoả thuận (Up to 15m)');
        setJDesc('');
        setJReqs(['Kinh nghiệm từ 1 năm trở lên', 'Chăm chỉ chu đáo']);
        setJBens(['Lương cứng hấp dẫn', 'Bảo hiểm đóng đầy đủ']);
        setJIsActive(true);
      } else if (drawerType === 'inquiry_details' && drawerData) {
        setInqStatus(drawerData.status);
        setInqAssignee(drawerData.assigned_to);
        setInqNotes([...drawerData.notes]);
        setNewNoteText('');
      } else if (drawerType === 'admin_add') {
        setAdEmail('');
        setAdRole('editor');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [drawerType, drawerData, categories]);

  // Handle Name keys slug binds
  const handlePNameChange = (val: string) => {
    setPName(val);
    setPSlug(cleanVietnameseTone(val));
  };

  const handleCNameChange = (val: string) => {
    setCName(val);
    setCSlug(cleanVietnameseTone(val));
  };

  const handleJTitleChange = (val: string) => {
    setJTitle(val);
    setJSlug(cleanVietnameseTone(val));
  };

  // Submit operations handlers
  const handleOnSave = () => {
    if (drawerType.includes('product')) {
      if (!pName || !pSlug) return triggerToast("Vui lòng điền đủ Tên và Slug sản phẩm", "error");
      onSaveProduct({
        id: drawerData?.id || `prod-new-${Date.now()}`,
        category_id: pCatId,
        name: pName,
        slug: pSlug,
        description: pDesc,
        price: pPrice,
        stock: pStock,
        unit: pUnit,
        low_stock_threshold: pThreshold,
        is_active: pIsActive,
        images: pImages,
        specs: pSpecs,
        bulk_discounts: pBulk,
        updated_at: new Date().toISOString()
      });
    } else if (drawerType.includes('category')) {
      if (!cName || !cSlug) return triggerToast("Vui lòng điền đủ Tên và Slug danh mục", "error");
      onSaveCategory({
        id: drawerData?.id || `cat-new-${Date.now()}`,
        name: cName,
        slug: cSlug,
        type: cType,
        parent_id: cParentId,
        sort_order: parseInt(cOrder.toString()) || 1,
        is_active: cIsActive
      });
    } else if (drawerType.includes('contact')) {
      if (!coName || !coPhone) return triggerToast("Vui lòng nhập Tên và Số điện thoại liên lạc", "error");
      onSaveContact({
        id: drawerData?.id || `cont-new-${Date.now()}`,
        name: coName,
        role: coRole,
        phone: coPhone,
        zalo: coZalo || coPhone,
        avatar_url: coAvatar,
        sort_order: parseInt(coOrder.toString()) || 1,
        is_active: coIsActive
      });
    } else if (drawerType.includes('job')) {
      if (!jTitle || !jSlug) return triggerToast("Vui lòng điền đủ Tiêu đề và Slug tuyển dụng", "error");
      onSaveJob({
        id: drawerData?.id || `job-new-${Date.now()}`,
        title: jTitle,
        slug: jSlug,
        location: jLoc,
        salary: jSalary,
        description: jDesc,
        requirements: jReqs,
        benefits: jBens,
        is_active: jIsActive
      });
    } else if (drawerType === 'inquiry_details') {
      onSaveInquiry({
        ...drawerData,
        status: inqStatus,
        assigned_to: inqAssignee,
        notes: inqNotes
      });
    } else if (drawerType === 'admin_add') {
      if (!adEmail.includes('@')) return triggerToast("Email tài khoản quản trị chưa hợp lệ", "error");
      onSaveAdmin({
        id: `adm-new-${Date.now()}`,
        email: adEmail,
        role: adRole,
        is_active: true,
        created_at: new Date().toISOString()
      });
    }
  };

  const handleAddSpecRow = () => {
    setPSpecs(prev => [...prev, { key: 'Thông số mới', value: 'Giá trị' }]);
  };

  const handleRemoveSpecRow = (idx: number) => {
    setPSpecs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddBulkRow = () => {
    setPBulk(prev => [...prev, { min_qty: 100, price_per_unit: 3000 }]);
  };

  const handleRemoveBulkRow = (idx: number) => {
    setPBulk(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    setInqNotes(p => [...p, newNoteText.trim()]);
    setNewNoteText('');
    triggerToast("Đã bổ sung ghi chú xử lý nội bộ", "success");
  };

  return (
    <>
      {/* Sliding Drawer Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-45 transition-opacity"
        onClick={onClose}
      />

      {/* Main Right Sliding Panel container */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-slate-200">
        
        {/* Drawer Rigid Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-extrabold text-[#1B3A6B] text-base leading-none">
              {drawerType === 'product_add' ? '✨ ĐĂNG MỚI SẢN PHẨM' : 
               drawerType === 'product_edit' ? '🛠️ CHỈNH SỬA SẢN PHẨM' :
               drawerType === 'category_add' ? '✨ THÊM DANH MỤC PHỤ' :
               drawerType === 'category_edit' ? '🛠️ SỬA DANH MỤC' :
               drawerType === 'contact_add' ? '✨ THÊM TƯ VẤN VIÊN' :
               drawerType === 'contact_edit' ? '🛠️ SỬA TƯ VẤN VIÊN' :
               drawerType === 'job_add' ? '✨ ĐĂNG TIN TUYỂN DỤNG' :
               drawerType === 'job_edit' ? '🛠️ SỬA TIN TUYỂN DỤNG' :
               drawerType === 'inquiry_details' ? '📊 TIẾP NHẬN & XỬ LÝ BÁO GIÁ' :
               '🛡️ THÊM TÀI KHOẢN ADMIN'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest font-bold">
              SYSTEM PORT PORTAL
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full border border-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* RENDERING 1: PRODUCT ADD / EDIT FORMS */}
          {drawerType.includes('product') && (
            <div className="space-y-6">
              
              {/* Internal local Tab Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto select-none">
                {['Thông tin cơ bản', 'Giá & Kho sỉ', 'Specs Chi tiết', 'Mức Giá Sỉ Bậc'].map((label, tIdx) => (
                  <button
                    key={tIdx}
                    onClick={() => setPActiveTab(tIdx + 1)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-[11px] ${
                      pActiveTab === tIdx + 1 ? 'bg-white text-[#1B3A6B] font-bold shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Basic details */}
              {pActiveTab === 1 && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Tên sản phẩm *</label>
                      <input 
                        type="text" 
                        value={pName}
                        onChange={(e) => handlePNameChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                        placeholder="Ví dụ: Hũ Yến Tròn 75ml..."
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Đường dẫn sỉ (Slug) *</label>
                      <input 
                        type="text" 
                        value={pSlug}
                        onChange={(e) => setPSlug(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.8 font-mono text-[11px]"
                        placeholder="hu-yen-tron-75ml"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Danh mục sỉ phụ thuộc</label>
                    <select
                      value={pCatId}
                      onChange={(e) => setPCatId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Mô tả sản phẩm</label>
                    <textarea
                      rows={5}
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-normal text-xs leading-relaxed"
                      placeholder="Thông tin giới thiệu nguồn gốc thủy tinh, khả năng hấp chiết sỉ..."
                    />
                  </div>

                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Trạng thái công khai danh mục</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={pIsActive}
                        onChange={(e) => setPIsActive(e.target.checked)}
                        className="rounded border-slate-350"
                      />
                      <span className="font-semibold text-slate-600">Đăng bán công khai sỉ</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 2: Pricing and Inventory */}
              {pActiveTab === 2 && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Giá bán lẻ đề xuất (đ)</label>
                      <input 
                        type="text" // string support for "Liên hệ"
                        value={pPrice === 'Liên hệ' ? 'Liên hệ' : pPrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.toLowerCase() === 'lien he' || val === 'Liên hệ') {
                            setPPrice('Liên hệ');
                          } else {
                            setPPrice(parseInt(val) || 0);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:bg-white focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">Gõ “Liên hệ” hoặc số đ</span>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Đơn vị tính</label>
                      <input 
                        type="text" 
                        value={pUnit}
                        onChange={(e) => setPUnit(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Tồn sản lượng kho sỉ (Chiếc)</label>
                      <input 
                        type="number" 
                        value={pStock}
                        onChange={(e) => setPStock(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Ngưỡng báo động tồn kho thấp</label>
                      <input 
                        type="number" 
                        value={pThreshold}
                        onChange={(e) => setPThreshold(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-[#E31E24] font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 flex gap-2">
                    <Info className="w-4 h-4 shrink-0 text-[#1B3A6B]" />
                    <p className="text-[10px] leading-relaxed">Bộ kiểm kho sẽ phát cảnh báo đẩy về Dashboard nếu tồn sản lượng thấp hơn ngưỡng chỉ định.</p>
                  </div>
                </div>
              )}

              {/* Tab 3: Specs specifications list builder */}
              {pActiveTab === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider font-mono">Bảng Quy Cách & Specs Kỹ Thuật:</h4>
                    <button 
                      onClick={handleAddSpecRow}
                      className="text-[10.5px] font-bold text-[#1B3A6B] bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-250 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm dòng thông số
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {pSpecs.map((spec, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          value={spec.key}
                          onChange={(e) => {
                            const updated = [...pSpecs];
                            updated[idx].key = e.target.value;
                            setPSpecs(updated);
                          }}
                          className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold"
                          placeholder="Tên (VD: Thể tích)"
                        />
                        <input 
                          type="text" 
                          value={spec.value}
                          onChange={(e) => {
                            const updated = [...pSpecs];
                            updated[idx].value = e.target.value;
                            setPSpecs(updated);
                          }}
                          className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-medium"
                          placeholder="Giá trị (VD: 154ml)"
                        />
                        <button 
                          onClick={() => handleRemoveSpecRow(idx)}
                          className="p-1.5 bg-red-50 text-[#E31E24] hover:bg-red-100 rounded-lg border border-red-100 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {pSpecs.length === 0 && (
                      <p className="text-center py-8 text-slate-400 italic text-[11px]">Nhấn &quot;Thêm dòng thông số&quot; để thiết lập specs (vd: dung tích, nắp đậy...)</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Wholesale bậc sỉ pricing builder */}
              {pActiveTab === 4 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider font-mono">Bậc chiết khấu giá sỉ theo số lượng lấy:</h4>
                    <button 
                      onClick={handleAddBulkRow}
                      className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-250 flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600" /> Thêm cột bậc sỉ
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {pBulk.map((bulk, idx) => (
                      <div key={idx} className="flex gap-2 items-center text-xs">
                        <span className="text-slate-400 font-mono text-[10px]">Lấy &ge;</span>
                        <input 
                          type="number" 
                          value={bulk.min_qty}
                          onChange={(e) => {
                            const updated = [...pBulk];
                            updated[idx].min_qty = parseInt(e.target.value) || 0;
                            setPBulk(updated);
                          }}
                          className="w-2/5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-700"
                          placeholder="SL tối thiểu"
                        />
                        <span className="text-slate-400 font-mono text-[10px]">{pUnit}</span>
                        <input 
                          type="number" 
                          value={bulk.price_per_unit}
                          onChange={(e) => {
                            const updated = [...pBulk];
                            updated[idx].price_per_unit = parseInt(e.target.value) || 0;
                            setPBulk(updated);
                          }}
                          className="w-2/5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 font-mono text-emerald-700"
                          placeholder="Giá sỉ/chiếc"
                        />
                        <button 
                          onClick={() => handleRemoveBulkRow(idx)}
                          className="p-1.5 bg-red-50 text-[#E31E24] hover:bg-red-100 rounded-lg border border-red-100 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {pBulk.length === 0 && (
                      <p className="text-center py-8 text-slate-400 italic text-[11px]">Khách hàng sỉ B2B liên hệ lấy sỉ thương lượng thủ công nếu chưa có định mức.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* RENDERING 2: CATEGORY ADD / EDIT FORMS */}
          {drawerType.includes('category') && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Tên danh mục *</label>
                  <input 
                    type="text" 
                    value={cName}
                    onChange={(e) => handleCNameChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white"
                    placeholder="Ví dụ: Hũ Yến Tròn..."
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Slug / Đường dẫn *</label>
                  <input 
                    type="text" 
                    value={cSlug}
                    onChange={(e) => setCSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.8 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Loại danh mục</label>
                  <select
                    value={cType}
                    onChange={(e) => setCType(e.target.value as 'Sản phẩm' | 'Dịch vụ')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 p-1.8 py-2 font-bold text-slate-700"
                  >
                    <option value="Sản phẩm">Sản phẩm</option>
                    <option value="Dịch vụ">Dịch vụ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Độ ưu tiên hiển thị (Thứ tự)</label>
                  <input 
                    type="number" 
                    value={cOrder}
                    onChange={(e) => setCOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Hội tụ Danh mục Cha (Nếu có)</label>
                <select
                  value={cParentId || ''}
                  onChange={(e) => setCParentId(e.target.value ? e.target.value : null)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="">Không có (Danh mục mẹ gốc)</option>
                  {categories.filter(c => c.parent_id === null).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700">Hiển thị công khai ngoài menu</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={cIsActive}
                    onChange={(e) => setCIsActive(e.target.checked)}
                    className="rounded text-[#1B3A6B]"
                  />
                  <span className="font-semibold text-slate-600">Hiển thị công khai</span>
                </label>
              </div>
            </div>
          )}

          {/* RENDERING 3: CONTACT ADD / EDIT FORMS */}
          {drawerType.includes('contact') && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-center py-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md mx-auto relative">
                    <img src={coAvatar} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    onClick={() => triggerToast("Trực thuộc hệ thống bóc tách avatar từ thư viện dicebear hoặc upload Supabase Storage", "success")}
                    className="text-[10px] bg-white hover:bg-slate-50 border border-slate-205 border-slate-200 px-3 py-1 rounded-md"
                  >
                    Đổi Avatar nhân sự
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Mã Họ tên tư vấn *</label>
                  <input 
                    type="text" 
                    value={coName}
                    onChange={(e) => setCoName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="Nguyễn Văn Tài"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Vai trò hiển thị *</label>
                  <input 
                    type="text" 
                    value={coRole}
                    onChange={(e) => setCoRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-700"
                    placeholder="Hỗ trợ hũ yến sỉ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Số điện thoại bàn *</label>
                  <input 
                    type="text" 
                    value={coPhone}
                    onChange={(e) => setCoPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Link Zalo Chat (Hotline ID)</label>
                  <input 
                    type="text" 
                    value={coZalo}
                    onChange={(e) => setCoZalo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="Nhập SĐT Zalo"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700">Cho phép hoạt động ngoài Client</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={coIsActive}
                    onChange={(e) => setCoIsActive(e.target.checked)}
                    className="rounded text-[#1B3A6B]"
                  />
                  <span className="font-semibold text-slate-600">Đang trực tuyến</span>
                </label>
              </div>
            </div>
          )}

          {/* RENDERING 4: JOBS ADD / EDIT FORMS */}
          {drawerType.includes('job') && (
            <div className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Tiêu đề vị trí tuyển *</label>
                  <input 
                    type="text" 
                    value={jTitle}
                    onChange={(e) => handleJTitleChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="VD: Designer bao bì..."
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Slug / Đường dịch ứng tuyển *</label>
                  <input 
                    type="text" 
                    value={jSlug}
                    onChange={(e) => setJSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.8 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Địa điểm công tác</label>
                  <input 
                    type="text" 
                    value={jLoc}
                    onChange={(e) => setJLoc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Khoảng lương sỉ đề xuất</label>
                  <input 
                    type="text" 
                    value={jSalary}
                    onChange={(e) => setJSalary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-emerald-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Mô tả tóm lược nghiệp vụ</label>
                <textarea 
                  rows={4}
                  value={jDesc}
                  onChange={(e) => setJDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-normal text-xs leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700">Mở nhận hồ sơ ứng tuyển</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={jIsActive}
                    onChange={(e) => setJIsActive(e.target.checked)}
                    className="rounded text-[#1B3A6B]"
                  />
                  <span className="font-semibold text-slate-600">Đang tuyển dụng</span>
                </label>
              </div>
            </div>
          )}

          {/* RENDERING 5: INQUIRIES DETAIL CRM */}
          {drawerType === 'inquiry_details' && (
            <div className="space-y-6">
              
              {/* Client Info Grid representation */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs leading-relaxed">
                <h4 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider font-mono border-b border-slate-200 pb-2">
                  Dữ Liệu Khách Đăng Ký Hệ Thống
                </h4>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <p className="text-slate-500">Khách hàng: <strong className="text-slate-800">{drawerData.customer_name}</strong></p>
                  <p className="text-slate-500">Phụ trách: <strong className="text-slate-800">{inqAssignee}</strong></p>
                  
                  <p className="text-slate-500">Hotline: <strong className="text-slate-800 font-mono">{drawerData.phone}</strong></p>
                  <p className="text-slate-500">Email sỉ: <strong className="text-slate-850 truncate select-all">{drawerData.email}</strong></p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 mt-2 font-medium">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Dòng tin nhắn từ quý khách:</p>
                  <p className="text-slate-700 mt-1">{drawerData.message}</p>
                </div>
              </div>

              {/* Status & Coordinator panel inputs */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Chuyển đổi Trạng thái CRM</label>
                  <select
                    value={inqStatus}
                    onChange={(e) => setInqStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-700"
                  >
                    <option value="Mới">Mới (Chưa tiếp cận)</option>
                    <option value="Đã liên hệ">Đã gọi / Liên hệ sỉ</option>
                    <option value="Đã báo giá">Đã phát hành báo giá</option>
                    <option value="Đã đóng">Đã đóng deal</option>
                    <option value="Spam">Thu hồi / Spam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Gán Nhân sự xử lý sỉ</label>
                  <select
                    value={inqAssignee}
                    onChange={(e) => setInqAssignee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-700"
                  >
                    <option value="">Chưa bàn giao</option>
                    <option value="Nguyễn Văn Tài">Nguyễn Văn Tài (Sales leader)</option>
                    <option value="Lê Thị Lợi">Lê Thị Lợi (Hũ Yến)</option>
                    <option value="Trần Minh Đại">Trần Minh Đại (Bao Bì)</option>
                  </select>
                </div>
              </div>

              {/* Internal notes Comment threads lists */}
              <div className="space-y-3.5 border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#E31E24]" /> Nhật ký xử lý & Ghi chú nội bộ
                </h4>

                <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                  {inqNotes.map((note, nIdx) => (
                    <div key={nIdx} className="p-2.5 bg-yellow-50 text-yellow-800 border-l-4 border-l-yellow-400 rounded-r-xl text-xs flex justify-between items-start">
                      <p className="flex-1 font-medium">{note}</p>
                      <button 
                        onClick={() => setInqNotes(p => p.filter((_, i) => i !== nIdx))}
                        className="text-yellow-600 hover:text-red-500 font-bold font-mono text-[9px] uppercase ml-2 bg-white/50 px-1 rounded"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}

                  {inqNotes.length === 0 && (
                    <p className="text-slate-400 italic text-[11px] py-4 text-center">Chưa có ghi chú xử lý nội bộ nào được ghi chú lên tệp tin khách.</p>
                  )}
                </div>

                {/* Adding Notes builder input */}
                <div className="flex gap-2 items-center text-xs">
                  <input 
                    type="text" 
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
                    placeholder="Bản ghi nhớ nhanh (Vd: gửi mẫu hôm nay...)"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                  />
                  <button 
                    onClick={handleAddNote}
                    className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-3.5 py-2 font-bold whitespace-nowrap shrink-0"
                  >
                    Ghi nhớ
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* RENDERING 6: ADMIN USER ADD */}
          {drawerType === 'admin_add' && (
            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Email truy cập đăng ký *</label>
                <input 
                  type="email" 
                  value={adEmail}
                  onChange={(e) => setAdEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                  placeholder="admin.gnest@domain.vn"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Thẩm định Vai trò (Role matrix)</label>
                <select
                  value={adRole}
                  onChange={(e) => setAdRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-700"
                >
                  <option value="super_admin">Super Admin (Tối cao)</option>
                  <option value="admin">Hệ thống Admin</option>
                  <option value="editor">Biên Tập Viên</option>
                  <option value="viewer">Viewer (Chỉ xem dữ liệu)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Role matrix thiết lập sẵn ma trận quyền lực tương ứng.</span>
              </div>

              <div className="p-3 bg-yellow-50 text-yellow-805 border border-yellow-250 rounded-xl flex gap-2">
                <Info className="w-4.5 h-4.5 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">Khi tạo, cổng sẽ tự động phát email chào mừng kèm link thiết lập mật khẩu sỉ đến quản trị viên này thông qua SMTP.</p>
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer fixed submit buttons panel */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3.5">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 text-xs font-bold rounded-xl outline-none"
          >
            Quay lại
          </button>
          
          <button 
            onClick={handleOnSave}
            className="px-6 py-2 bg-[#1B3A6B] hover:bg-[#112546] text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 outline-none shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-300" /> Lưu lại
          </button>
        </div>

      </div>
    </>
  );
}
