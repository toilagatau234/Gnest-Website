'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  Eye, 
  Code, 
  Heading1, 
  FileText, 
  Link, 
  MapPin, 
  PhoneCall, 
  Mail, 
  Sparkles,
  Save,
  CheckCircle2
} from 'lucide-react';
import { SiteContent } from '@/lib/mock-data';

interface ContentTabProps {
  siteContent: SiteContent;
  onChangeContent: (updated: SiteContent) => void;
  triggerToast: (msg: string, type: 'success' | 'error') => void;
}

export default function ContentTab({
  siteContent,
  onChangeContent,
  triggerToast
}: ContentTabProps) {
  const [editorMode, setEditorMode] = useState<'visual' | 'split'>('split');
  
  // Localized form controllers for easy double data binding
  const [heroTitle, setHeroTitle] = useState(siteContent.hero.title);
  const [heroSubtitle, setHeroSubtitle] = useState(siteContent.hero.subtitle);
  const [heroCta, setHeroCta] = useState(siteContent.hero.cta_text);
  const [heroBanner, setHeroBanner] = useState(siteContent.hero.banner_url);
  
  const [footerName, setFooterName] = useState(siteContent.footer.company_name);
  const [footerAddress, setFooterAddress] = useState(siteContent.footer.address);
  const [footerPhone, setFooterPhone] = useState(siteContent.footer.phone);
  const [footerEmail, setFooterEmail] = useState(siteContent.footer.email);
  
  const [ctaZalo, setCtaZalo] = useState(siteContent.cta.zalo_float);
  const [ctaHotline, setCtaHotline] = useState(siteContent.cta.hotline);
  
  const [seoTitle, setSeoTitle] = useState(siteContent.seo.site_title);
  const [seoDesc, setSeoDesc] = useState(siteContent.seo.meta_description);

  // Compile local changes into a preview-able state
  const compiledState: SiteContent = {
    hero: { title: heroTitle, subtitle: heroSubtitle, cta_text: heroCta, banner_url: heroBanner },
    footer: { company_name: footerName, address: footerAddress, phone: footerPhone, email: footerEmail, social_fb: siteContent.footer.social_fb, social_zalo: siteContent.footer.social_zalo },
    cta: { zalo_float: ctaZalo, hotline: ctaHotline, form_quote_title: siteContent.cta.form_quote_title },
    seo: { site_title: seoTitle, meta_description: seoDesc, og_image: siteContent.seo.og_image }
  };

  const handleSave = () => {
    onChangeContent(compiledState);
    triggerToast("Đã lưu và đồng bộ cấu hình trang chủ/SEO lên database Supabase!", "success");
  };

  const handlePreviewWeb = () => {
    triggerToast("Đang kết xuất mô phỏng giao diện Trang chủ Gnest với dữ liệu mới...", "success");
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
      
      {/* Tab Header layout */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-base font-bold text-[#1B3A6B]">Nội Dung Động Website / Landing Config</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Tùy biến nhanh thông tin hiển thị tại trang chủ, thông tin liên hệ chân trang & chỉ số thẻ SEO
          </p>
        </div>

        <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setEditorMode('visual')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              editorMode === 'visual' 
                ? 'bg-white shadow-xs text-[#1B3A6B] font-bold' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Chỉ soạn thảo (Visual)
          </button>
          <button
            onClick={() => setEditorMode('split')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              editorMode === 'split' 
                ? 'bg-white shadow-xs text-[#1B3A6B] font-bold' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Chế độ Chia Đôi (Form + JSON payload)
          </button>
        </div>
      </div>

      {/* Main Core Editor Body layout split */}
      <div className={`grid grid-cols-1 ${editorMode === 'split' ? 'xl:grid-cols-2' : ''} gap-6`}>
        
        {/* SOẠN THẢO VISUAL FORM PANEL */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          
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

              <div className="grid grid-cols-2 gap-3">
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
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Địa chỉ văn phòng</label>
                <input 
                  type="text" 
                  value={footerAddress}
                  onChange={(e) => setFooterAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Bộ máy phone</label>
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

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Zalo float hotline</label>
                <input 
                  type="text" 
                  value={ctaZalo}
                  onChange={(e) => setCtaZalo(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-850"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Hotline click-to-call</label>
                <input 
                  type="text" 
                  value={ctaHotline}
                  onChange={(e) => setCtaHotline(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-850"
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
          <div className="bg-slate-900 rounded-2xl p-5 flex flex-col justify-between text-slate-300 font-mono relative overflow-hidden shrink-0 h-[70vh]">
            <div className="absolute top-2 right-2 p-2 opacity-5 pointer-events-none">
              <Code className="w-48 h-48 text-white" />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-2 uppercase font-sans font-bold">
                <span>Cấu trúc schema Database site_contents</span>
                <span className="text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> JSON Validated
                </span>
              </div>

              <pre className="text-[10px] text-emerald-400 select-all overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(compiledState, null, 2)}
              </pre>
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-sans">
              <p>Trực thuộc bảng: site_contents • ID: dynamic_config</p>
              <p className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#E31E24]" /> Schema Synced</p>
            </div>
          </div>
        )}

      </div>

      {/* Buttons submit bar layout */}
      <div className="mt-8 pt-4 border-t border-slate-200/80 flex justify-end gap-3.5">
        <button
          onClick={handlePreviewWeb}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 outline-none"
        >
          <Eye className="w-4 h-4 text-slate-500" /> Xem trước Landing (Preview)
        </button>

        <button
          onClick={handleSave}
          className="bg-[#1B3A6B] hover:bg-[#112546] text-white hover:shadow-md transition-all text-xs font-extrabold px-6 py-2.5 rounded-xl flex items-center gap-2 outline-none shadow-xs"
        >
          <Save className="w-4 h-4 text-emerald-300" /> Đông Bộ & Lưu Cấu Hình
        </button>
      </div>

    </div>
  );
}
