import React from 'react';
import Link from 'next/link';

type ActionVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ActionSize = 'sm' | 'md';

const variantStyles: Record<ActionVariant, string> = {
  primary:
    'bg-[#4880FF] text-white shadow-sm shadow-[#4880FF]/20 hover:-translate-y-0.5 hover:bg-[#3749A6] hover:shadow-md hover:shadow-[#4880FF]/25 active:translate-y-0 active:scale-[0.98]',
  secondary:
    'border border-[#E5E7EF] bg-white text-[#202224] shadow-sm hover:-translate-y-0.5 hover:border-[#C9D2E6] hover:bg-[#F7F9FB] hover:text-[#3749A6] active:translate-y-0 active:scale-[0.98]',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]',
  danger:
    'border border-[#E5E7EF] bg-white text-slate-600 hover:border-[#E31E24] hover:bg-[#E31E24]/5 hover:text-[#E31E24] active:scale-[0.98]',
};

const sizeStyles: Record<ActionSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
};

const baseStyles =
  'admin-focus inline-flex items-center justify-center rounded-[10px] font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-60';

interface AdminActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ActionVariant;
  size?: ActionSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** When set, renders a navigation link styled identically to the button. */
  href?: string;
}

/**
 * One button style for the whole admin: navy primary, neutral secondary,
 * ghost and danger. Renders an anchor when `href` is provided so links and
 * buttons stay visually identical.
 */
export function AdminActionButton({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  href,
  ...buttonProps
}: AdminActionButtonProps) {
  const classes = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...buttonProps} type={buttonProps.type ?? 'button'}>
      {icon}
      {children}
    </button>
  );
}
