import type { PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren) {
  return (
    <main className='mx-auto w-[min(1040px,94vw)] py-6 md:py-8'>
      {children}
    </main>
  );
}
