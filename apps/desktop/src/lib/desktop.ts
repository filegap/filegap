import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

export type MergeResult = {
  output_path: string;
  input_count: number;
};

export async function choosePdfInputs(): Promise<string[]> {
  const selection = await open({
    multiple: true,
    directory: false,
    title: 'Select PDF files',
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });

  if (!selection) {
    return [];
  }

  if (typeof selection === 'string') {
    return [selection];
  }

  return selection.filter((path): path is string => typeof path === 'string');
}

export async function chooseOutputPdf(defaultName = 'merged.pdf'): Promise<string | null> {
  const output = await save({
    title: 'Save merged PDF',
    defaultPath: defaultName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });

  return typeof output === 'string' ? output : null;
}

export async function mergePdfs(inputPaths: string[], outputPath: string): Promise<MergeResult> {
  return invoke<MergeResult>('merge_pdfs', {
    inputPaths,
    outputPath,
  });
}
