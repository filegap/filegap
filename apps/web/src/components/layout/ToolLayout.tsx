import type { PropsWithChildren } from 'react';

import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { PageContainer } from './PageContainer';
import { usePageMetadata } from '../../lib/seo/usePageMetadata';

type ToolLayoutProps = PropsWithChildren<{
  title: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  heroVariant?: 'neutral' | 'brand';
}>;

export function ToolLayout({
  title,
  description,
  metaTitle,
  metaDescription,
  children,
  heroVariant: _heroVariant = 'neutral',
}: ToolLayoutProps) {
  usePageMetadata({
    title: metaTitle ?? title,
    description: metaDescription ?? description,
  });

  return (
    <>
      <AppHeader />
      <PageContainer>
        <header className='mb-8 space-y-3 md:mb-10 md:space-y-4'>
          <h1 className='font-heading text-3xl font-bold leading-tight text-ui-text md:text-4xl'>{title}</h1>
          <p className='max-w-4xl text-sm leading-relaxed text-ui-muted md:text-base'>{description}</p>
        </header>

        <section className='space-y-10'>{children}</section>
      </PageContainer>
      <AppFooter />
    </>
  );
}
