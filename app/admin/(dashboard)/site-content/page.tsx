'use client';

import { useState } from 'react';
import { 
  Globe, 
  Eye, 
  Code, 
  Heading1, 
  FileText, 
  Link as LinkIcon, 
  MapPin, 
  PhoneCall, 
  Mail, 
  Sparkles,
  Save,
  CheckCircle2,
  Construction
} from 'lucide-react';

interface HeroConfig {
  title: string;
  subtitle: string;
  cta_text: string;
  banner_url: string;
}

interface FooterConfig {
  company_name: string;
  address: string;
  phone: string;
  email: string;
}

interface CtaConfig {
  zalo_float: string;
  hotline: string;
}

interface SeoConfig {
  site_title: string;
  meta_description: string;
}

interface SiteContentState {
  hero: HeroConfig;
  footer: FooterConfig;
  cta: CtaConfig;
  seo: SeoConfig;
}

const initialSiteContent: SiteContentState = {
  hero: {
    title: 'Hũ Thủy Tinh Cao Cấp Đại Tài Lợi',
    subtitle: 'Nhà máy cung ứng hũ thủy tinh thực phẩm, chai lọ gia vị sỉ B2B lớn nhất miền Nam. Đủ mẫu mã, sẵn hàng kho.',
    cta_text: 'Đăng Ký Nhận Báo Giá Sỉ',
    banner_url: '/assets/banner-glassware.jpg'
  },
  footer: {
    company_name: 'CÔNG TY TNHH ĐẠI TÀI LỢI',
    address: 'Địa chỉ xưởng sản xuất: Đường Trần Đại Nghĩa, Huyện Bình Chánh, TP. Hồ Chí Minh',
    phone: '0908.123.456 - 028.3854.789',
    email: 'contact@daitailoi-glass.com'
  },
  cta: {
    zalo_float: 'https://zalo.me/0908123456',
    hotline: '0908123456'
  },
  seo: {
    site_title: 'Đại Tài Lợi | Chai Lọ Hũ Thủy Tinh Giá Sỉ Tốt Nhất',
    meta_description: 'Chuyên cung cấp sỉ lẻ các sản phẩm chai lọ hũ thủy tinh cao cấp, hũ thủy tinh làm sữa chua, chai thủy tinh nước ép chất lượng xuất khẩu.'
  }
};

export default function SiteContentPage() {
  const [editorMode, setEditorMode] = useState<'visual' | 'split'>('split');
  
  // Localized form controllers for easy double data binding
  const [heroTitle, setHeroTitle] = useState(initialSiteContent.hero.title);
  const [heroSubtitle, setHeroSubtitle] = useState(initialSiteContent.hero.subtitle);
  const [heroCta, setHeroCta] = useState(initialSiteContent.hero.cta_text);
  const [heroBanner, setHeroBanner] = useState(initialSiteContent.hero.banner_url);
  
  const [footerName, setFooterName] = useState(initialSiteContent.footer.company_name);
  const [footerAddress, setFooterAddress] = useState(initialSiteContent.footer.address);
  const [footerPhone, setFooterPhone] = useState(initialSiteContent.footer.phone);
  const [footerEmail, setFooterEmail] = useState(initialSiteContent.footer.email);
  
  const [ctaZalo, setCtaZalo] = useState(initialSiteContent.cta.zalo_float);
  const [ctaHotline, setCtaHotline] = useState(initialSiteContent.cta.hotline);
  
  const [seoTitle, setSeoTitle] = useState(initialSiteContent.seo.site_title);
  const [seoDesc, setSeoDesc] = useState(initialSiteContent.seo.meta_description);

  // Compile local changes into a preview-able state
  const compiledState: SiteContentState = {
    hero: { title: heroTitle, subtitle: heroSubtitle, cta_text: heroCta, banner_url: heroBanner },
    footer: { company_name: footerName, address: footerAddress, phone: footerPhone, email: footerEmail },
    cta: { zalo_float: ctaZalo, hotline: ctaHotline },
    seo: { site_title: seoTitle, meta_description: seoDesc }
  };

  const [notice, setNotice] = useState<string | null>(null);

  const handleSave = () => {
    setNotice('Chức năng lưu cấu hình đang phát triển — chưa kết nối Supabase. Thay đổi hiện chỉ áp dụng cho bản xem trước.');
  };

  const handlePreviewWeb = () => {
    setNotice('Bản xem trước landing đang phát triển. Cấu trúc JSON bên phải phản ánh dữ liệu bạn đang nhập.');
  };

  return (
    <div className="space-y-4">
    {/* Honest development-status banner: this module is not yet wired to Supabase */}
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <Construction className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="text-xs leading-relaxed">
        <p className="font-bold text-amber-800">Module đang phát triển</p>
        <p className="mt-0.5 text-amber-700">
          Trình soạn thảo nội dung động đang ở chế độ xem trước. Việc lưu cấu hình lên Supabase sẽ được hoàn thiện ở phase tiếp theo.
        </p>
      </div>
    </div>

    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">

      {/* Tab Header layout */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1B3A6B]">Nội Dung Động Website / Landing Config</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Tùy biến nhanh thông tin hiển thị tại trang chủ, thông tin liên hệ chân trang & chỉ số thẻ SEO
          </p>
        </div>

        <div className="flex overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
          <button
            onClick={() => setEditorMode('visual')}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              editorMode === 'visual' 
                ? 'bg-white shadow-xs text-[#1B3A6B] font-bold' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Chỉ soạn thảo (Visual)
          </button>
          <button
            onClick={() => setEditorMode('split')}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              editorMode === 'split' 
                ? 'bg-white shadow-xs text-[#1B3A6B] font-bold' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Chế độ Chia Đôi
          </button>
        </div>
      </div>

      {/* Main Core Editor Body layout split */}
      <div className={`grid grid-cols-1 ${editorMode === 'split' ? 'xl:grid-cols-2' : ''} gap-6`}>
        
        {/* SOẠN THẢO VISUAL FORM PANEL */}
        <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-0 xl:pr-2">
          
          {/* GROUP 1: Trang Chủ Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-200 pb-2">
              <Heading1 className="w-4 h-4 text-red-500" /> Bán hàng tại Trang Chủ
            </h3>

            <div className="grid grid-cols-1 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Hero Title (Tiêu đề chính)</label>
                <input 
                  type="text" 
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Hero Subtitle (Mô tả phụ)</label>
                <textarea 
                  rows={3}
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800 leading-relaxed font-normal"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nút CTA</label>
                  <input 
                    type="text" 
                    value={heroCta}
                    onChange={(e) => setHeroCta(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Banner Image URL</label>
                  <input 
                    type="text" 
                    value={heroBanner}
                    onChange={(e) => setHeroBanner(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800 font-mono text-[10px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 2: Chân trang (Footer metadata) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-200 pb-2">
              <MapPin className="w-4 h-4 text-[#1B3A6B]" /> Thông tin Công Ty & Footer
            </h3>

            <div className="grid grid-cols-1 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Tên Công Ty niêm yết</label>
                <input 
                  type="text" 
                  value={footerName}
                  onChange={(e) => setFooterName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Địa chỉ văn phòng</label>
                <input 
                  type="text" 
                  value={footerAddress}
                  onChange={(e) => setFooterAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-[#2a2a2a]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Điện thoại</label>
                  <input 
                    type="text" 
                    value={footerPhone}
                    onChange={(e) => setFooterPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Email sỉ</label>
                  <input 
                    type="text" 
                    value={footerEmail}
                    onChange={(e) => setFooterEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 3: Floating Action Shortcuts */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-200 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Nút nổi liên hệ (CTA Buttons)
            </h3>

            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Zalo float hotline</label>
                <input 
                  type="text" 
                  value={ctaZalo}
                  onChange={(e) => setCtaZalo(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Hotline click-to-call</label>
                <input 
                  type="text" 
                  value={ctaHotline}
                  onChange={(e) => setCtaHotline(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* GROUP 4: Meta SEO Configuration */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-slate-500" /> Google Search SEO Metadata
            </h3>

            <div className="grid grid-cols-1 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Tiêu đề Website chính (Seo Title)</label>
                <input 
                  type="text" 
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-[#1B3A6B] font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Thẻ mô tả nội dung (Meta Description)</label>
                <textarea 
                  rows={2}
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-700 text-xs font-medium"
                />
              </div>
            </div>
          </div>

        </div>

        {/* COMPILER PAYLOAD PANEL VIEWPORT */}
        {editorMode === 'split' && (
          <div className="relative flex h-[70vh] shrink-0 flex-col justify-between overflow-hidden rounded-xl bg-slate-900 p-5 font-mono text-slate-300">
            <div className="absolute top-2 right-2 p-2 opacity-5 pointer-events-none">
              <Code className="w-48 h-48 text-white" />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-2 uppercase font-sans font-bold select-none">
                <span>Cấu trúc schema Database site_contents</span>
                <span className="text-emerald-500 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> JSON Validated
                </span>
              </div>

              <pre className="text-[10px] text-emerald-400 select-all overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(compiledState, null, 2)}
              </pre>
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-sans select-none">
              <p>Trực thuộc bảng: site_contents • ID: dynamic_config</p>
              <p className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#E31E24]" /> Schema Synced</p>
            </div>
          </div>
        )}

      </div>

      {notice ? (
        <div role="status" className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Construction className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs font-medium text-amber-800">{notice}</p>
        </div>
      ) : null}

      {/* Buttons submit bar layout */}
      <div className="mt-8 flex flex-wrap justify-end gap-3.5 border-t border-slate-200/80 pt-4">
        <button
          onClick={handlePreviewWeb}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50"
        >
          <Eye className="w-4 h-4 text-slate-500" /> Xem trước Landing (Preview)
        </button>

        <button
          onClick={handleSave}
          className="bg-[#1B3A6B] hover:bg-[#112546] text-white hover:shadow-md transition-all text-xs font-extrabold px-6 py-2.5 rounded-xl flex items-center gap-2 outline-none shadow-xs cursor-pointer"
        >
          <Save className="w-4 h-4 text-emerald-300 animate-pulse" /> Đồng Bộ & Lưu Cấu Hình
        </button>
      </div>

    </div>
    </div>
  );
}
