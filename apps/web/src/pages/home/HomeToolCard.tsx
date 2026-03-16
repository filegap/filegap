import type { ReactNode } from 'react';

type HomeToolCardProps = {
  name: string;
  description: string;
  href: string;
  icon: ReactNode;
};

export function HomeToolCard({ name, description, href, icon }: HomeToolCardProps) {
  return (
    <a
      href={href}
      className='rounded-xl border border-ui-border bg-ui-surface p-5 transition hover:border-brand-primary/70 hover:bg-brand-primary/10'
    >
      <div className='flex items-start gap-4'>
        <div className='inline-flex h-12 w-12 shrink-0 items-center justify-center text-brand-primary [&>svg]:h-8 [&>svg]:w-8'>
          {icon}
        </div>
        <div className='min-w-0'>
          <h2 className='font-heading text-2xl font-semibold leading-tight text-ui-text'>{name}</h2>
          <p className='mt-2 text-sm leading-relaxed text-ui-muted'>{description}</p>
        </div>
      </div>
      <p className='mt-5 inline-flex rounded-lg border border-ui-border bg-ui-bg px-4 py-2 text-sm font-semibold text-ui-muted'>
        Open tool
      </p>
    </a>
  );
}
