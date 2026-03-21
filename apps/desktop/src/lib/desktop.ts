import { invoke } from '@tauri-apps/api/core';
import { downloadDir } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';

export type MergeResult = {
  output_path: string;
  input_count: number;
};

export type SplitResult = {
  output_dir: string;
  output_count: number;
  first_output_path: string;
};

export type ExtractResult = {
  output_path: string;
};

export type ReorderResult = {
  output_path: string;
};

export type PdfFileInfo = {
  path: string;
  size_bytes: number;
  page_count: number | null;
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

export async function chooseSinglePdfInput(): Promise<string | null> {
  const selection = await open({
    multiple: false,
    directory: false,
    title: 'Select PDF file',
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });

  return typeof selection === 'string' ? selection : null;
}

export async function chooseOutputDirectory(): Promise<string | null> {
  const output = await open({
    title: 'Choose destination folder',
    directory: true,
    multiple: false,
  });

  return typeof output === 'string' ? output : null;
}

export async function getDownloadDirectory(): Promise<string | null> {
  try {
    return await downloadDir();
  } catch {
    return null;
  }
}

export async function mergePdfs(inputPaths: string[], outputPath: string): Promise<MergeResult> {
  return invoke<MergeResult>('merge_pdfs', {
    inputPaths,
    outputPath,
  });
}

export async function splitPdf(
  inputPath: string,
  outputDir: string,
  outputBaseName: string,
  pagesPerFile: number,
  pageRanges?: string
): Promise<SplitResult> {
  return invoke<SplitResult>('split_pdf', {
    inputPath,
    outputDir,
    outputBaseName,
    pagesPerFile,
    pageRanges: pageRanges?.trim() || null,
  });
}

export async function extractPages(inputPath: string, outputPath: string, pageRanges: string): Promise<ExtractResult> {
  return invoke<ExtractResult>('extract_pages', {
    inputPath,
    outputPath,
    pageRanges,
  });
}

export async function reorderPdf(inputPath: string, outputPath: string, pageOrder: number[]): Promise<ReorderResult> {
  return invoke<ReorderResult>('reorder_pdf', {
    inputPath,
    outputPath,
    pageOrder,
  });
}

export async function inspectPdfFiles(paths: string[]): Promise<PdfFileInfo[]> {
  return invoke<PdfFileInfo[]>('inspect_pdf_files', { paths });
}

export async function readPdfBytes(path: string): Promise<Uint8Array> {
  const bytes = await invoke<number[]>('read_pdf_bytes', { path });
  return new Uint8Array(bytes);
}

export async function openFile(path: string): Promise<void> {
  await invoke('open_file', { path });
}

export async function revealInFolder(path: string): Promise<void> {
  await invoke('show_in_folder', { path });
}
