import type { PropsWithChildren } from 'react';

import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { PageContainer } from './PageContainer';

type ToolLayoutProps = PropsWithChildren<{
  title: string;
  description: string;
  heroVariant?: 'neutral' | 'brand';
}>;

export function ToolLayout({
  title,
  description,
  children,
  heroVariant: _heroVariant = 'neutral',
}: ToolLayoutProps) {
  return (
    <>
      <AppHeader />
      <PageContainer>
        <header className='mb-6 space-y-2'>
          <h1 className='font-heading text-3xl font-bold leading-tight text-ui-text md:text-4xl'>{title}</h1>
          <p className='max-w-4xl text-sm leading-relaxed text-ui-muted md:text-base'>{description}</p>
        </header>

        <section className='space-y-10'>{children}</section>
      </PageContainer>
      <AppFooter />
    </>
  );
}
