export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const PREFIX = 'Filegap';

function nowIso(): string {
  return new Date().toISOString();
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  const label = `[${PREFIX}][${level.toUpperCase()}][${nowIso()}]`;
  const payload = context && Object.keys(context).length > 0 ? context : undefined;

  if (level === 'debug') {
    // Debug logs can include technical execution details.
    console.log(label, message, payload ?? '');
    return;
  }

  if (level === 'info') {
    // Info logs should be understandable for end users.
    console.info(label, message, payload ?? '');
    return;
  }

  if (level === 'warn') {
    // Warn logs should suggest user-actionable recovery hints.
    console.warn(label, message, payload ?? '');
    return;
  }

  // Error logs can carry technical detail but should remain privacy-safe.
  console.error(label, message, payload ?? '');
}

export function logDebug(message: string, context?: LogContext): void {
  write('debug', message, context);
}

export function logInfo(message: string, context?: LogContext): void {
  write('info', message, context);
}

export function logWarn(message: string, context?: LogContext): void {
  write('warn', message, context);
}

export function logError(message: string, context?: LogContext): void {
  write('error', message, context);
}
