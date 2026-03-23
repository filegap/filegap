import { Settings } from 'lucide-react';

type AppFooterProps = {
  message?: string;
  onOpenSettings?: () => void;
};

export function AppFooter({ message = 'Ready', onOpenSettings }: AppFooterProps) {
  return (
    <footer className="app-footer">
      <div className="footer-row">
        <button
          type="button"
          className="icon-button footer-settings"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <Settings aria-hidden="true" />
        </button>
        <p className="status-ready">{message}</p>
      </div>
    </footer>
  );
}
