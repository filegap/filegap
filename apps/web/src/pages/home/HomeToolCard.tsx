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
      className='rounded-xl border border-ui-border bg-ui-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition duration-200 hover:-translate-y-0.5 hover:border-brand-primary/70 hover:bg-brand-primary/10 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2'
    >
      <div className='flex items-start gap-4'>
        <div className='inline-flex h-12 w-12 shrink-0 items-center justify-center text-brand-primary [&>svg]:h-8 [&>svg]:w-8'>
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
