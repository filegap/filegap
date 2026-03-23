import { type PropsWithChildren, useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { SettingsModal } from '../ui/SettingsModal';

type AppShellProps = PropsWithChildren<{
  showHeader?: boolean;
  footerMessage?: string;
}>;

export function AppShell({ children, showHeader = true, footerMessage }: AppShellProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="app-shell">
      {showHeader ? <AppHeader /> : null}
      <main className="app-main">{children}</main>
      <AppFooter message={footerMessage} onOpenSettings={() => setIsSettingsOpen(true)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
