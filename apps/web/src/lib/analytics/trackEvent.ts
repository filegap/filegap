// ⚠️ Privacy-first rule:
// Track only high-level anonymous events.
// Allowed payload fields: `tool` and non-identifying numeric metadata.
// Never send user identifiers, file names, file content, or free-form user input.

declare global {
  interface Window {
    sa_event?: (name: string, payload?: Record<string, string | number>) => void;
  }
}

export type ToolName = 'merge' | 'split' | 'extract' | 'reorder' | 'optimize' | 'compress';
type ToolEventAction = 'started' | 'completed' | 'selection_made';

const ALLOWED_EVENTS = new Set([
  'merge_started',
  'split_started',
  'extract_started',
  'reorder_started',
  'optimize_started',
  'compress_started',
  'merge_completed',
  'split_completed',
  'extract_completed',
  'reorder_completed',
  'optimize_completed',
  'compress_completed',
  'selection_made',
  'download_cli_clicked',
  'download_app_clicked',
  'support_lynko_click',
  'support_click',
]);

function sanitizeNumericMetadata(
  metadata?: Record<string, number>
): Record<string, number> | undefined {
  if (!metadata) {
    return undefined;
  }

  const safeEntries = Object.entries(metadata).filter((entry) => {
    const value = entry[1];
    return Number.isFinite(value);
  });

  if (safeEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(safeEntries);
}

export function trackEvent(
  name: string,
  payload?: { tool?: ToolName } & Record<string, number | ToolName | undefined>
): void {
  if (!ALLOWED_EVENTS.has(name)) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.sa_event === 'function') {
    if (!payload) {
      window.sa_event(name);
      return;
    }

    const safePayload: Record<string, string | number> = {};
    if (payload.tool) {
      safePayload.tool = payload.tool;
    }

    const metadata = sanitizeNumericMetadata(
      Object.fromEntries(
        Object.entries(payload)
          .filter((entry) => entry[0] !== 'tool')
          .map((entry) => [entry[0], Number(entry[1])])
      )
    );

    if (metadata) {
      Object.assign(safePayload, metadata);
    }

    if (Object.keys(safePayload).length === 0) {
      window.sa_event(name);
      return;
    }

    window.sa_event(name, safePayload);
  }
}

export function trackToolEvent(
  action: ToolEventAction,
  tool: ToolName,
  metadata?: Record<string, number>
): void {
  const eventName = action === 'selection_made' ? 'selection_made' : `${tool}_${action}`;
  trackEvent(eventName, {
    tool,
    ...(metadata ?? {}),
  });
}
