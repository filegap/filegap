import type { PropsWithChildren } from 'react';

export function Card({ children }: PropsWithChildren) {
  return (
    <div className='rounded-2xl border border-ui-border bg-ui-surface p-6 md:p-8'>
      {children}
    </div>
  );
}
