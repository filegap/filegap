export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = 'Filegap';

// ⚠️ Do not log user file data. This project is privacy-first.
// Keep logs generic and never include filenames, sizes, page counts, file content, or user input.
function nowIso(): string {
  return new Date().toISOString();
}

function write(level: LogLevel, message: string): void {
  const label = `[${PREFIX}][${level.toUpperCase()}][${nowIso()}]`;

  if (level === 'debug') {
    console.log(label, message);
    return;
  }

  if (level === 'info') {
    console.info(label, message);
    return;
  }

  if (level === 'warn') {
    console.warn(label, message);
    return;
  }

  console.error(label, message);
}

export function logDebug(message: string): void {
  write('debug', message);
}

export function logInfo(message: string): void {
  write('info', message);
}

export function logWarn(message: string): void {
  write('warn', message);
}

export function logError(message: string): void {
  write('error', message);
}
