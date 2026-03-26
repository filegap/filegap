import type { ReactNode } from 'react';

import { TrustNotice } from '../ui/TrustNotice';

type ToolHeroProps = {
  title: string;
  description: string;
  trustLine?: string;
  children?: ReactNode;
};

export function ToolHero({ title, description, trustLine, children }: ToolHeroProps) {
  return (
    <header className='mb-8 space-y-3 md:mb-10 md:space-y-4'>
      <h1 className='font-heading text-3xl font-bold leading-tight text-ui-text md:text-4xl'>{title}</h1>
      <p className='max-w-4xl text-sm leading-relaxed text-ui-muted md:text-base'>{description}</p>
      {trustLine ? <TrustNotice /> : null}
      {children}
    </header>
  );
}
