'use client';

import type { ReactNode } from 'react';
import { useModal } from '@/lib/context';

interface RecruitmentClientActionsProps {
  label: string;
  className: string;
  icon?: ReactNode;
}

export function RecruitmentClientActions({ label, className, icon }: RecruitmentClientActionsProps) {
  const { openContactModal } = useModal();

  const handleClick = () => {
    // 1. Prefer opening existing contact modal if available
    if (typeof openContactModal === 'function') {
      try {
        openContactModal();
        return;
      } catch (err) {
        console.error('Failed to open contact modal, falling back:', err);
      }
    }

    // 2. Else scroll/navigate to existing contact section such as #lien-he or #contact
    const contactEl = document.getElementById('lien-he') || document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // 3. Else link to /lien-he if that route exists (fallback to /#lien-he)
    window.location.href = '/#lien-he';
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {icon}
      {label}
    </button>
  );
}
