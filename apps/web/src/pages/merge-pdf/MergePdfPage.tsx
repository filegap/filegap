import { useEffect, useMemo, useState } from 'react';

import { PDFDocument } from 'pdf-lib';

import { Card } from '../../components/ui/Card';
import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { logDebug, logError, logInfo, logWarn } from '../../lib/logging/logger';
import { mergePdfBuffers } from '../../adapters/pdfEngine';
import type { WorkerResponse } from '../../types';

type StatusTone = 'neutral' | 'info' | 'error';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type MergeQueueFile = {
  id: string;
  file: File;
  pageCount: number | null;
  pageCountStatus: 'loading' | 'ready' | 'error';
};

function saveBlob(filename: string, bytes: Uint8Array): void {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }

  // jsdom can miss File#arrayBuffer; fallback via Response for tests.
  return new Response(file).arrayBuffer();
}

async function extractPageCount(file: File): Promise<number | null> {
  try {
    const bytes = await fileToArrayBuffer(file);
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  } catch {
    return null;
  }
}

function createQueueFile(file: File): MergeQueueFile {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
    file,
    pageCount: null,
    pageCountStatus: 'loading',
  };
}

function getIdleOrReadyStatus(fileCount: number): StatusState {
  if (fileCount === 0) {
    return { tone: 'neutral', message: 'Add PDF files to start.' };
  }
  if (fileCount < 2) {
    return { tone: 'info', message: 'Add at least 2 PDF files to merge.' };
  }
  return { tone: 'info', message: 'Ready to merge locally.' };
}

function formatFileMeta(file: MergeQueueFile): string {
  const sizeKb = Math.max(1, Math.round(file.file.size / 1024));
  if (file.pageCountStatus === 'loading') {
    return `${sizeKb} KB · Reading pages...`;
  }
  if (file.pageCountStatus === 'error' || file.pageCount === null) {
    return `${sizeKb} KB · Page count unavailable`;
  }
  const pagesLabel = file.pageCount === 1 ? 'page' : 'pages';
  return `${sizeKb} KB · ${file.pageCount} ${pagesLabel}`;
}

export function MergePdfPage() {
  const [files, setFiles] = useState<MergeQueueFile[]>([]);
  const [status, setStatus] = useState<StatusState>(getIdleOrReadyStatus(0));
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedOutput, setMergedOutput] = useState<Uint8Array | null>(null);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const worker = useMemo(
    () => new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' }),
    []
  );

  function handleFilesSelected(nextFiles: File[]): void {
    const queuedFiles = nextFiles.map(createQueueFile);
    if (mergedOutput) {
      setMergedOutput(null);
      setShowDownloadGate(false);
    }

    setFiles((currentFiles) => {
      const mergedFiles = [...currentFiles, ...queuedFiles];
      setStatus(getIdleOrReadyStatus(mergedFiles.length));

      logInfo('PDF files selected.', {
        selectedFiles: nextFiles.length,
        totalInQueue: mergedFiles.length,
      });
      logDebug('File selection technical details.', {
        selectedFiles: nextFiles.length,
        totalBytes: mergedFiles.reduce((sum, file) => sum + file.file.size, 0),
      });

      return mergedFiles;
    });

    queuedFiles.forEach((queuedFile) => {
      void extractPageCount(queuedFile.file).then((pageCount) => {
        setFiles((currentFiles) =>
          currentFiles.map((item) => {
            if (item.id !== queuedFile.id) {
              return item;
            }
            return {
              ...item,
              pageCount,
              pageCountStatus: pageCount === null ? 'error' : 'ready',
            };
          })
        );
      });
    });
  }

  function removeFile(indexToRemove: number): void {
    if (mergedOutput) {
      setMergedOutput(null);
      setShowDownloadGate(false);
    }
    setFiles((currentFiles) => {
      const next = currentFiles.filter((_, index) => index !== indexToRemove);
      setStatus(getIdleOrReadyStatus(next.length));
      logInfo('File removed from merge queue.', { indexToRemove, totalInQueue: next.length });
      return next;
    });
  }

  function moveFile(fromIndex: number, toIndex: number): void {
    if (mergedOutput) {
      setMergedOutput(null);
      setShowDownloadGate(false);
    }
    setFiles((currentFiles) => {
      if (toIndex < 0 || toIndex >= currentFiles.length) {
        return currentFiles;
      }

      const next = [...currentFiles];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      setStatus({ tone: 'info', message: 'File order updated.' });
      logInfo('Merge queue order updated.', { fromIndex, toIndex });
      return next;
    });
  }

  useEffect(() => {
    return () => worker.terminate();
  }, [worker]);

  async function handleMerge(): Promise<void> {
    if (files.length < 2) {
      const invalidStatus = getIdleOrReadyStatus(files.length);
      setStatus(invalidStatus);
      logWarn('At least 2 PDF files are required before merge.', {
        selectedFiles: files.length,
      });
      return;
    }

    setIsProcessing(true);
    setStatus({ tone: 'info', message: 'Processing locally in your browser...' });
    logInfo('Starting local merge in browser.', { selectedFiles: files.length });

    const buffers = await Promise.all(files.map((file) => fileToArrayBuffer(file.file)));
    logDebug('PDF buffers prepared for worker.', {
      selectedFiles: files.length,
      totalBytes: files.reduce((sum, file) => sum + file.file.size, 0),
    });

    const response = await new Promise<WorkerResponse>((resolve) => {
      const timeoutId = setTimeout(() => {
        logError('Worker merge timeout: no response in 15s.', {
          selectedFiles: files.length,
        });
        resolve({
          ok: false,
          error: 'merge timeout: worker did not respond in time',
        });
      }, 15_000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
      };

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        cleanup();
        resolve(event.data);
      };

      worker.onerror = (event: ErrorEvent) => {
        cleanup();
        logError('Worker error during merge.', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
        resolve({
          ok: false,
          error: event.message || 'worker error',
        });
      };

      worker.onmessageerror = () => {
        cleanup();
        logError('Worker message error: payload not deserializable.');
        resolve({
          ok: false,
          error: 'worker message error',
        });
      };

      worker.postMessage({
        type: 'merge',
        payload: { files: buffers },
      });
    });

    if (!response.ok) {
      logWarn('Worker unavailable, falling back to main thread.', {
        reason: response.error,
      });
      try {
        const output = await mergePdfBuffers(buffers);
        setMergedOutput(output);
        setShowDownloadGate(false);
        logInfo('Merge completed using main-thread fallback.', {
          outputFile: 'merged.pdf',
          selectedFiles: files.length,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown merge error';
        setStatus({ tone: 'error', message: `Merge failed: ${reason}` });
        logError('Merge failed in main-thread fallback.', { reason });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (response.type !== 'merge') {
      setStatus({ tone: 'error', message: 'Invalid worker response type for merge.' });
      setIsProcessing(false);
      return;
    }

    setMergedOutput(response.payload.output);
    setShowDownloadGate(false);
    setIsProcessing(false);
    logInfo('Merge completed successfully.', {
      outputFile: 'merged.pdf',
      selectedFiles: files.length,
    });
  }

  function startNewMerge(): void {
    setFiles([]);
    setMergedOutput(null);
    setShowDownloadGate(false);
    setStatus(getIdleOrReadyStatus(0));
    logInfo('New merge started.');
  }

  function handleDownloadCta(): void {
    setShowDownloadGate(true);
    logInfo('Pre-download modal opened.');
  }

  function handleConfirmDownload(): void {
    if (!mergedOutput) {
      return;
    }
    saveBlob('merged.pdf', mergedOutput);
    setShowDownloadGate(false);
    logInfo('merged.pdf download started.');
  }

  const statusClassName =
    status.tone === 'error'
      ? 'text-sm text-red-600'
      : status.tone === 'info'
        ? 'text-sm text-brand-primary'
        : 'text-sm text-ui-muted';

  return (
    <ToolLayout
      title='Merge PDF'
      description='Merge multiple PDF files into a single document directly in your browser. No uploads, no server processing.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-6'>
          <DropZone onFilesSelected={handleFilesSelected} multiple disabled={isProcessing} />
          <div className='inline-flex items-center gap-2 rounded-lg border border-brand-highlight/30 bg-brand-highlight/10 px-3 py-2'>
            <span className='text-brand-highlight' aria-hidden='true'>
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-4 w-4'>
                <path d='M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Z' />
              </svg>
            </span>
            <p className='text-xs font-medium text-brand-highlight'>
              Local processing only. Your PDF files never leave your device.
            </p>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='font-heading text-2xl font-semibold text-ui-text'>Uploaded files</h2>
              {files.length > 0 ? (
                <p className='text-xs font-medium uppercase tracking-wide text-ui-muted'>
                  Drag and drop rows to reorder
                </p>
              ) : null}
            </div>

            {files.length === 0 ? (
              <p className='text-sm text-ui-muted'>No files selected yet.</p>
            ) : (
              <ul className='space-y-2'>
                {files.map((file, index) => (
                  <li
                    key={file.id}
                    draggable
                    data-testid='merge-file-item'
                    onDragStart={(event) => {
                      setDraggedIndex(index);
                      setDragOverIndex(null);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      setDragOverIndex(index);
                    }}
                    onDragLeave={() => {
                      setDragOverIndex((current) => (current === index ? null : current));
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggedIndex === null || draggedIndex === index) {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                        return;
                      }
                      moveFile(draggedIndex, index);
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`rounded-xl border bg-ui-surface p-3 transition ${
                      draggedIndex === index
                        ? 'border-brand-primary bg-brand-primary/5 opacity-70'
                        : dragOverIndex === index
                          ? 'border-brand-highlight bg-brand-highlight/10'
                          : 'border-ui-border hover:border-brand-primary/35'
                    }`}
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <div className='flex min-w-0 items-center gap-3'>
                        <span
                          className='cursor-grab rounded-md border border-ui-border bg-ui-bg p-2 text-brand-highlight/75'
                          aria-hidden='true'
                          title='Drag to reorder'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 24 24'
                            fill='currentColor'
                            className='h-4 w-4'
                          >
                            <circle cx='8' cy='6' r='1.5' />
                            <circle cx='8' cy='12' r='1.5' />
                            <circle cx='8' cy='18' r='1.5' />
                            <circle cx='16' cy='6' r='1.5' />
                            <circle cx='16' cy='12' r='1.5' />
                            <circle cx='16' cy='18' r='1.5' />
                          </svg>
                        </span>
                        <div className='min-w-0'>
                          <p data-testid='merge-file-item-name' className='truncate font-medium text-ui-text'>
                            {file.file.name}
                          </p>
                          <p className='text-xs text-ui-muted'>{formatFileMeta(file)}</p>
                          {dragOverIndex === index ? (
                            <p className='text-xs font-semibold text-brand-highlight'>Drop here</p>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type='button'
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${file.file.name}`}
                        title='Remove file'
                        className='rounded-lg border border-ui-border p-2 text-ui-text transition hover:bg-ui-bg'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          className='h-4 w-4'
                          aria-hidden='true'
                        >
                          <path d='M3 6h18' />
                          <path d='M8 6V4h8v2' />
                          <path d='M19 6l-1 14H6L5 6' />
                          <path d='M10 11v6M14 11v6' />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className='flex flex-wrap items-center gap-4'>
            {!mergedOutput ? (
              <Button onClick={() => void handleMerge()} loading={isProcessing}>
                Merge PDF
              </Button>
            ) : null}
            {!mergedOutput ? <p className={statusClassName}>{status.message}</p> : null}
          </div>

          {mergedOutput ? (
            <div className='rounded-2xl border border-brand-primary/40 bg-brand-primary/10 p-5 shadow-[0_10px_24px_rgba(255,46,139,0.16)]'>
              <p className='font-heading text-lg font-semibold text-ui-text'>Merge completed</p>
              <p className='mt-1 text-sm text-ui-text/85'>
                Your merged PDF is ready. Download it now or start a new merge.
              </p>
              <div className='mt-4 flex flex-wrap gap-3'>
                <Button onClick={handleDownloadCta}>Download PDF</Button>
                <button
                  type='button'
                  onClick={startNewMerge}
                  className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
                >
                  New merge
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <section className='grid gap-6 md:grid-cols-2'>
        <Card>
          <h3 className='font-heading text-2xl font-semibold text-ui-text'>How it works</h3>
          <ol className='mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ui-muted'>
            <li>Drop your PDF files in the upload area.</li>
            <li>Click Merge PDF.</li>
            <li>Download the merged file generated locally.</li>
          </ol>
        </Card>

        <Card>
          <h3 className='font-heading text-2xl font-semibold text-ui-text'>Why PDFlo</h3>
          <ul className='mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ui-muted'>
            <li>No file upload to servers.</li>
            <li>Processing runs entirely in your browser.</li>
            <li>Open source and transparent by design.</li>
          </ul>
        </Card>
      </section>

      {showDownloadGate && mergedOutput ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-md rounded-2xl border border-ui-border bg-ui-surface p-6 shadow-xl'>
            <p className='font-heading text-2xl font-semibold text-ui-text'>Merge completed</p>
            <p className='mt-2 text-sm leading-relaxed text-ui-muted'>
              PDFlo runs entirely in your browser. If it helps, support the project and share it
              with people who need truly private PDF tools.
            </p>
            <div className='mt-5 flex flex-wrap gap-3'>
              <Button onClick={handleConfirmDownload}>Continue to download</Button>
              <button
                type='button'
                onClick={() => setShowDownloadGate(false)}
                className='rounded-xl border border-ui-border px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ToolLayout>
  );
}
