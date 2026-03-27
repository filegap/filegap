import type { PropsWithChildren } from 'react';

type SidebarSectionProps = PropsWithChildren<{
  title: string;
  className?: string;
}>;

export function SidebarSection({ title, className, children }: SidebarSectionProps) {
  return (
    <section className={['output-panel-section', className ?? ''].filter(Boolean).join(' ')}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
