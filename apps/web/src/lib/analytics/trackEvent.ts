// ⚠️ Privacy-first rule:
// Track only high-level anonymous events with event name only.
// Never send file names, file sizes, page counts, file content, or user input.

declare global {
  interface Window {
    sa_event?: (name: string) => void;
  }
}

const ALLOWED_EVENTS = new Set([
  'merge_opened',
  'split_opened',
  'extract_opened',
  'reorder_opened',
  'download_cli_clicked',
  'download_app_clicked',
]);

export function trackEvent(name: string): void {
  if (!ALLOWED_EVENTS.has(name)) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.sa_event === 'function') {
    window.sa_event(name);
  }
}

