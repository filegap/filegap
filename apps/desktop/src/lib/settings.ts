import { useCallback, useEffect, useState } from 'react';

const SETTINGS_STORAGE_KEY = 'filegap.desktop.settings.v1';
const SETTINGS_EVENT_NAME = 'filegap:settings-changed';

export type OverwriteBehavior = 'ask' | 'auto-rename' | 'replace';

export type DesktopSettings = {
  defaultOutputDirectory: string | null;
  askDestinationEveryTime: boolean;
  mergeFilenameTemplate: string;
  splitFilenameTemplate: string;
  extractFilenameTemplate: string;
  reorderFilenameTemplate: string;
  overwriteBehavior: OverwriteBehavior;
  openFileAfterExport: boolean;
  revealInFolderAfterExport: boolean;
};

const DEFAULT_SETTINGS: DesktopSettings = {
  defaultOutputDirectory: null,
  askDestinationEveryTime: false,
  mergeFilenameTemplate: 'merged-{n}-files-{date}.pdf',
  splitFilenameTemplate: 'split-{date}',
  extractFilenameTemplate: 'extracted-pages-{date}.pdf',
  reorderFilenameTemplate: 'reordered-{date}.pdf',
  overwriteBehavior: 'ask',
  openFileAfterExport: false,
  revealInFolderAfterExport: true,
};

function normalizeTemplate(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function readSettings(): DesktopSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<DesktopSettings>;
    const defaultOutputDirectory =
      typeof parsed.defaultOutputDirectory === 'string' && parsed.defaultOutputDirectory.trim().length > 0
        ? parsed.defaultOutputDirectory.trim()
        : null;

    const overwriteBehavior: OverwriteBehavior =
      parsed.overwriteBehavior === 'auto-rename' || parsed.overwriteBehavior === 'replace' ? parsed.overwriteBehavior : 'ask';

    return {
      defaultOutputDirectory,
      askDestinationEveryTime: parsed.askDestinationEveryTime === true,
      mergeFilenameTemplate: normalizeTemplate(parsed.mergeFilenameTemplate, DEFAULT_SETTINGS.mergeFilenameTemplate),
      splitFilenameTemplate: normalizeTemplate(parsed.splitFilenameTemplate, DEFAULT_SETTINGS.splitFilenameTemplate),
      extractFilenameTemplate: normalizeTemplate(parsed.extractFilenameTemplate, DEFAULT_SETTINGS.extractFilenameTemplate),
      reorderFilenameTemplate: normalizeTemplate(parsed.reorderFilenameTemplate, DEFAULT_SETTINGS.reorderFilenameTemplate),
      overwriteBehavior,
      openFileAfterExport: parsed.openFileAfterExport === true,
      revealInFolderAfterExport:
        parsed.revealInFolderAfterExport === false ? false : DEFAULT_SETTINGS.revealInFolderAfterExport,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(next: DesktopSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore write failures and keep in-memory behavior.
  }
}

function notifySettingsChanged(): void {
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT_NAME));
}

export function getDesktopSettings(): DesktopSettings {
  return readSettings();
}

export function getDefaultOutputDirectorySetting(): string | null {
  return readSettings().defaultOutputDirectory;
}

export function setDesktopSettings(next: DesktopSettings): void {
  writeSettings(next);
  notifySettingsChanged();
}

export function setDefaultOutputDirectorySetting(value: string | null): DesktopSettings {
  const normalized = (value ?? '').trim();
  return updateDesktopSettings({
    defaultOutputDirectory: normalized.length > 0 ? normalized : null,
  });
}

export function updateDesktopSettings(patch: Partial<DesktopSettings>): DesktopSettings {
  const merged = {
    ...readSettings(),
    ...patch,
  };
  setDesktopSettings(merged);
  return merged;
}

export function useDesktopSettings(): [DesktopSettings, (patch: Partial<DesktopSettings>) => void] {
  const [settings, setSettings] = useState<DesktopSettings>(() => getDesktopSettings());

  useEffect(() => {
    const refresh = () => {
      setSettings(getDesktopSettings());
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

  const update = useCallback((patch: Partial<DesktopSettings>) => {
    const next = updateDesktopSettings(patch);
    setSettings(next);
  }, []);

  return [settings, update];
}

export function useDefaultOutputDirectorySetting(): string | null {
  const [settings] = useDesktopSettings();
  return settings.defaultOutputDirectory;
}
