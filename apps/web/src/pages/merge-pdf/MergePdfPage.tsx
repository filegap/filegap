import { useEffect, useMemo, useState } from 'react';

import { PDFDocument } from 'pdf-lib';
import { FileText, Plus, Trash2, X } from 'lucide-react';

import { CliPreviewCard } from '../../components/ui/CliPreviewCard';
import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { ToolLandingSections } from '../../components/seo/ToolLandingSections';
import { UploadedFilesTable } from '../../components/ui/UploadedFilesTable';
import { SimpleProcessFlow } from '../../components/ui/SimpleProcessFlow';
import { ToolActionCard } from '../../components/layout/ToolActionCard';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { mergePdfBuffers } from '../../adapters/pdfEngine';
import { trackEvent, trackToolEvent } from '../../lib/analytics/trackEvent';
import type { WorkerResponse } from '../../types';

// ⚠️ Do not log user file data. This project is privacy-first.
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

type MergeOutputSummary = {
  sizeBytes: number;
  pageCount: number | null;
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

async function extractPageCountFromBytes(bytes: Uint8Array): Promise<number | null> {
  try {
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  } catch {
    return null;
  }
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(sizeBytes) / Math.log(1024)), units.length - 1);
  const value = sizeBytes / 1024 ** exponent;
  const precision = value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: precision }).format(value)} ${units[exponent]}`;
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
  return { tone: 'info', message: 'Ready to run locally.' };
}

const MERGE_PAGE_CONTENT = {
  howItWorksTitle: 'How to merge PDF files',
  howItWorksSteps: [
    'Upload or drag and drop your PDF files.',
    'Reorder them the way you want.',
    'Click “Merge PDF” and download your combined file.',
  ],
  whyTitle: 'Why use this Merge PDF tool',
  whyItems: [
    {
      title: 'No file uploads',
      text: 'Your files are processed locally in your browser and never uploaded to any server.',
    },
    {
      title: 'Fast and simple',
      text: 'Merge multiple PDF files in seconds without waiting for uploads.',
    },
    {
      title: 'Secure and private',
      text: 'Your documents stay on your device at all times.',
    },
    {
      title: 'Automation ready',
      text: 'Use Filegap via CLI or desktop app for batch processing and offline workflows.',
    },
  ],
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'How do I merge PDF files online?',
      answer:
        'Upload your PDF files, arrange them in order, and click “Merge PDF” to combine them into a single document.',
    },
    {
      question: 'Is it safe to merge PDF files with Filegap?',
      answer: 'Yes. All processing happens locally in your browser. Your files are never uploaded.',
    },
    {
      question: 'Can I merge PDF files for free?',
      answer: 'Yes. You can merge PDF files for free with no signup required.',
    },
    {
      question: 'Is there a file size limit?',
      answer: 'Limits depend on your device performance since all processing happens locally.',
    },
    {
      question: 'Can I merge PDF files without uploading them?',
      answer:
        'Yes. Filegap processes your files locally in your browser, so they are never uploaded to a server.',
    },
  ],
  seoTitle: 'Merge PDF files quickly and securely',
  seoParagraphs: [
    'Filegap lets you merge PDF files online without uploading them to any server. Unlike traditional tools, everything runs locally in your browser, making it a safer option for sensitive documents.',
    'You can combine multiple PDF files into a single document in seconds, reorder them as needed, and download the result instantly.',
    'Whether you need to merge PDFs for work, school, or personal use, Filegap provides a fast, private, and free solution directly in your browser.',
  ],
  finalCtaTitle: 'Ready to merge your PDFs?',
  finalCtaText: 'Start combining your PDF files now — no uploads, no signup.',
  finalCtaLabel: 'Merge PDFs instantly',
  finalCtaHref: '#merge-pdf-tool',
};

export function MergePdfPage() {
  const [files, setFiles] = useState<MergeQueueFile[]>([]);
  const [status, setStatus] = useState<StatusState>(getIdleOrReadyStatus(0));
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedOutput, setMergedOutput] = useState<Uint8Array | null>(null);
  const [mergedSummary, setMergedSummary] = useState<MergeOutputSummary | null>(null);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [isDropZoneCollapsed, setIsDropZoneCollapsed] = useState(false);

  const worker = useMemo(
    () => new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' }),
    []
  );
  const dropZoneLoadedName =
    files.length === 0
      ? null
      : files.length === 1
        ? files[0].file.name
        : `${files[0].file.name} + ${files.length - 1} more`;
  const uploadedFiles = files.map((file) => ({
    id: file.id,
    filename: file.file.name,
    sizeBytes: file.file.size,
    pages: file.pageCount,
    pagesStatus: file.pageCountStatus,
  }));

  function handleFilesSelected(nextFiles: File[]): void {
    const queuedFiles = nextFiles.map(createQueueFile);
    if (queuedFiles.length === 0) {
      return;
    }
    if (mergedOutput) {
      setMergedOutput(null);
      setMergedSummary(null);
      setShowDownloadGate(false);
    }
    setIsDropZoneCollapsed(true);

    setFiles((currentFiles) => {
      const mergedFiles = [...currentFiles, ...queuedFiles];
      setStatus(getIdleOrReadyStatus(mergedFiles.length));

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
      setMergedSummary(null);
      setShowDownloadGate(false);
    }
    setFiles((currentFiles) => {
      const next = currentFiles.filter((_, index) => index !== indexToRemove);
      setStatus(getIdleOrReadyStatus(next.length));
      return next;
    });
  }

  function moveFile(fromIndex: number, toIndex: number): void {
    if (mergedOutput) {
      setMergedOutput(null);
      setMergedSummary(null);
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
      return;
    }

    setIsProcessing(true);
    setStatus({
      tone: 'info',
      message: 'Processing locally in your browser... Time may vary based on file size and device performance.',
    });

    const buffers = await Promise.all(files.map((file) => fileToArrayBuffer(file.file)));

    const response = await new Promise<WorkerResponse>((resolve) => {
      const timeoutId = setTimeout(() => {
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
        resolve({
          ok: false,
          error: event.message || 'worker error',
        });
      };

      worker.onmessageerror = () => {
        cleanup();
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
      try {
        const output = await mergePdfBuffers(buffers);
        setMergedOutput(output);
        setMergedSummary({
          sizeBytes: output.byteLength,
          pageCount: await extractPageCountFromBytes(output),
        });
        setShowDownloadGate(false);
        trackToolEvent('completed', 'merge', { files_count: files.length });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown merge error';
        setStatus({ tone: 'error', message: `Merge failed: ${reason}` });
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
    setMergedSummary({
      sizeBytes: response.payload.output.byteLength,
      pageCount: await extractPageCountFromBytes(response.payload.output),
    });
    setShowDownloadGate(false);
    setIsProcessing(false);
    trackToolEvent('completed', 'merge', { files_count: files.length });
  }

  function handleMergeCtaClick(): void {
    trackToolEvent('started', 'merge', { files_count: files.length });
    void handleMerge();
  }

  function startNewMerge(): void {
    setFiles([]);
    setMergedOutput(null);
    setMergedSummary(null);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(false);
    setStatus(getIdleOrReadyStatus(0));
  }

  function clearQueuedFiles(): void {
    setFiles([]);
    setMergedOutput(null);
    setMergedSummary(null);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(false);
    setStatus(getIdleOrReadyStatus(0));
  }

  function handleDownloadCta(): void {
    setShowDownloadGate(true);
  }

  function handleConfirmDownload(): void {
    if (!mergedOutput) {
      return;
    }
    saveBlob('merged.pdf', mergedOutput);
    setShowDownloadGate(false);
  }

  const actionMessageClassName = status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted';
  const cliPreview = useMemo(() => {
    if (files.length >= 2) {
      return `filegap merge ${files.map((file) => `"${file.file.name}"`).join(' ')} > merged.pdf`;
    }
    return 'filegap merge "input-a.pdf" "input-b.pdf" > merged.pdf';
  }, [files]);
  const totalSizeBytes = files.reduce((sum, file) => sum + file.file.size, 0);
  const totalReadyPages = files.reduce((sum, file) => sum + (file.pageCount ?? 0), 0);
  const allPagesResolved = files.length > 0 && files.every((file) => file.pageCountStatus === 'ready' && file.pageCount !== null);
  const inputSummaryMeta = `${files.length} file${files.length === 1 ? '' : 's'} • ${formatFileSize(totalSizeBytes)}${
    allPagesResolved ? ` • ${totalReadyPages} pages` : ''
  }`;

  return (
    <ToolLayout
      title='Merge PDF files online — fast, private, and local'
      description='Combine multiple PDF files into one document directly in your browser. No account required.'
      trustLine='Free • No signup • Works in your browser'
      metaTitle='Merge PDF Files Online — Private, Local & Free | Filegap'
      metaDescription='Merge PDF files online for free with private local processing. Combine PDFs directly in your browser with no uploads and no signup.'
      heroVariant='brand'
    >
      <ToolActionCard id='merge-pdf-tool' className='space-y-6'>
          {files.length === 0 ? (
            <DropZone
              onFilesSelected={handleFilesSelected}
              multiple
              disabled={isProcessing}
              loadedFileName={null}
            />
          ) : isDropZoneCollapsed ? (
            <div className='animate-[fade-in_180ms_ease-out] space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Input files</p>
              <div className='flex w-full items-center gap-3 rounded-xl border border-ui-border/70 bg-ui-surface px-3 py-2.5 text-left transition-all duration-200 hover:border-brand-primary/35 hover:bg-ui-bg'>
                <span className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ui-bg text-ui-muted'>
                  <FileText className='h-4.5 w-4.5' />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block text-sm font-semibold text-ui-text'>
                    {files.length === 1 ? files[0].file.name : `${files.length} PDFs ready`}
                  </span>
                  <span className='block text-xs text-ui-muted'>{inputSummaryMeta}</span>
                </span>
                <button
                  type='button'
                  onClick={() => setIsDropZoneCollapsed(false)}
                  className='inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
                >
                  <span className='hidden sm:inline'>Add more</span>
                  <Plus className='h-4 w-4' />
                </button>
                <button
                  type='button'
                  onClick={clearQueuedFiles}
                  aria-label='Clear files'
                  title='Clear files'
                  className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            </div>
          ) : (
            <div className='relative animate-[fade-in_180ms_ease-out]'>
              <button
                type='button'
                onClick={() => setIsDropZoneCollapsed(true)}
                aria-label='Hide file picker'
                title='Hide file picker'
                className='absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ui-border bg-ui-surface text-ui-text transition hover:bg-ui-bg'
              >
                <X className='h-4 w-4' />
              </button>
              <DropZone
                onFilesSelected={handleFilesSelected}
                multiple
                disabled={isProcessing}
                loadedFileName={dropZoneLoadedName}
              />
            </div>
          )}

          {uploadedFiles.length > 0 ? (
            <section className='space-y-2'>
              <div className='flex items-center justify-between gap-3'>
                <h2 className='font-heading text-xl font-semibold text-ui-text'>Uploaded files</h2>
                {uploadedFiles.length > 1 ? (
                  <p className='text-xs font-medium uppercase tracking-wide text-ui-muted'>Drag rows to reorder</p>
                ) : null}
              </div>
              <UploadedFilesTable
                files={uploadedFiles}
                reorderable
                showTitle={false}
                showHeaderRow={false}
                onRemove={(id) => {
                  const index = files.findIndex((file) => file.id === id);
                  if (index < 0) {
                    return;
                  }
                  removeFile(index);
                }}
                onReorder={moveFile}
              />
            </section>
          ) : null}

          {uploadedFiles.length > 0 ? (
            <section className='space-y-3'>
              <h2 className='font-heading text-xl font-semibold text-ui-text'>Processing steps</h2>
              <SimpleProcessFlow
                description='Runs locally on your files.'
                steps={['Input', 'Merge', 'Output']}
                activeStepIndex={1}
                showTitle={false}
                secondaryActionLabel='Open in Workflow Builder'
                secondaryActionHref='/workflow-builder?template=merge'
                onSecondaryActionClick={() => trackEvent('selection_made', { tool: 'merge' })}
              />
            </section>
          ) : null}

          {!mergedOutput && uploadedFiles.length > 0 ? (
            <div className='sticky bottom-4 z-10 pt-2'>
              <div className='flex flex-col gap-3 rounded-2xl border border-ui-border/80 bg-ui-surface/95 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold text-ui-text'>
                    {uploadedFiles.length === 1
                      ? '1 PDF ready'
                      : `${uploadedFiles.length} PDFs ready`}
                  </p>
                  <div className='mt-2 flex flex-wrap items-center gap-2'>
                    <p className={actionMessageClassName}>{files.length >= 2 ? 'Ready to merge.' : status.message}</p>
                  </div>
                </div>
                <Button onClick={handleMergeCtaClick} loading={isProcessing} disabled={files.length < 2}>
                  Merge PDF
                </Button>
              </div>
            </div>
          ) : null}

          {mergedOutput ? (
            <div className='rounded-2xl border border-brand-primary/40 bg-brand-primary/10 p-5'>
              <p className='font-heading text-lg font-semibold text-ui-text'>Merge completed</p>
              <p className='mt-1 text-sm text-ui-text/85'>
                Your merged PDF is ready. The local process finished on this device.
              </p>
              {mergedSummary ? (
                <p className='mt-2 text-sm text-ui-muted'>
                  {mergedSummary.pageCount ? `${mergedSummary.pageCount} pages` : 'PDF ready'} • {formatFileSize(mergedSummary.sizeBytes)}
                </p>
              ) : null}
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

          {uploadedFiles.length > 0 ? (
            <section className='space-y-3'>
              <h2 className='font-heading text-xl font-semibold text-ui-text'>CLI preview</h2>
              <CliPreviewCard
                command={cliPreview}
                helperText='Run the same merge from your terminal.'
                learnHref='/cli?example=merge'
                learnLabel='Try the CLI →'
                showTitle={false}
              />
            </section>
          ) : null}
      </ToolActionCard>

      <ToolLandingSections
        {...MERGE_PAGE_CONTENT}
        seoSupplement={
          <div className='pt-1'>
            <h3 className='text-base font-semibold text-ui-text'>Need automation or offline use?</h3>
            <p className='mt-1.5 text-sm text-ui-muted'>
              Run Filegap via CLI or use the desktop app for batch processing and offline
              workflows.
            </p>
            <div className='mt-3 flex flex-col gap-2.5 sm:flex-row'>
              <div className='min-w-0'>
                <a
                  href='/cli'
                  onClick={() => trackEvent('download_cli_clicked')}
                  className='inline-flex items-center justify-center rounded-lg border border-ui-border bg-ui-surface px-4 py-2 text-sm font-semibold text-ui-text transition hover:bg-ui-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-border/80 focus-visible:ring-offset-2'
                >
                  Try the CLI
                </a>
              </div>
              <div className='min-w-0'>
                <a
                  href='/download'
                  onClick={() => trackEvent('download_app_clicked')}
                  className='inline-flex items-center justify-center rounded-lg border border-ui-border bg-ui-surface px-4 py-2 text-sm font-semibold text-ui-text transition hover:bg-ui-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-border/80 focus-visible:ring-offset-2'
                >
                  Download app
                </a>
              </div>
            </div>
          </div>
        }
      />

      <PreDownloadModal
        open={showDownloadGate && Boolean(mergedOutput)}
        onConfirm={handleConfirmDownload}
        onClose={() => setShowDownloadGate(false)}
      />
    </ToolLayout>
  );
}
