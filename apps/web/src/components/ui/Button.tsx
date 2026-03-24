import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { Loader2 } from 'lucide-react';

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
      className='inline-flex items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
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
