import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    loadingLabel?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
  }
>;

export function Button({
  children,
  loading,
  loadingLabel = 'Processing...',
  disabled,
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className ?? ''}`.trim()}
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
