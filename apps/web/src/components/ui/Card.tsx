import type { PropsWithChildren } from 'react';

export function Card({ children }: PropsWithChildren) {
  return (
    <div className='rounded-2xl border border-ui-border bg-ui-surface p-6 shadow-sm md:p-8'>
      {children}
    </div>
  );
}
