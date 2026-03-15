import type { PropsWithChildren } from 'react';

import { PageContainer } from './PageContainer';

type ToolLayoutProps = PropsWithChildren<{
  title: string;
  description: string;
  heroVariant?: 'neutral' | 'brand';
}>;

export function ToolLayout({ title, description, children, heroVariant = 'neutral' }: ToolLayoutProps) {
  const isBrandHero = heroVariant === 'brand';
  return (
    <PageContainer>
      <header className='mb-8'>
        <div
          className={`relative overflow-hidden rounded-3xl border px-6 py-7 md:px-8 md:py-9 ${
            isBrandHero
              ? 'border-brand-primary/25 bg-ui-surface'
              : 'border-ui-border bg-ui-surface'
          }`}
        >
          {isBrandHero ? <div className='absolute inset-x-0 top-0 h-1 bg-brand-primary' /> : null}
          <div className='relative space-y-3'>
            <p
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                isBrandHero
                  ? 'border border-brand-primary/35 bg-brand-primary/10 text-brand-primary'
                  : 'border border-brand-primary/20 bg-brand-primary/5 text-brand-primary/80'
              }`}
            >
              Privacy-first PDF tools
            </p>
            <h1 className='font-heading text-4xl font-bold leading-tight text-ui-text md:text-5xl'>
              {title}
            </h1>
            <p className='max-w-3xl text-base leading-relaxed text-ui-muted'>{description}</p>
          </div>
        </div>
      </header>

      <section className='space-y-10'>{children}</section>
    </PageContainer>
  );
}
