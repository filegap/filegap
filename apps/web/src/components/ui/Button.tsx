import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>;

const BASE_STYLES =
  'inline-flex items-center justify-center rounded-xl font-semibold transition-[background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-white shadow-[var(--shadow-rest)] hover:bg-brand-primary-dark hover:shadow-[var(--shadow-hover-soft)]',
  secondary:
    'border border-ui-border bg-ui-surface text-ui-text shadow-[var(--shadow-rest)] hover:border-ui-text/20 hover:bg-ui-bg hover:shadow-[var(--shadow-hover-soft)]',
  ghost: 'text-ui-text hover:bg-ui-bg',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3 text-sm',
};

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function buttonStyles({ variant = 'primary', size = 'md', className }: ButtonStyleOptions = {}) {
  return [BASE_STYLES, VARIANT_STYLES[variant], SIZE_STYLES[size], className].filter(Boolean).join(' ');
}

export function Button({
  children,
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={buttonStyles({ variant, size, className })}
    >
      {loading ? (
        <span className='inline-flex items-center gap-2'>
          <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
