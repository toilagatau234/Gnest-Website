import * as React from 'react';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#1B3A6B]/5 text-[#1B3A6B] ring-1 ring-inset ring-[#1B3A6B]/10',
  secondary: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  outline: 'bg-transparent text-slate-700 ring-1 ring-inset ring-[#E2E8F0]',
  destructive: 'bg-red-50 text-[#B42318] ring-1 ring-inset ring-red-100',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
};

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors';
  const variantStyle = variantStyles[variant];

  return (
    <div
      className={`${baseStyles} ${variantStyle} ${className || ''}`}
      {...props}
    />
  );
}
