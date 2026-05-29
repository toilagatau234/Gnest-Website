import * as React from 'react';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-blue-100 text-blue-800 border border-blue-300',
  secondary: 'bg-gray-100 text-gray-800 border border-gray-300',
  outline: 'bg-transparent border border-gray-300 text-gray-800',
  destructive: 'bg-red-100 text-red-800 border border-red-300',
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
