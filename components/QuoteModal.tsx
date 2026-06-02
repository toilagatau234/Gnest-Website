'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { X, Send, CheckCircle, AlertCircle, Tag } from 'lucide-react';
import { useModal, type QuoteProductContext } from '@/lib/context';
import { submitQuoteAction, type QuoteFormState } from '@/app/actions/inquiries';

const IDLE: QuoteFormState = { status: 'idle' };

// Inner form component — remounts on key change, resetting useActionState to IDLE
function QuoteForm({
  context,
  onClose,
}: {
  context: QuoteProductContext | null;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(submitQuoteAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
    }
  }, [state]);

  if (state.status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <CheckCircle className="w-14 h-14 text-green-500" />
        <h3 className="text-[16px] font-bold text-dtl-dark">Gửi yêu cầu thành công!</h3>
        <p className="text-[13px] text-dtl-gray max-w-[280px]">
          Đội ngũ kinh doanh Đại Tài Lợi sẽ liên hệ với bạn trong thời gian sớm nhất.
        </p>
        <button
          onClick={onClose}
          className="mt-2 bg-dtl-navy text-white font-bold text-[13px] px-6 py-2.5 rounded-lg hover:bg-dtl-navy-dark transition-colors"
        >
          Đóng
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-4">
      {/* Hidden product context fields */}
      {context && (
        <>
          <input type="hidden" name="product_id" value={context.productId} />
          <input type="hidden" name="product_slug" value={context.productSlug} />
          <input type="hidden" name="product_name" value={context.productName} />
        </>
      )}

      {state.status === 'error' && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="qm-name" className="block text-[13px] font-semibold text-dtl-dark mb-1.5">
          Họ tên <span className="text-dtl-red">*</span>
        </label>
        <input
          id="qm-name"
          name="customer_name"
          type="text"
          required
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          className="w-full border border-dtl-border rounded-lg px-3.5 py-2.5 text-[14px] text-dtl-dark placeholder-dtl-gray/60 focus:outline-none focus:border-dtl-navy focus:ring-2 focus:ring-dtl-navy/15 bg-white transition"
        />
      </div>

      <div>
        <label htmlFor="qm-phone" className="block text-[13px] font-semibold text-dtl-dark mb-1.5">
          Số điện thoại <span className="text-dtl-red">*</span>
        </label>
        <input
          id="qm-phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="0901 234 567"
          className="w-full border border-dtl-border rounded-lg px-3.5 py-2.5 text-[14px] text-dtl-dark placeholder-dtl-gray/60 focus:outline-none focus:border-dtl-navy focus:ring-2 focus:ring-dtl-navy/15 bg-white transition"
        />
      </div>

      <div>
        <label htmlFor="qm-email" className="block text-[13px] font-semibold text-dtl-dark mb-1.5">
          Email <span className="text-dtl-gray font-normal">(không bắt buộc)</span>
        </label>
        <input
          id="qm-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="example@company.com"
          className="w-full border border-dtl-border rounded-lg px-3.5 py-2.5 text-[14px] text-dtl-dark placeholder-dtl-gray/60 focus:outline-none focus:border-dtl-navy focus:ring-2 focus:ring-dtl-navy/15 bg-white transition"
        />
      </div>

      <div>
        <label htmlFor="qm-message" className="block text-[13px] font-semibold text-dtl-dark mb-1.5">
          Nội dung yêu cầu <span className="text-dtl-gray font-normal">(không bắt buộc)</span>
        </label>
        <textarea
          id="qm-message"
          name="message"
          rows={3}
          placeholder="Số lượng cần đặt, yêu cầu đặc biệt..."
          className="w-full border border-dtl-border rounded-lg px-3.5 py-2.5 text-[14px] text-dtl-dark placeholder-dtl-gray/60 focus:outline-none focus:border-dtl-navy focus:ring-2 focus:ring-dtl-navy/15 bg-white transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-dtl-red hover:bg-dtl-red-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] py-3.5 rounded-lg transition-colors shadow-sm"
      >
        {isPending ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-5 h-5 shrink-0" />
        )}
        {isPending ? 'Đang gửi...' : 'Gửi yêu cầu báo giá'}
      </button>

      <p className="text-[11px] text-dtl-gray text-center">
        Thông tin của bạn được bảo mật và chỉ dùng để liên hệ báo giá.
      </p>
    </form>
  );
}

export function QuoteModal() {
  const { isQuoteModalOpen, quoteProductContext, closeQuoteModal } = useModal();
  // Increment key each time the modal opens for a new product — remounts QuoteForm,
  // resetting useActionState to IDLE so the success screen never leaks across sessions.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (isQuoteModalOpen) {
      setFormKey((k) => k + 1);
    }
  }, [isQuoteModalOpen, quoteProductContext?.productId]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[4000] transition-opacity duration-300 ${
          isQuoteModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeQuoteModal}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-full max-w-[480px] rounded-xl shadow-2xl z-[4001] overflow-hidden transition-all duration-300 ${
          isQuoteModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-modal-title"
      >
        {/* Header */}
        <div className="bg-dtl-navy px-5 py-4 flex items-center justify-between">
          <div>
            <h2
              id="quote-modal-title"
              className="text-white font-bold text-[16px] uppercase tracking-wide"
            >
              Yêu cầu báo giá
            </h2>
            {quoteProductContext && (
              <p className="text-white/60 text-[12px] mt-0.5 flex items-center gap-1">
                <Tag className="w-3 h-3 shrink-0" />
                {quoteProductContext.productName}
              </p>
            )}
          </div>
          <button
            onClick={closeQuoteModal}
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — keyed so useActionState resets on each new open */}
        <div className="p-5 overflow-y-auto max-h-[75vh] bg-[#f8f9fa]">
          <QuoteForm key={formKey} context={quoteProductContext} onClose={closeQuoteModal} />
        </div>
      </div>
    </>
  );
}
