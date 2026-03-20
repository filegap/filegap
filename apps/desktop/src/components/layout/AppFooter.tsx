import { Settings } from 'lucide-react';

type AppFooterProps = {
  message?: string;
};

export function AppFooter({ message = 'Ready' }: AppFooterProps) {
  return (
    <footer className="app-footer">
      <div className="footer-row">
        <button type="button" className="icon-button footer-settings" aria-label="Settings">
          <Settings aria-hidden="true" />
        </button>
        <p className="status-ready">{message}</p>
      </div>
    </footer>
  );
}
