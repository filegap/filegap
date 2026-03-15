import type { PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren) {
  return (
    <main className='mx-auto w-[min(980px,92vw)] py-10 md:py-14'>
      {children}
    </main>
  );
}
