export function fileNameFromPath(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1] || path;
}

export function outputDefaultName(filePaths: string[]): string {
  if (filePaths.length === 0) {
    return 'merged.pdf';
  }
  if (filePaths.length === 1) {
    return fileNameFromPath(filePaths[0]);
  }
  return 'merged.pdf';
}
