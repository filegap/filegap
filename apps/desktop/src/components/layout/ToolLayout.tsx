import type { ReactNode } from 'react';
import { AppShell } from './AppShell';
import { PageContainer } from './PageContainer';

type ToolLayoutProps = {
  title: string;
  subtitle: string;
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  footerMessage?: string;
};

export function ToolLayout({ title, subtitle, leftPanel, rightPanel, footerMessage }: ToolLayoutProps) {
  return (
    <AppShell footerMessage={footerMessage}>
      <PageContainer className="page-container-tool">
        <section className="tool-split-layout">
          <section className="tool-left-panel">
            <header className="tool-page-header">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </header>
            {leftPanel}
          </section>
          <aside className="tool-right-panel">{rightPanel}</aside>
        </section>
      </PageContainer>
    </AppShell>
  );
}
