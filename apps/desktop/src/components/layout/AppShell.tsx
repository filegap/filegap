import type { PropsWithChildren } from 'react';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

type AppShellProps = PropsWithChildren<{
  showHeader?: boolean;
  footerMessage?: string;
}>;

export function AppShell({ children, showHeader = true, footerMessage }: AppShellProps) {
  return (
    <div className="app-shell">
      {showHeader ? <AppHeader /> : null}
      <main className="app-main">{children}</main>
      <AppFooter message={footerMessage} />
    </div>
  );
}
