import { useEffect, useState } from 'react';

const SETTINGS_STORAGE_KEY = 'filegap.desktop.settings.v1';
const SETTINGS_EVENT_NAME = 'filegap:settings-changed';

type DesktopSettings = {
  defaultOutputDirectory: string | null;
};

function readSettings(): DesktopSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { defaultOutputDirectory: null };
    }

    const parsed = JSON.parse(raw) as Partial<DesktopSettings>;
    const value = typeof parsed.defaultOutputDirectory === 'string' ? parsed.defaultOutputDirectory.trim() : '';
    return {
      defaultOutputDirectory: value.length > 0 ? value : null,
    };
  } catch {
    return { defaultOutputDirectory: null };
  }
}

function writeSettings(next: DesktopSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore write failures and keep in-memory UI behavior.
  }
}

function notifySettingsChanged(): void {
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT_NAME));
}

export function getDefaultOutputDirectorySetting(): string | null {
  return readSettings().defaultOutputDirectory;
}

export function setDefaultOutputDirectorySetting(value: string | null): void {
  const normalized = (value ?? '').trim();
  writeSettings({
    defaultOutputDirectory: normalized.length > 0 ? normalized : null,
  });
  notifySettingsChanged();
}

export function useDefaultOutputDirectorySetting(): string | null {
  const [value, setValue] = useState<string | null>(() => getDefaultOutputDirectorySetting());

  useEffect(() => {
    const refresh = () => {
      setValue(getDefaultOutputDirectorySetting());
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SETTINGS_STORAGE_KEY) {
        return;
      }
      refresh();
    };

    window.addEventListener(SETTINGS_EVENT_NAME, refresh as EventListener);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener(SETTINGS_EVENT_NAME, refresh as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return value;
}
