import { useEffect, useState } from 'react';
import { getName, getVersion } from '@tauri-apps/api/app';
import { ChevronsUpDown, Folders, X } from 'lucide-react';
import { chooseOutputDirectory, openExternalUrl } from '../../lib/desktop';
import { getDistributionConfig } from '../../lib/distribution';
import { useDesktopSettings } from '../../lib/settings';
import { fileNameFromPath } from '../../lib/pathUtils';
import { Button } from './Button';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const WEBSITE_URL = 'https://filegap.app';
const PRIVACY_URL = 'https://filegap.app/privacy';
const RELEASE_NOTES_URL = 'https://github.com/filegap/filegap/releases';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, updateSettings] = useDesktopSettings();
  const [isChoosingFolder, setIsChoosingFolder] = useState(false);
  const [appName, setAppName] = useState('Filegap Desktop');
  const [appVersion, setAppVersion] = useState('unknown');
  const distributionConfig = getDistributionConfig();
  const channelLabel =
    distributionConfig.channel === 'store'
      ? 'Store'
      : distributionConfig.channel === 'github'
        ? 'GitHub'
        : distributionConfig.channel === 'homebrew'
          ? 'Homebrew'
          : 'Development';

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    async function loadAppMetadata() {
      try {
        const [name, version] = await Promise.all([getName(), getVersion()]);
        if (!isMounted) {
          return;
        }
        setAppName(name);
        setAppVersion(version);
      } catch {
        // Keep fallback metadata if Tauri app APIs are unavailable.
      }
    }

    void loadAppMetadata();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const folderLabel = settings.defaultOutputDirectory
    ? fileNameFromPath(settings.defaultOutputDirectory)
    : 'Downloads (system default)';

  async function handleChooseFolder() {
    setIsChoosingFolder(true);
    try {
      const selected = await chooseOutputDirectory('Choose default folder');
      if (!selected) {
        return;
      }
      updateSettings({ defaultOutputDirectory: selected });
    } finally {
      setIsChoosingFolder(false);
    }
  }

  function handleUseDownloads() {
    updateSettings({ defaultOutputDirectory: null });
  }

  function toggleSetting(key: 'askDestinationEveryTime' | 'openFileAfterExport' | 'revealInFolderAfterExport') {
    updateSettings({ [key]: !settings[key] });
  }

  async function handleOpenSupport() {
    await openExternalUrl(distributionConfig.supportUrl);
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
        <div className="settings-main">
          <header className="settings-main-header">
            <h2 id="settings-modal-title">Settings</h2>
            <button type="button" className="icon-button settings-modal-close" aria-label="Close settings" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </header>

          <div className="settings-modal-body">
            <section className="settings-section-block">
              <h3 className="settings-section-title">Output</h3>
              <div className="settings-group">
                <div className="settings-row">
                  <div className="settings-row-copy">
                    <h3>Default output folder</h3>
                    <p className="settings-help">Used as initial export destination for Merge, Split, Extract, and Reorder.</p>
                    {settings.defaultOutputDirectory ? <p className="settings-value-path">{settings.defaultOutputDirectory}</p> : null}
                  </div>
                  <div className="settings-row-control">
                  <Button
                    variant="secondary"
                    className="settings-select-btn"
                    onClick={() => void handleChooseFolder()}
                    loading={isChoosingFolder}
                    loadingLabel="Opening..."
                  >
                    <span className="settings-select-btn-main">
                      <Folders aria-hidden="true" />
                      <span className="settings-select-btn-text" title={settings.defaultOutputDirectory ?? folderLabel}>
                        {folderLabel}
                      </span>
                    </span>
                    <ChevronsUpDown className="settings-select-btn-caret" aria-hidden="true" />
                  </Button>
                </div>
              </div>
                <div className="settings-row settings-row-compact">
                  <div className="settings-row-copy">
                    <h3>Ask destination every time</h3>
                    <p className="settings-help">If enabled, each operation asks destination folder and ignores the default folder.</p>
                  </div>
                  <div className="settings-row-control">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.askDestinationEveryTime}
                      className={`settings-switch ${settings.askDestinationEveryTime ? 'settings-switch-on' : ''}`.trim()}
                      onClick={() => toggleSetting('askDestinationEveryTime')}
                    >
                      <span className="settings-switch-thumb" />
                    </button>
                  </div>
                </div>
                <div className="settings-row settings-row-compact">
                  <div className="settings-row-copy">
                    <h3>Fallback behavior</h3>
                    <p className="settings-help">Reset to use your system Downloads folder as default destination.</p>
                  </div>
                <div className="settings-row-control">
                  <Button
                    variant="ghost"
                    className="settings-use-downloads-btn"
                    onClick={handleUseDownloads}
                    disabled={!settings.defaultOutputDirectory}
                  >
                    Use Downloads
                  </Button>
                </div>
              </div>
              </div>
            </section>

            <div className="settings-section-divider" />

            <section className="settings-section-block">
              <h3 className="settings-section-title">Naming</h3>
              <div className="settings-group">
                <div className="settings-row">
                  <div className="settings-row-copy">
                    <h3>Filename templates</h3>
                    <p className="settings-help">Supported variables: {'{date}'}, {'{n}'}.</p>
                  </div>
                  <div className="settings-row-control settings-row-control-stack">
                    <label className="settings-template-row">
                      <span>Merge</span>
                      <input
                        className="settings-input"
                        value={settings.mergeFilenameTemplate}
                        onChange={(event) => updateSettings({ mergeFilenameTemplate: event.target.value })}
                      />
                    </label>
                    <label className="settings-template-row">
                      <span>Split</span>
                      <input
                        className="settings-input"
                        value={settings.splitFilenameTemplate}
                        onChange={(event) => updateSettings({ splitFilenameTemplate: event.target.value })}
                      />
                    </label>
                    <label className="settings-template-row">
                      <span>Extract</span>
                      <input
                        className="settings-input"
                        value={settings.extractFilenameTemplate}
                        onChange={(event) => updateSettings({ extractFilenameTemplate: event.target.value })}
                      />
                    </label>
                    <label className="settings-template-row">
                      <span>Reorder</span>
                      <input
                        className="settings-input"
                        value={settings.reorderFilenameTemplate}
                        onChange={(event) => updateSettings({ reorderFilenameTemplate: event.target.value })}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <div className="settings-section-divider" />

            <section className="settings-section-block">
              <h3 className="settings-section-title">File behavior</h3>
              <div className="settings-group">
                <div className="settings-row">
                  <div className="settings-row-copy">
                    <h3>Overwrite behavior</h3>
                    <p className="settings-help">Choose how to handle existing files with the same output name.</p>
                  </div>
                  <div className="settings-row-control">
                    <select
                      className="settings-select"
                      value={settings.overwriteBehavior}
                      onChange={(event) =>
                        updateSettings({
                          overwriteBehavior: event.target.value as 'ask' | 'auto-rename' | 'replace',
                        })
                      }
                    >
                      <option value="ask">Ask</option>
                      <option value="auto-rename">Auto-rename</option>
                      <option value="replace">Replace</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <div className="settings-section-divider" />

            <section className="settings-section-block">
              <h3 className="settings-section-title">Privacy &amp; Post-export</h3>
              <div className="settings-group">
                <div className="settings-row settings-row-compact">
                  <div className="settings-row-copy">
                    <h3>Open file after export</h3>
                    <p className="settings-help">Open generated output automatically when processing completes.</p>
                  </div>
                  <div className="settings-row-control">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.openFileAfterExport}
                      className={`settings-switch ${settings.openFileAfterExport ? 'settings-switch-on' : ''}`.trim()}
                      onClick={() => toggleSetting('openFileAfterExport')}
                    >
                      <span className="settings-switch-thumb" />
                    </button>
                  </div>
                </div>
                <div className="settings-row settings-row-compact">
                  <div className="settings-row-copy">
                    <h3>Reveal in folder after export</h3>
                    <p className="settings-help">Reveal generated file in its folder automatically after completion.</p>
                  </div>
                  <div className="settings-row-control">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.revealInFolderAfterExport}
                      className={`settings-switch ${settings.revealInFolderAfterExport ? 'settings-switch-on' : ''}`.trim()}
                      onClick={() => toggleSetting('revealInFolderAfterExport')}
                    >
                      <span className="settings-switch-thumb" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div className="settings-section-divider" />
            <section className="settings-section-block">
              <h3 className="settings-section-title">About</h3>
              <div className="settings-group">
                <div className="settings-row">
                  <div className="settings-row-copy">
                    <h3>
                      {appName} v{appVersion}
                    </h3>
                    <p className="settings-help">Distribution channel: {channelLabel}</p>
                    <p className="settings-help">App updates may require network access depending on distribution channel.</p>
                  </div>
                  <div className="settings-row-control settings-row-control-stack">
                    <Button variant="ghost" className="settings-about-link-btn" onClick={() => void openExternalUrl(WEBSITE_URL)}>
                      Website
                    </Button>
                    <Button variant="ghost" className="settings-about-link-btn" onClick={() => void openExternalUrl(PRIVACY_URL)}>
                      Privacy
                    </Button>
                    <Button
                      variant="ghost"
                      className="settings-about-link-btn"
                      onClick={() => void openExternalUrl(RELEASE_NOTES_URL)}
                    >
                      Release notes
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {distributionConfig.showSupportCta ? (
              <>
                <div className="settings-section-divider" />
                <section className="settings-section-block">
                  <h3 className="settings-section-title">Support</h3>
                  <div className="settings-group">
                    <div className="settings-row">
                      <div className="settings-row-copy">
                        <h3>Support Filegap</h3>
                        <p className="settings-help">
                          Filegap is open source and privacy-first. If it saves you time, support development.
                        </p>
                      </div>
                      <div className="settings-row-control">
                        <Button variant="secondary" className="settings-support-btn" onClick={() => void handleOpenSupport()}>
                          <span className="settings-support-emoji" aria-hidden="true">
                            {'☕'}
                          </span>
                          <span>Buy me a coffee</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
