import type { ButtonHTMLAttributes } from 'react';

type Variant = 'default' | 'primary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'default', className = '', ...props }: ButtonProps) {
  const variantClass = variant === 'default' ? '' : `btn-${variant}`;
  return <button type="button" className={`btn ${variantClass} ${className}`.trim()} {...props} />;
}
