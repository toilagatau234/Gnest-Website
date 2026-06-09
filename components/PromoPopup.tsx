'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { X, Send, CheckCircle, AlertCircle, Gift } from 'lucide-react';
import { submitNewsletterAction, type NewsletterFormState } from '@/app/actions/newsletter';

const IDLE: NewsletterFormState = { status: 'idle' };
const LOCAL_STORAGE_KEY = 'gnest_newsletter_submitted_or_dismissed';

export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(submitNewsletterAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // 1. Check if dismissed or submitted in the last 24 hours
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && Date.now() - parsed < 24 * 60 * 60 * 1000) {
        return; // Do not show if dismissed/submitted in the last 24 hours
      }
    }

    // 2. Show after 5 seconds delay
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state.status === 'success') {
      // Remember submission for 24 hours
      localStorage.setItem(LOCAL_STORAGE_KEY, Date.now().toString());
      formRef.current?.reset();
      // Auto close after 3 seconds on success
      const closeTimer = setTimeout(() => {
        setIsOpen(false);
      }, 3000);
      return () => clearTimeout(closeTimer);
    }
  }, [state]);

  const handleClose = () => {
    // Remember dismissal for 24 hours
    localStorage.setItem(LOCAL_STORAGE_KEY, Date.now().toString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[5000] transition-opacity duration-300 animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[450px] bg-white rounded-2xl shadow-2xl z-[5001] overflow-hidden transition-all duration-300 scale-100 opacity-100 border border-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-popup-title"
      >
        {/* Decorative Top Bar */}
        <div className="bg-gradient-to-r from-[#1B3A6B] to-[#1E4A8C] px-5 py-6 text-white text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 text-[#1B3A6B] flex items-center justify-center mb-3 shadow-inner">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <h2
            id="promo-popup-title"
            className="text-lg font-bold uppercase tracking-wide text-amber-300"
          >
            Nhận Ưu Đãi Đặc Biệt
          </h2>
          <p className="text-white/80 text-xs mt-1 max-w-[320px] mx-auto leading-relaxed">
            Đăng ký thông tin để nhận mã giảm giá 10% cho đơn hàng đầu tiên của bạn tại Gnest!
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 bg-slate-50/50">
          {state.status === 'success' ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center animate-scale-up">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <h3 className="text-sm font-bold text-slate-800">Đăng ký thành công!</h3>
              <p className="text-xs text-slate-500 max-w-[280px]">
                Mã ưu đãi đã được lưu lại. Chúng tôi sẽ gửi thông tin khuyến mãi sớm nhất cho bạn.
              </p>
              <button
                onClick={handleClose}
                className="mt-2 bg-[#1B3A6B] text-white font-bold text-xs px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : (
            <form ref={formRef} action={formAction} noValidate className="space-y-3.5">
              {/* Honeypot field for spam prevention */}
              <input type="text" name="website_hp" className="hidden" tabIndex={-1} autoComplete="off" />

              {state.status === 'error' && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{state.message}</span>
                </div>
              )}

              <div>
                <label htmlFor="pp-name" className="block text-xs font-semibold text-slate-600 mb-1">
                  Họ tên <span className="text-slate-400 font-normal">(không bắt buộc)</span>
                </label>
                <input
                  id="pp-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/15 bg-white transition"
                />
              </div>

              <div>
                <label htmlFor="pp-phone" className="block text-xs font-semibold text-slate-600 mb-1">
                  Số điện thoại
                </label>
                <input
                  id="pp-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="VD: 0901 234 567"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/15 bg-white transition"
                />
              </div>

              <div>
                <label htmlFor="pp-email" className="block text-xs font-semibold text-slate-600 mb-1">
                  Email
                </label>
                <input
                  id="pp-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="VD: email@example.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/15 bg-white transition"
                />
                <span className="text-[10px] text-slate-400 mt-1 block leading-normal">
                  * Điền số điện thoại hoặc email để nhận ưu đãi.
                </span>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 bg-[#1B3A6B] hover:bg-opacity-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs py-3 rounded-xl transition shadow-sm"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {isPending ? 'Đang gửi...' : 'Đăng ký nhận ưu đãi'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
