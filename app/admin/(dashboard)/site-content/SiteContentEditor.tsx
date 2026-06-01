'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  Globe,
  Code,
  Heading1,
  FileText,
  MapPin,
  Sparkles,
  Save,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { SiteContentsPayload } from '@/lib/services/admin/site-content';
import { saveSiteContentAction, type SiteContentFormState } from './actions';

interface Props {
  initialContents: SiteContentsPayload;
}

const initialState: SiteContentFormState = { ok: false };

export function SiteContentEditor({ initialContents }: Props) {
  const [editorMode, setEditorMode] = useState<'visual' | 'split'>('split');
  const formRef = useRef<HTMLFormElement>(null);

  // Hero
  const [heroTitle, setHeroTitle] = useState(initialContents.hero.title);
  const [heroSubtitle, setHeroSubtitle] = useState(initialContents.hero.subtitle);
  const [heroCta, setHeroCta] = useState(initialContents.hero.cta_text);
  const [heroBanner, setHeroBanner] = useState(initialContents.hero.banner_url);

  // Footer
  const [footerName, setFooterName] = useState(initialContents.footer.company_name);
  const [footerAddress, setFooterAddress] = useState(initialContents.footer.address);
  const [footerPhone, setFooterPhone] = useState(initialContents.footer.phone);
  const [footerEmail, setFooterEmail] = useState(initialContents.footer.email);

  // CTA
  const [ctaZalo, setCtaZalo] = useState(initialContents.cta.zalo_url);
  const [ctaHotline, setCtaHotline] = useState(initialContents.cta.hotline);

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialContents.seo.site_title);
  const [seoDesc, setSeoDesc] = useState(initialContents.seo.meta_description);

  const [formState, formAction, isPending] = useActionState(saveSiteContentAction, initialState);

  // Show toast on success/error
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!formState.ok && !formState.error) return;
    if (formState.ok) {
      setToast({ type: 'success', msg: 'Đã lưu cấu hình nội dung website thành công!' });
    } else if (formState.error) {
      setToast({ type: 'error', msg: formState.error });
    }
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [formState]);

  const compiledPreview: SiteContentsPayload = {
    hero: { title: heroTitle, subtitle: heroSubtitle, cta_text: heroCta, banner_url: heroBanner },
    footer: { company_name: footerName, address: footerAddress, phone: footerPhone, email: footerEmail },
    cta: { zalo_url: ctaZalo, hotline: ctaHotline },
    seo: { site_title: seoTitle, meta_description: seoDesc },
  };

  const inputClass =
    'w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800 text-xs';

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-medium transition-all ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          )}
          {toast.msg}
        </div>
      )}

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1B3A6B]">Nội Dung Động Website</h2>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Tùy biến trang chủ, thông tin liên hệ chân trang &amp; thẻ SEO — lưu ngay lên Supabase
            </p>
          </div>

          <div className="flex overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                editorMode === 'visual'
                  ? 'bg-white shadow-xs text-[#1B3A6B] font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Globe className="h-3.5 w-3.5" /> Visual
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('split')}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                editorMode === 'split'
                  ? 'bg-white shadow-xs text-[#1B3A6B] font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Code className="h-3.5 w-3.5" /> Split View
            </button>
          </div>
        </div>

        {/* Form */}
        <form ref={formRef} action={formAction}>
          <div className={`grid grid-cols-1 ${editorMode === 'split' ? 'xl:grid-cols-2' : ''} gap-6`}>
            {/* ─── LEFT: Visual form ─── */}
            <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-0 xl:pr-2">

              {/* GROUP 1: Hero / Trang Chủ */}
              <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <legend className="sr-only">Trang Chủ Banner</legend>
                <h3 className="flex items-center gap-2 border-b border-slate-200 pb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#1B3A6B]">
                  <Heading1 className="h-4 w-4 text-red-500" /> Trang Chủ Banner
                </h3>
                <div className="grid grid-cols-1 gap-3.5">
                  <div>
                    <label htmlFor="hero-title" className="mb-1 block text-xs font-semibold text-slate-500">
                      Hero Title
                    </label>
                    <input
                      id="hero-title"
                      name="hero.title"
                      type="text"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="hero-subtitle" className="mb-1 block text-xs font-semibold text-slate-500">
                      Hero Subtitle
                    </label>
                    <textarea
                      id="hero-subtitle"
                      name="hero.subtitle"
                      rows={3}
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="hero-cta" className="mb-1 block text-xs font-semibold text-slate-500">
                        Nút CTA
                      </label>
                      <input
                        id="hero-cta"
                        name="hero.cta_text"
                        type="text"
                        value={heroCta}
                        onChange={(e) => setHeroCta(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="hero-banner" className="mb-1 block text-xs font-semibold text-slate-500">
                        Banner URL
                      </label>
                      <input
                        id="hero-banner"
                        name="hero.banner_url"
                        type="text"
                        value={heroBanner}
                        onChange={(e) => setHeroBanner(e.target.value)}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* GROUP 2: Footer */}
              <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <legend className="sr-only">Thông tin Công Ty & Footer</legend>
                <h3 className="flex items-center gap-2 border-b border-slate-200 pb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#1B3A6B]">
                  <MapPin className="h-4 w-4 text-[#1B3A6B]" /> Thông Tin Công Ty &amp; Footer
                </h3>
                <div className="grid grid-cols-1 gap-3.5">
                  <div>
                    <label htmlFor="footer-name" className="mb-1 block text-xs font-semibold text-slate-500">
                      Tên Công Ty
                    </label>
                    <input
                      id="footer-name"
                      name="footer.company_name"
                      type="text"
                      value={footerName}
                      onChange={(e) => setFooterName(e.target.value)}
                      className={`${inputClass} font-bold`}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="footer-address" className="mb-1 block text-xs font-semibold text-slate-500">
                      Địa Chỉ
                    </label>
                    <input
                      id="footer-address"
                      name="footer.address"
                      type="text"
                      value={footerAddress}
                      onChange={(e) => setFooterAddress(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="footer-phone" className="mb-1 block text-xs font-semibold text-slate-500">
                        Điện Thoại
                      </label>
                      <input
                        id="footer-phone"
                        name="footer.phone"
                        type="text"
                        value={footerPhone}
                        onChange={(e) => setFooterPhone(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="footer-email" className="mb-1 block text-xs font-semibold text-slate-500">
                        Email
                      </label>
                      <input
                        id="footer-email"
                        name="footer.email"
                        type="email"
                        value={footerEmail}
                        onChange={(e) => setFooterEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* GROUP 3: CTA Buttons */}
              <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <legend className="sr-only">Nút Nổi Liên Hệ</legend>
                <h3 className="flex items-center gap-2 border-b border-slate-200 pb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#1B3A6B]">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> Nút Nổi Liên Hệ (CTA)
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cta-zalo" className="mb-1 block text-xs font-semibold text-slate-500">
                      Zalo URL
                    </label>
                    <input
                      id="cta-zalo"
                      name="cta.zalo_url"
                      type="text"
                      value={ctaZalo}
                      onChange={(e) => setCtaZalo(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="cta-hotline" className="mb-1 block text-xs font-semibold text-slate-500">
                      Hotline (số thuần)
                    </label>
                    <input
                      id="cta-hotline"
                      name="cta.hotline"
                      type="text"
                      value={ctaHotline}
                      onChange={(e) => setCtaHotline(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </fieldset>

              {/* GROUP 4: SEO */}
              <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <legend className="sr-only">SEO Metadata</legend>
                <h3 className="flex items-center gap-2 border-b border-slate-200 pb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#1B3A6B]">
                  <FileText className="h-4 w-4 text-slate-500" /> Google SEO Metadata
                </h3>
                <div className="grid grid-cols-1 gap-3.5">
                  <div>
                    <label htmlFor="seo-title" className="mb-1 block text-xs font-semibold text-slate-500">
                      Site Title
                    </label>
                    <input
                      id="seo-title"
                      name="seo.site_title"
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className={`${inputClass} font-bold text-[#1B3A6B]`}
                      required
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      {seoTitle.length} / 70 ký tự (khuyến nghị &lt; 70)
                    </p>
                  </div>
                  <div>
                    <label htmlFor="seo-desc" className="mb-1 block text-xs font-semibold text-slate-500">
                      Meta Description
                    </label>
                    <textarea
                      id="seo-desc"
                      name="seo.meta_description"
                      rows={3}
                      value={seoDesc}
                      onChange={(e) => setSeoDesc(e.target.value)}
                      className={inputClass}
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      {seoDesc.length} / 160 ký tự (khuyến nghị &lt; 160)
                    </p>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* ─── RIGHT: JSON preview ─── */}
            {editorMode === 'split' && (
              <div className="relative flex h-[70vh] shrink-0 flex-col justify-between overflow-hidden rounded-xl bg-slate-900 p-5 font-mono text-slate-300">
                <div className="absolute right-2 top-2 pointer-events-none opacity-5">
                  <Code className="h-48 w-48 text-white" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] font-sans font-bold uppercase tracking-wide text-slate-400 select-none">
                    <span>Preview · site_contents → {'{dynamic_config}'}</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-500">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                  <pre className="select-all overflow-x-auto whitespace-pre-wrap text-[10px] leading-relaxed text-emerald-400">
                    {JSON.stringify(compiledPreview, null, 2)}
                  </pre>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] font-sans text-slate-500 select-none">
                  <p>Bảng: site_contents · key: dynamic_config</p>
                  <p className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#E31E24]" /> Schema OK
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit bar */}
          <div className="mt-8 flex flex-wrap justify-end gap-3.5 border-t border-slate-200/80 pt-4">
            <button
              type="button"
              onClick={() => {
                setHeroTitle(initialContents.hero.title);
                setHeroSubtitle(initialContents.hero.subtitle);
                setHeroCta(initialContents.hero.cta_text);
                setHeroBanner(initialContents.hero.banner_url);
                setFooterName(initialContents.footer.company_name);
                setFooterAddress(initialContents.footer.address);
                setFooterPhone(initialContents.footer.phone);
                setFooterEmail(initialContents.footer.email);
                setCtaZalo(initialContents.cta.zalo_url);
                setCtaHotline(initialContents.cta.hotline);
                setSeoTitle(initialContents.seo.site_title);
                setSeoDesc(initialContents.seo.meta_description);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4 text-slate-400" /> Khôi phục
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#1B3A6B] px-6 py-2.5 text-xs font-extrabold text-white shadow-xs outline-none transition-all hover:bg-[#112546] hover:shadow-md disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
              ) : (
                <Save className="h-4 w-4 text-emerald-300" />
              )}
              {isPending ? 'Đang lưu…' : 'Đồng Bộ & Lưu Cấu Hình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
