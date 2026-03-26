import type { PropsWithChildren } from 'react';

import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { PageContainer } from './PageContainer';
import { ToolHero } from './ToolHero';
import { usePageMetadata } from '../../lib/seo/usePageMetadata';

type ToolLayoutProps = PropsWithChildren<{
  title: string;
  description: string;
  trustLine?: string;
  metaTitle?: string;
  metaDescription?: string;
  heroVariant?: 'neutral' | 'brand';
}>;

export function ToolLayout({
  title,
  description,
  trustLine,
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
        <ToolHero title={title} description={description} trustLine={trustLine} />

        <section className='space-y-10'>{children}</section>
      </PageContainer>
      <AppFooter />
    </>
  );
}
