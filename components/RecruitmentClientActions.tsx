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

  return (
    <button type="button" onClick={openContactModal} className={className}>
      {icon}
      {label}
    </button>
  );
}
