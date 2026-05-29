import React from 'react';

interface AdminSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminSection({ children, className = '' }: AdminSectionProps) {
  return <div className={`space-y-6 ${className}`}>{children}</div>;
}
