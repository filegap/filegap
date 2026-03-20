import type { PropsWithChildren } from 'react';
import { AppShell } from './AppShell';
import { PageContainer } from './PageContainer';

type ToolLayoutProps = PropsWithChildren<{
  title: string;
  description: string;
  trustLine?: string;
}>;

export function ToolLayout({ title, description, trustLine, children }: ToolLayoutProps) {
  return (
    <AppShell>
      <PageContainer>
        <header className="tool-hero">
          <h1>{title}</h1>
          <p>{description}</p>
          {trustLine ? <p className="tool-hero-trust">{trustLine}</p> : null}
        </header>
        <section className="tool-section">{children}</section>
      </PageContainer>
    </AppShell>
  );
}
