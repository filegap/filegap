import { useEffect, useState } from 'react';
import { FolderCog, Folders, ShieldCheck, X } from 'lucide-react';
import { chooseOutputDirectory } from '../../lib/desktop';
import { setDefaultOutputDirectorySetting, useDefaultOutputDirectorySetting } from '../../lib/settings';
import { fileNameFromPath } from '../../lib/pathUtils';
import { Button } from './Button';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const defaultOutputDirectory = useDefaultOutputDirectorySetting();
  const [isChoosingFolder, setIsChoosingFolder] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const folderLabel = defaultOutputDirectory ? fileNameFromPath(defaultOutputDirectory) : 'Downloads (system default)';

  async function handleChooseFolder() {
    setIsChoosingFolder(true);
    try {
      const selected = await chooseOutputDirectory('Choose default folder');
      if (!selected) {
        return;
      }
      setDefaultOutputDirectorySetting(selected);
    } finally {
      setIsChoosingFolder(false);
    }
  }

  function handleUseDownloads() {
    setDefaultOutputDirectorySetting(null);
  }

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <aside className="settings-nav">
          <div className="settings-nav-head">
            <p>Options</p>
            <button type="button" className="icon-button settings-modal-close" aria-label="Close settings" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Settings sections" className="settings-nav-list">
            <button type="button" className="settings-nav-item settings-nav-item-active" aria-current="page">
              <FolderCog aria-hidden="true" />
              <span>Output</span>
            </button>
            <button type="button" className="settings-nav-item" disabled>
              <ShieldCheck aria-hidden="true" />
              <span>Privacy (soon)</span>
            </button>
          </nav>
        </aside>

        <div className="settings-main">
          <header className="settings-main-header">
            <h2 id="settings-modal-title">Settings</h2>
          </header>

          <div className="settings-modal-body">
            <section className="settings-group">
              <div className="settings-row">
                <div className="settings-row-copy">
                  <h3>Default output folder</h3>
                  <p className="settings-help">Used as initial export destination for Merge, Split, Extract, and Reorder.</p>
                  {defaultOutputDirectory ? <p className="settings-value-path">{defaultOutputDirectory}</p> : null}
                </div>
                <div className="settings-row-control">
                  <Button
                    variant="secondary"
                    className="settings-select-btn"
                    onClick={() => void handleChooseFolder()}
                    loading={isChoosingFolder}
                    loadingLabel="Opening..."
                  >
                    <Folders aria-hidden="true" />
                    <span title={defaultOutputDirectory ?? folderLabel}>{folderLabel}</span>
                  </Button>
                </div>
              </div>
              <div className="settings-row settings-row-compact">
                <div className="settings-row-copy">
                  <h3>Fallback behavior</h3>
                  <p className="settings-help">Reset to use your system Downloads folder as default destination.</p>
                </div>
                <div className="settings-row-control">
                  <Button variant="ghost" onClick={handleUseDownloads} disabled={!defaultOutputDirectory}>
                    Use Downloads
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
