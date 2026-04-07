import { useEffect, useMemo, useState } from 'react';

import { PDFDocument } from 'pdf-lib';
import { ChevronsDownUp } from 'lucide-react';

import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { FileSelectionSummary } from '../../components/ui/FileSelectionSummary';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { ToolActionCard } from '../../components/layout/ToolActionCard';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { ToolLandingSections } from '../../components/seo/ToolLandingSections';
import { optimizePdfBuffer } from '../../adapters/pdfEngine';
import { trackEvent, trackToolEvent } from '../../lib/analytics/trackEvent';
import type { WorkerResponse } from '../../types';

// ⚠️ Do not log user file data. This project is privacy-first.
type StatusTone = 'neutral' | 'info' | 'error';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type OptimizeOutput = {
  filename: string;
  bytes: Uint8Array;
  sourceSizeBytes: number;
  outputSizeBytes: number;
};

const MAX_WEB_OPTIMIZE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const OPTIMIZE_PAGE_CONTENT = {
  howItWorksTitle: 'How to optimize a PDF',
  howItWorksSteps: [
    'Upload one PDF file from your device.',
    'Click “Optimize PDF” to clean up PDF structure locally in your browser.',
    'Download the optimized file immediately.',
  ],
  whyTitle: 'Why use this Optimize PDF tool',
  whyItems: [
    {
      title: 'No file uploads',
      text: 'Your PDF stays on your device. No server-side file processing.',
    },
    {
      title: 'Structure-focused optimization',
      text: 'Optimize can reduce PDF overhead without intentionally degrading visual quality.',
    },
    {
      title: 'Desktop fallback for larger files',
      text: 'For heavier PDFs, use the desktop app to keep browser performance stable.',
    },
    {
      title: 'Automation ready',
      text: 'Use Filegap via CLI or desktop app for batch processing and offline workflows.',
    },
  ],
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'What does Optimize PDF do?',
      answer:
        'Optimize rewrites internal PDF structure to reduce overhead where possible, while preserving content.',
    },
    {
      question: 'Will Optimize always reduce file size?',
      answer:
        'Not always. Some PDFs are already efficient, so results can be small or neutral depending on the source.',
    },
    {
      question: 'Are files uploaded to optimize the PDF?',
      answer:
        'No. Processing happens locally in your browser and files are not uploaded to any server.',
    },
    {
      question: 'Is there a file size limit?',
      answer:
        'Yes. This web optimize tool supports files up to 10 MB for stable local browser performance.',
    },
    {
      question: 'What if my file is larger than the web limit?',
      answer:
        'Use Filegap Desktop or CLI for larger files and heavier workflows while staying privacy-first.',
    },
  ],
  seoTitle: 'Optimize PDF online with local processing',
  seoParagraphs: [
    'Filegap lets you optimize PDF files directly in your browser without uploading them to external servers.',
    'This optimize flow focuses on structural cleanup and efficient rewriting of the document.',
    'If your files are large or your workflow is batch-oriented, switch to Filegap Desktop or CLI for better performance and control.',
  ],
  finalCtaTitle: 'Ready to optimize your PDF?',
  finalCtaText: 'Start optimizing now — private local processing, no uploads.',
  finalCtaLabel: 'Optimize PDF now',
  finalCtaHref: '#optimize-pdf-tool',
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

  return new Response(file).arrayBuffer();
}

async function getPdfPageCount(file: File): Promise<number | null> {
  try {
    const bytes = await fileToArrayBuffer(file);
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  } catch {
    return null;
  }
}

function buildOptimizeFilename(baseFilename: string): string {
  const base = baseFilename.toLowerCase().endsWith('.pdf')
    ? baseFilename.slice(0, -4)
    : baseFilename;
  return `${base}-optimized.pdf`;
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

function getOptimizationDeltaLabel(sourceSizeBytes: number, outputSizeBytes: number): string {
  if (!Number.isFinite(sourceSizeBytes) || sourceSizeBytes <= 0) {
    return `Output size ${formatFileSize(outputSizeBytes)}.`;
  }

  const delta = sourceSizeBytes - outputSizeBytes;
  const ratio = (Math.abs(delta) / sourceSizeBytes) * 100;
  const roundedRatio = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(ratio);

  if (delta > 0) {
    return `${formatFileSize(delta)} smaller (${roundedRatio}% reduction).`;
  }
  if (delta < 0) {
    return `${formatFileSize(Math.abs(delta))} larger (${roundedRatio}% increase).`;
  }
  return 'No size change detected.';
}

function getOptimizationSummary(sourceSizeBytes: number, outputSizeBytes: number): {
  badge: string;
  badgeClassName: string;
  headline: string;
} {
  if (!Number.isFinite(sourceSizeBytes) || sourceSizeBytes <= 0) {
    return {
      badge: 'Done',
      badgeClassName: 'bg-ui-bg text-ui-muted border-ui-border',
      headline: 'Optimization completed',
    };
  }

  const delta = sourceSizeBytes - outputSizeBytes;
  const ratio = (Math.abs(delta) / sourceSizeBytes) * 100;
  const roundedRatio = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(ratio);

  if (delta > 0) {
    return {
      badge: 'Reduced',
      badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      headline: `${roundedRatio}% smaller`,
    };
  }
  if (delta < 0) {
    return {
      badge: 'Larger',
      badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200',
      headline: `${roundedRatio}% larger`,
    };
  }
  return {
    badge: 'No change',
    badgeClassName: 'bg-ui-bg text-ui-muted border-ui-border',
    headline: '0% change',
  };
}

export function OptimizePdfPage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [output, setOutput] = useState<OptimizeOutput | null>(null);
  const [status, setStatus] = useState<StatusState>({
    tone: 'neutral',
    message: 'Select one PDF file to start.',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [isDropZoneCollapsed, setIsDropZoneCollapsed] = useState(false);
  const [limitExceededFileSize, setLimitExceededFileSize] = useState<number | null>(null);

  const worker = useMemo(
    () => new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' }),
    []
  );

  useEffect(() => {
    return () => worker.terminate();
  }, [worker]);

  const canOptimize = Boolean(sourceFile) && !isProcessing;
  const sizeLimitLabel = formatFileSize(MAX_WEB_OPTIMIZE_FILE_SIZE_BYTES);
  const limitExceeded = limitExceededFileSize !== null;
  const optimizationSummary = output
    ? getOptimizationSummary(output.sourceSizeBytes, output.outputSizeBytes)
    : null;

  async function handleSourceSelected(files: File[]): Promise<void> {
    const file = files[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_WEB_OPTIMIZE_FILE_SIZE_BYTES) {
      setSourceFile(null);
      setPageCount(null);
      setOutput(null);
      setShowDownloadGate(false);
      setIsDropZoneCollapsed(false);
      setLimitExceededFileSize(file.size);
      setStatus({
        tone: 'error',
        message: `Web optimize supports files up to ${sizeLimitLabel}. Use the desktop app for larger PDFs.`,
      });
      return;
    }

    setSourceFile(file);
    setOutput(null);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(true);
    setLimitExceededFileSize(null);
    setStatus({ tone: 'info', message: 'Reading PDF metadata...' });

    const totalPages = await getPdfPageCount(file);
    setPageCount(totalPages);
    if (!totalPages) {
      setStatus({
        tone: 'error',
        message: 'Could not read page count. Please select a valid PDF file.',
      });
      return;
    }

    setStatus({
      tone: 'info',
      message: `PDF ready (${totalPages} pages).`,
    });
  }

  async function handleOptimize(): Promise<void> {
    if (!sourceFile) {
      setStatus({ tone: 'error', message: 'Select one PDF file before optimizing.' });
      return;
    }

    trackToolEvent('selection_made', 'optimize');
    setIsProcessing(true);
    setStatus({
      tone: 'info',
      message: 'Processing locally in your browser... Time may vary based on file size and device performance.',
    });

    const fileBuffer = await fileToArrayBuffer(sourceFile);

    const response = await new Promise<WorkerResponse>((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          ok: false,
          error: 'optimize timeout: worker did not respond in time',
        });
      }, 20_000);

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
        type: 'optimize',
        payload: {
          file: fileBuffer,
        },
      });
    });

    let optimized: Uint8Array;
    if (!response.ok) {
      try {
        optimized = await optimizePdfBuffer(fileBuffer);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown optimize error';
        setStatus({ tone: 'error', message: `Optimize failed: ${reason}` });
        setIsProcessing(false);
        return;
      }
    } else {
      if (response.type !== 'optimize') {
        setStatus({ tone: 'error', message: 'Invalid worker response type for optimize.' });
        setIsProcessing(false);
        return;
      }
      optimized = response.payload.output;
    }

    setOutput({
      filename: buildOptimizeFilename(sourceFile.name),
      bytes: optimized,
      sourceSizeBytes: sourceFile.size,
      outputSizeBytes: optimized.byteLength,
    });
    setShowDownloadGate(false);
    setIsProcessing(false);
    setStatus({ tone: 'info', message: 'Optimize completed. Your PDF is ready to download.' });
    trackToolEvent('completed', 'optimize');
  }

  function handleOptimizeCtaClick(): void {
    trackToolEvent('started', 'optimize');
    void handleOptimize();
  }

  function startNewOptimize(): void {
    setSourceFile(null);
    setPageCount(null);
    setOutput(null);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(false);
    setLimitExceededFileSize(null);
    setStatus({
      tone: 'neutral',
      message: 'Select one PDF file to start.',
    });
  }

  function removeSourceFile(): void {
    setSourceFile(null);
    setPageCount(null);
    setOutput(null);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(false);
    setStatus({
      tone: 'neutral',
      message: 'Select one PDF file to start.',
    });
  }

  function handleConfirmDownload(): void {
    if (!output) {
      return;
    }
    saveBlob(output.filename, output.bytes);
    setShowDownloadGate(false);
  }

  return (
    <ToolLayout
      title='Optimize PDF online — private, local, and fast'
      description='Optimize PDF structure directly in your browser without uploading your file.'
      trustLine='Free • No signup • Works in your browser'
      metaTitle='Optimize PDF Online — Private, Local & Free | Filegap'
      metaDescription='Optimize PDF files online for free with private local processing. Reduce structural overhead directly in your browser with no uploads and no signup.'
      heroVariant='brand'
    >
      <ToolActionCard id='optimize-pdf-tool'>
          {!sourceFile ? (
            <DropZone
              onFilesSelected={(files) => void handleSourceSelected(files)}
              multiple={false}
              disabled={isProcessing}
              loadedFileName={null}
            />
          ) : isDropZoneCollapsed ? (
            <FileSelectionSummary
              filename={sourceFile.name}
              meta={`${formatFileSize(sourceFile.size)}${pageCount ? ` • ${pageCount} pages` : ''}`}
              onReplace={() => setIsDropZoneCollapsed(false)}
              onRemove={removeSourceFile}
            />
          ) : (
            <div className='relative'>
              <button
                type='button'
                onClick={() => setIsDropZoneCollapsed(true)}
                aria-label='Hide file picker'
                title='Hide file picker'
                className='absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ui-border bg-ui-surface text-ui-text transition hover:bg-ui-bg'
              >
                <ChevronsDownUp className='h-4 w-4' />
              </button>
              <DropZone
                onFilesSelected={(files) => void handleSourceSelected(files)}
                multiple={false}
                disabled={isProcessing}
                loadedFileName={sourceFile.name}
              />
            </div>
          )}

          {limitExceeded ? (
            <section className='space-y-3 rounded-xl border border-amber-400/45 bg-amber-50 p-4'>
              <h2 className='font-heading text-lg font-semibold text-ui-text'>Use desktop app for larger files</h2>
              <p className='text-sm text-ui-text/85'>
                Selected file size: {formatFileSize(limitExceededFileSize ?? 0)}. Web optimize supports up to {sizeLimitLabel} to keep local browser processing stable.
              </p>
              <div className='flex flex-wrap gap-3'>
                <a
                  href='/download'
                  onClick={() => trackEvent('download_app_clicked')}
                  className='inline-flex items-center justify-center rounded-lg border border-ui-border bg-ui-surface px-4 py-2 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
                >
                  Download app
                </a>
                <a
                  href='/cli'
                  onClick={() => trackEvent('download_cli_clicked')}
                  className='inline-flex items-center justify-center rounded-lg border border-ui-border bg-ui-surface px-4 py-2 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
                >
                  Try CLI
                </a>
              </div>
            </section>
          ) : null}

          {sourceFile ? (
            <section className='space-y-4'>
              <div className='space-y-1'>
                <h2 className='font-heading text-2xl font-semibold text-ui-text'>Optimize file</h2>
                <p className='text-sm text-ui-muted'>
                  Optimize rewrites PDF structure locally in your browser without intentional visual quality reduction.
                </p>
              </div>

              <div className='grid gap-3 rounded-xl border border-ui-border/70 bg-ui-surface p-4 sm:grid-cols-2'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Input size</p>
                  <p className='mt-1 text-sm font-semibold text-ui-text'>{formatFileSize(sourceFile.size)}</p>
                </div>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Pages</p>
                  <p className='mt-1 text-sm font-semibold text-ui-text'>{pageCount ?? '-'}</p>
                </div>
              </div>

              {!output ? (
                <div className='sticky bottom-4 z-10 pt-2'>
                  <div className='flex flex-col gap-3 rounded-2xl border border-ui-border/80 bg-ui-surface/95 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold text-ui-text'>
                        {canOptimize ? 'Ready to optimize this PDF' : 'Preparing PDF'}
                      </p>
                      <p className={status.tone === 'error' ? 'mt-2 text-sm text-red-600' : 'mt-2 text-sm text-ui-muted'}>
                        {status.tone === 'error'
                          ? status.message
                          : 'Processing happens locally in your browser. Timing depends on your device, browser, and available resources.'}
                      </p>
                    </div>
                    <Button onClick={handleOptimizeCtaClick} loading={isProcessing} disabled={!canOptimize}>
                      Optimize PDF
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {output ? (
            <div className='space-y-3 rounded-2xl border border-brand-primary/35 bg-brand-primary/10 p-5'>
              <div>
                <p className='font-heading text-lg font-semibold text-ui-text'>Optimize completed</p>
                <p className='text-sm text-ui-text/85'>Your optimized PDF is ready to download.</p>
              </div>

              <div className='rounded-xl border border-ui-border bg-ui-surface p-4'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${optimizationSummary?.badgeClassName ?? 'bg-ui-bg text-ui-muted border-ui-border'}`}>
                    {optimizationSummary?.badge ?? 'Done'}
                  </span>
                  <p className='text-sm font-medium text-ui-muted'>Result</p>
                </div>

                <p className='mt-2 font-heading text-3xl font-bold leading-tight text-ui-text'>
                  {optimizationSummary?.headline ?? 'Optimization completed'}
                </p>

                <p className='mt-1 text-sm text-ui-muted'>
                  {getOptimizationDeltaLabel(output.sourceSizeBytes, output.outputSizeBytes)}
                </p>

                <div className='mt-4 grid gap-2 rounded-lg border border-ui-border bg-ui-bg/70 p-3 sm:grid-cols-3'>
                  <div>
                    <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-muted'>Before</p>
                    <p className='mt-1 text-sm font-semibold text-ui-text'>{formatFileSize(output.sourceSizeBytes)}</p>
                  </div>
                  <div>
                    <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-muted'>After</p>
                    <p className='mt-1 text-sm font-semibold text-ui-text'>{formatFileSize(output.outputSizeBytes)}</p>
                  </div>
                  <div>
                    <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-muted'>Delta</p>
                    <p className='mt-1 text-sm font-semibold text-ui-text'>
                      {formatFileSize(Math.abs(output.sourceSizeBytes - output.outputSizeBytes))}
                    </p>
                  </div>
                </div>

                <p className='mt-3 truncate text-xs text-ui-muted' title={output.filename}>
                  {output.filename}
                </p>
              </div>

              <div className='mt-4 flex flex-wrap gap-3'>
                <Button onClick={() => setShowDownloadGate(true)}>Download PDF</Button>
                <button
                  type='button'
                  onClick={startNewOptimize}
                  className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
                >
                  New optimize
                </button>
              </div>
            </div>
          ) : null}
      </ToolActionCard>

      <ToolLandingSections
        {...OPTIMIZE_PAGE_CONTENT}
        seoSupplement={
          <>
            <p>
              You can also use <a className='text-ui-text underline' href='/reorder-pdf'>reorder pages</a>{' '}
              and <a className='text-ui-text underline' href='/extract-pages'>extract pages</a> on web.
            </p>
            <div className='pt-1'>
              <h3 className='text-base font-semibold text-ui-text'>Need larger file support?</h3>
              <p className='mt-1.5 text-sm text-ui-muted'>
                Use Filegap Desktop or CLI for heavier files and batch workflows while keeping
                processing local and private.
              </p>
              <div className='mt-3 flex flex-col gap-2.5 sm:flex-row'>
                <div className='min-w-0'>
                  <a
                    href='/download'
                    onClick={() => trackEvent('download_app_clicked')}
                    className='inline-flex items-center justify-center rounded-lg border border-ui-border bg-ui-surface px-4 py-2 text-sm font-semibold text-ui-text transition hover:bg-ui-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-border/80 focus-visible:ring-offset-2'
                  >
                    Download app
                  </a>
                </div>
                <div className='min-w-0'>
                  <a
                    href='/cli'
                    onClick={() => trackEvent('download_cli_clicked')}
                    className='inline-flex items-center justify-center rounded-lg border border-ui-border bg-ui-surface px-4 py-2 text-sm font-semibold text-ui-text transition hover:bg-ui-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-border/80 focus-visible:ring-offset-2'
                  >
                    Try CLI
                  </a>
                </div>
              </div>
            </div>
          </>
        }
      />

      <PreDownloadModal
        open={showDownloadGate && Boolean(output)}
        onConfirm={handleConfirmDownload}
        onClose={() => setShowDownloadGate(false)}
      />
    </ToolLayout>
  );
}
