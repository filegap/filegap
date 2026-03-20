import type { ReactNode } from 'react';
import { AppShell } from './AppShell';
import { PageContainer } from './PageContainer';

type ToolLayoutProps = {
  title: string;
  subtitle: string;
  leftPanel: ReactNode;
  rightPanel: ReactNode;
};

export function ToolLayout({ title, subtitle, leftPanel, rightPanel }: ToolLayoutProps) {
  return (
    <AppShell>
      <PageContainer>
        <header className="tool-page-header">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>

        <section className="tool-split-layout">
          <section className="tool-left-panel">{leftPanel}</section>
          <aside className="tool-right-panel">{rightPanel}</aside>
        </section>
      </PageContainer>
    </AppShell>
  );
}
