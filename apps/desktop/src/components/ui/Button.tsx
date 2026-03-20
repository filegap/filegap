import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'ghost';
  }
>;

export function Button({ children, loading, disabled, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`btn btn-${variant}`.trim()}
      type={props.type ?? 'button'}
    >
      {loading ? 'Processing...' : children}
    </button>
  );
}
