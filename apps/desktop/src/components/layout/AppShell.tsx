import type { PropsWithChildren } from 'react';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

type AppShellProps = PropsWithChildren<{
  showHeader?: boolean;
}>;

export function AppShell({ children, showHeader = true }: AppShellProps) {
  return (
    <div className="app-shell">
      {showHeader ? <AppHeader /> : null}
      <main className="app-main">{children}</main>
      <AppFooter />
    </div>
  );
}
