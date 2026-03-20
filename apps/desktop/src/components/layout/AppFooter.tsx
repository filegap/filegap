import { Settings } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-row">
        <button type="button" className="icon-button footer-settings" aria-label="Settings">
          <Settings aria-hidden="true" />
        </button>
        <p className="status-ready">Ready</p>
      </div>
    </footer>
  );
}
