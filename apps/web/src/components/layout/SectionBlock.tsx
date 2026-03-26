import type { PropsWithChildren, ReactNode } from 'react';

import { Card } from '../ui/Card';

type SectionBlockProps = PropsWithChildren<{
  title: string;
  intro?: ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
}>;

export function SectionBlock({
  title,
  intro,
  children,
  className,
  contentClassName,
  titleClassName,
}: SectionBlockProps) {
  return (
    <section className={['space-y-4', className].filter(Boolean).join(' ')}>
      <div className='space-y-2'>
        <h2
          className={['font-heading text-2xl font-semibold text-ui-text', titleClassName]
            .filter(Boolean)
            .join(' ')}
        >
          {title}
        </h2>
        {intro ? <div className='max-w-3xl text-sm leading-relaxed text-ui-muted'>{intro}</div> : null}
      </div>
      <Card className={contentClassName}>
        {children}
      </Card>
    </section>
  );
}
