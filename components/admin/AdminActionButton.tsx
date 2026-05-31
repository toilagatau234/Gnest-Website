import React from 'react';
import Link from 'next/link';

type ActionVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ActionSize = 'sm' | 'md';

const variantStyles: Record<ActionVariant, string> = {
  primary: 'bg-[#1B3A6B] text-white hover:bg-[#16315b] shadow-sm',
  secondary:
    'border border-[#E2E8F0] bg-white text-slate-700 hover:border-[#1B3A6B] hover:text-[#1B3A6B]',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger:
    'border border-[#E2E8F0] bg-white text-slate-600 hover:border-[#E31E24] hover:text-[#E31E24]',
};

const sizeStyles: Record<ActionSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
};

const baseStyles =
  'admin-focus inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

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
