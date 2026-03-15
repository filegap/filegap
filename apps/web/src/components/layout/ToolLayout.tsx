import type { PropsWithChildren } from 'react';

import { PageContainer } from './PageContainer';

type ToolLayoutProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <PageContainer>
      <header className='mb-8 space-y-3'>
        <p className='inline-flex rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-primary/80'>
          Privacy-first PDF tools
        </p>
        <h1 className='font-heading text-4xl font-bold leading-tight text-ui-text md:text-5xl'>
          {title}
        </h1>
        <p className='max-w-3xl text-base leading-relaxed text-ui-muted'>{description}</p>
      </header>

      <section className='space-y-10'>{children}</section>
    </PageContainer>
  );
}
