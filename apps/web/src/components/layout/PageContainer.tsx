import type { PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren) {
  return (
    <main className='mx-auto w-[min(1040px,94vw)] pb-8 pt-12 md:pb-10 md:pt-14'>
      {children}
    </main>
  );
}
