import type { ReactNode } from 'react';

type HomeToolCardProps = {
  name: string;
  description: string;
  href: string;
  ctaLabel: string;
  icon: ReactNode;
};

export function HomeToolCard({ name, description, href, ctaLabel, icon }: HomeToolCardProps) {
  return (
    <a
      href={href}
      className='group rounded-xl border border-ui-border bg-ui-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-[3px] hover:border-brand-primary/35 hover:shadow-[0_16px_36px_rgba(15,23,42,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2'
    >
      <div className='flex items-start gap-4'>
        <div className='inline-flex h-12 w-12 shrink-0 items-center justify-center text-brand-primary transition-transform duration-200 ease-out group-hover:scale-110 [&>svg]:h-8 [&>svg]:w-8'>
          {icon}
        </div>
        <div className='min-w-0'>
          <h2 className='font-heading text-2xl font-semibold leading-tight text-ui-text'>{name}</h2>
          <p className='mt-2.5 text-sm leading-relaxed text-ui-muted'>{description}</p>
          <p className='mt-6 inline-flex rounded-lg border border-ui-border bg-ui-bg px-4 py-2 text-sm font-semibold text-ui-text'>
            {ctaLabel}
          </p>
        </div>
      </div>
    </a>
  );
}
