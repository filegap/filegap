import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    loadingLabel?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>;

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonClassOptions = {}) {
  return ['btn', `btn-${variant}`, `btn-${size}`, className ?? ''].filter(Boolean).join(' ');
}

export function Button({
  children,
  loading,
  loadingLabel = 'Processing...',
  disabled,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={buttonClassName({ variant, size, className })}
      type={props.type ?? 'button'}
    >
      {loading ? (
        <span className="btn-loading">
          <span className="btn-spinner" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
