import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
  }
>;

export function Button({ children, disabled, loading, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className='inline-flex items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,46,139,0.28)] transition hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
    >
      {loading ? 'Processing...' : children}
    </button>
  );
}
