import type { OverwriteBehavior } from './settings';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDate(now: Date): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function renderFilenameTemplate(
  template: string,
  vars?: {
    n?: number;
    date?: Date;
  }
): string {
  const now = vars?.date ?? new Date();
  const n = typeof vars?.n === 'number' && Number.isFinite(vars.n) ? String(Math.max(0, Math.floor(vars.n))) : '1';

  const rendered = template
    .replace(/\{date\}/g, formatDate(now))
    .replace(/\{n\}/g, n)
    .trim();

  return rendered.length > 0 ? rendered : template;
}

function splitBaseAndExt(fileName: string): { base: string; ext: string } {
  const clean = fileName.trim();
  const index = clean.lastIndexOf('.');
  if (index <= 0 || index === clean.length - 1) {
    return { base: clean, ext: '' };
  }
  return {
    base: clean.slice(0, index),
    ext: clean.slice(index),
  };
}

export async function resolveOutputPathByOverwrite(
  candidatePath: string,
  overwriteBehavior: OverwriteBehavior,
  pathExists: (path: string) => Promise<boolean>,
  askConfirmation: (message: string) => Promise<boolean>
): Promise<string | null> {
  const exists = await pathExists(candidatePath);
  if (!exists) {
    return candidatePath;
  }

  if (overwriteBehavior === 'replace') {
    return candidatePath;
  }

  if (overwriteBehavior === 'ask') {
    const allowed = await askConfirmation('A file with this name already exists. Do you want to replace it?');
    return allowed ? candidatePath : null;
  }

  const normalized = candidatePath.replace(/\\/g, '/');
  const slashIndex = normalized.lastIndexOf('/');
  const dir = slashIndex >= 0 ? candidatePath.slice(0, slashIndex + 1) : '';
  const name = slashIndex >= 0 ? candidatePath.slice(slashIndex + 1) : candidatePath;
  const { base, ext } = splitBaseAndExt(name);

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const nextCandidate = `${dir}${base}-${suffix}${ext}`;
    // eslint-disable-next-line no-await-in-loop
    const taken = await pathExists(nextCandidate);
    if (!taken) {
      return nextCandidate;
    }
  }

  return null;
}
