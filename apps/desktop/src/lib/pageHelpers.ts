export type PathParts = {
  dir: string;
  name: string;
  sep: '/' | '\\';
};

export function readErrorMessage(error: unknown, fallbackMessage = 'Unknown error.'): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    if (message.trim().length > 0) {
      return message;
    }
  }
  return fallbackMessage;
}

export function parsePath(filePath: string): PathParts {
  const sep: '/' | '\\' = filePath.includes('\\') ? '\\' : '/';
  const index = filePath.lastIndexOf(sep);
  if (index < 0) {
    return { dir: '', name: filePath, sep };
  }
  return {
    dir: filePath.slice(0, index),
    name: filePath.slice(index + 1),
    sep,
  };
}

export function joinPath(dir: string, name: string, sep: '/' | '\\'): string {
  if (!dir) {
    return name;
  }
  return `${dir}${sep}${name}`;
}

export function formatKilobytes(sizeBytes: number): string {
  if (sizeBytes <= 0) {
    return '-';
  }
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

export function quoteCliArg(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
