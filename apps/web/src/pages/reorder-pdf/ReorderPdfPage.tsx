import { useEffect, useMemo, useRef, useState } from 'react';

import { PDFDocument } from 'pdf-lib';
import { ChevronLeft, ChevronsDownUp, FileText, RotateCcw, Trash2, X } from 'lucide-react';

import { Card } from '../../components/ui/Card';
import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { ToolLandingSections } from '../../components/seo/ToolLandingSections';
import { ReorderPageGallery } from '../../components/ui/ReorderPageGallery';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { parsePageOrder, reorderPdfPages } from '../../adapters/pdfEngine';
import { trackEvent, trackToolEvent } from '../../lib/analytics/trackEvent';
import { renderPdfThumbnails, type PageThumbnail } from '../../lib/pdfPreview';
import type { WorkerResponse } from '../../types';

// ⚠️ Do not log user file data. This project is privacy-first.
type StatusTone = 'neutral' | 'info' | 'error';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type ReorderOutput = {
  filename: string;
  bytes: Uint8Array;
  orderLabel: string;
};

const MAX_PREVIEW_PAGES = 40;

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

function buildReorderFilename(baseFilename: string): string {
  const base = baseFilename.toLowerCase().endsWith('.pdf')
    ? baseFilename.slice(0, -4)
    : baseFilename;
  return `${base}-reordered.pdf`;
}

function formatFileSize(sizeBytes: number): string {
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function formatPageOrder(pageOrder: number[]): string {
  return pageOrder.join(',');
}

function buildDefaultPageOrder(pageCount: number): number[] {
  return Array.from({ length: pageCount }, (_, index) => index + 1);
}

const REORDER_PAGE_CONTENT = {
  howItWorksTitle: 'How to reorder PDF pages',
  howItWorksSteps: [
    'Upload one PDF file from your device.',
    'Enter the full page order you want, for example 3, 1, 2, 4, so every page appears exactly once.',
    'Click “Reorder PDF” and download your reordered PDF instantly.',
  ],
  whyTitle: 'Why use this Reorder PDF tool',
  whyItems: [
    {
      title: 'No file uploads',
      text: 'Your PDF is processed on your device and never uploaded to a server.',
    },
    {
      title: 'Quick page rearrangement',
      text: 'Reorder pages in seconds to fix sequence issues before sharing or printing.',
    },
    {
      title: 'Private by default',
      text: 'Everything happens in your browser for better privacy and control.',
    },
    {
      title: 'Automation ready',
      text: 'Use Filegap via CLI or desktop app for batch processing and offline workflows.',
    },
  ],
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'How do I reorder PDF pages online?',
      answer:
        'Upload your PDF, enter the new page order, and click “Reorder PDF” to generate the updated file.',
    },
    {
      question: 'Is it safe to reorder PDF pages with Filegap?',
      answer: 'Yes. Processing happens locally in your browser. Your files are never uploaded.',
    },
    {
      question: 'Can I reorder PDF pages without uploading my file?',
      answer:
        'Yes. Filegap processes your PDF locally in your browser, so your file is never uploaded to a server.',
    },
    {
      question: 'Can I change the page order in a PDF?',
      answer:
        'Yes. Enter the new page order, and Filegap will generate a reordered PDF file for you.',
    },
    {
      question: 'Can I reorder PDF pages for free?',
      answer: 'Yes. You can reorder PDF pages for free with no signup required.',
    },
    {
      question: 'Is there a file size limit?',
      answer: 'Limits depend on your browser and device performance because all processing is local.',
    },
  ],
  seoTitle: 'Reorder PDF pages quickly and securely',
  seoParagraphs: [
    'Filegap lets you reorder PDF pages online without uploading documents to a server. Everything runs locally in your browser without installing software, making it a safer option for sensitive files.',
    'You can change the page order, fix document sequence issues, and generate a new PDF in seconds.',
    'Whether you need to fix a document sequence for work, school, or personal files, Filegap provides a fast, private, and free way to reorder PDF pages directly on your device.',
  ],
  finalCtaTitle: 'Ready to reorder your PDF?',
  finalCtaText: 'Start reordering PDF pages now — no uploads, no signup.',
  finalCtaLabel: 'Reorder PDF pages now',
  finalCtaHref: '#reorder-pdf-tool',
};

export function ReorderPdfPage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [orderInput, setOrderInput] = useState('');
  const [lastValidOrderInput, setLastValidOrderInput] = useState('');
  const [output, setOutput] = useState<ReorderOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingPreviews, setIsRenderingPreviews] = useState(false);
  const [isDropZoneCollapsed, setIsDropZoneCollapsed] = useState(false);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [pageOrderSelection, setPageOrderSelection] = useState<number[]>([]);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    tone: 'neutral',
    message: 'Select one PDF file to start.',
  });
  const isSyncingFromGalleryRef = useRef(false);

  const worker = useMemo(
    () => new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' }),
    []
  );

  const parsedOrder = useMemo(() => {
    if (!orderInput.trim() || !pageCount || pageCount < 1) {
      return { pageOrder: null as number[] | null, error: null as string | null };
    }
    try {
      return { pageOrder: parsePageOrder(orderInput, pageCount), error: null };
    } catch (error) {
      return {
        pageOrder: null,
        error: error instanceof Error ? error.message : 'Invalid page order.',
      };
    }
  }, [orderInput, pageCount]);

  const canReorder =
    Boolean(sourceFile) &&
    Boolean(parsedOrder.pageOrder) &&
    (parsedOrder.pageOrder?.length ?? 0) > 0 &&
    !isProcessing;

  const orderPreviewLabel = useMemo(() => {
    const order = parsedOrder.pageOrder ?? pageOrderSelection;
    if (!order || order.length === 0) {
      return '';
    }

    const preview = order.slice(0, 8).join(', ');
    return order.length > 8 ? `${preview}...` : preview;
  }, [parsedOrder.pageOrder, pageOrderSelection]);

  useEffect(() => {
    return () => worker.terminate();
  }, [worker]);

  useEffect(() => {
    if (!sourceFile || !pageCount || pageCount < 1) {
      setThumbnails([]);
      setPageOrderSelection([]);
      setIsRenderingPreviews(false);
      return;
    }

    let cancelled = false;
    setIsRenderingPreviews(true);

    void (async () => {
      try {
        const bytes = new Uint8Array(await fileToArrayBuffer(sourceFile));
        const previews = await renderPdfThumbnails(bytes, pageCount, MAX_PREVIEW_PAGES);
        if (cancelled) {
          return;
        }
        setThumbnails(previews);
      } catch {
        if (cancelled) {
          return;
        }
        setThumbnails([]);
        setStatus({
          tone: 'info',
          message: `PDF ready (${pageCount} pages). Preview unavailable, but reordering still works locally.`,
        });
      } finally {
        if (!cancelled) {
          setIsRenderingPreviews(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceFile, pageCount]);

  useEffect(() => {
    if (isSyncingFromGalleryRef.current) {
      isSyncingFromGalleryRef.current = false;
      return;
    }

    if (pageOrderSelection.length === 0) {
      setOrderInput('');
      setLastValidOrderInput('');
      return;
    }

    const nextInput = formatPageOrder(pageOrderSelection);
    setOrderInput(nextInput);
    setLastValidOrderInput(nextInput);
  }, [pageOrderSelection]);

  async function handleSourceSelected(files: File[]): Promise<void> {
    const file = files[0];
    if (!file) {
      return;
    }

    setSourceFile(file);
    setOutput(null);
    setShowDownloadGate(false);
    setOrderInput('');
    setLastValidOrderInput('');
    setThumbnails([]);
    setPageOrderSelection([]);
    setIsDropZoneCollapsed(false);
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

    const recommendedOrder = buildDefaultPageOrder(totalPages);
    const recommended = formatPageOrder(recommendedOrder);
    setPageOrderSelection(recommendedOrder);
    setOrderInput(recommended);
    setLastValidOrderInput(recommended);
    setStatus({
      tone: 'info',
      message: `PDF ready (${totalPages} pages). Update page order if needed.`,
    });
    setIsDropZoneCollapsed(true);
  }

  function applyOrderInput(
    nextValue: string,
    options?: { preserveInputState?: boolean; revertOnError?: boolean; updateStatusOnError?: boolean }
  ): void {
    if (!pageCount || pageCount < 1) {
      setOrderInput(nextValue);
      return;
    }

    const preserveInputState = options?.preserveInputState ?? false;
    const revertOnError = options?.revertOnError ?? false;
    const updateStatusOnError = options?.updateStatusOnError ?? false;
    const cleaned = nextValue.trim();

    if (!cleaned) {
      setOrderInput('');
      setLastValidOrderInput('');
      setPageOrderSelection([]);
      return;
    }

    try {
      const pageOrder = parsePageOrder(cleaned, pageCount);
      const normalized = formatPageOrder(pageOrder);
      isSyncingFromGalleryRef.current = preserveInputState;
      setPageOrderSelection(pageOrder);
      setOrderInput(preserveInputState ? normalized : nextValue);
      setLastValidOrderInput(preserveInputState ? normalized : nextValue);
    } catch (error) {
      setOrderInput(nextValue);
      if (revertOnError) {
        setOrderInput(lastValidOrderInput);
      }
      if (updateStatusOnError && error instanceof Error && cleaned) {
        setStatus({ tone: 'error', message: error.message });
      }
    }
  }

  function restoreOriginalOrder(): void {
    if (!pageCount || pageCount < 1) {
      return;
    }

    const nextOrder = buildDefaultPageOrder(pageCount);
    const nextInput = formatPageOrder(nextOrder);
    isSyncingFromGalleryRef.current = true;
    setPageOrderSelection(nextOrder);
    setOrderInput(nextInput);
    setLastValidOrderInput(nextInput);
    setStatus({ tone: 'info', message: 'Original order restored.' });
  }

  function clearPageOrder(): void {
    setOrderInput('');
    setLastValidOrderInput('');
    setPageOrderSelection([]);
    setStatus({ tone: 'info', message: 'Page order cleared.' });
  }

  function reorderGalleryPages(fromIndex: number, toIndex: number): void {
    setPageOrderSelection((current) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length ||
        fromIndex === toIndex
      ) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const nextInput = formatPageOrder(next);
      isSyncingFromGalleryRef.current = true;
      setOrderInput(nextInput);
      setLastValidOrderInput(nextInput);
      return next;
    });
  }

  async function handleReorder(): Promise<void> {
    if (!sourceFile) {
      setStatus({ tone: 'error', message: 'Select a PDF file before reordering pages.' });
      return;
    }
    if (!pageCount || pageCount < 1) {
      setStatus({ tone: 'error', message: 'Could not read PDF page count.' });
      return;
    }
    if (!parsedOrder.pageOrder || parsedOrder.pageOrder.length === 0) {
      setStatus({
        tone: 'error',
        message: parsedOrder.error ?? 'Enter a valid page order.',
      });
      return;
    }
    const pageOrder = parsedOrder.pageOrder;
    trackToolEvent('selection_made', 'reorder');

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
          error: 'reorder timeout: worker did not respond in time',
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
        type: 'reorder',
        payload: {
          file: fileBuffer,
          pageOrder,
        },
      });
    });

    let reordered: Uint8Array;
    if (!response.ok) {
      try {
        reordered = await reorderPdfPages(fileBuffer, pageOrder);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown reorder error';
        setStatus({ tone: 'error', message: `Reorder failed: ${reason}` });
        setIsProcessing(false);
        return;
      }
    } else {
      if (response.type !== 'reorder') {
        setStatus({ tone: 'error', message: 'Invalid worker response type for reorder.' });
        setIsProcessing(false);
        return;
      }
      reordered = response.payload.output;
    }

    setOutput({
      filename: buildReorderFilename(sourceFile.name),
      bytes: reordered,
      orderLabel: pageOrder.join(','),
    });
    setShowDownloadGate(false);
    setIsProcessing(false);
    setStatus({ tone: 'info', message: 'Reorder completed. Your PDF is ready to download.' });
    trackToolEvent('completed', 'reorder');
  }

  function handleReorderCtaClick(): void {
    trackToolEvent('started', 'reorder');
    void handleReorder();
  }

  function startNewReorder(): void {
    setSourceFile(null);
    setPageCount(null);
    setOrderInput('');
    setLastValidOrderInput('');
    setThumbnails([]);
    setPageOrderSelection([]);
    setIsDropZoneCollapsed(false);
    setOutput(null);
    setShowDownloadGate(false);
    setStatus({
      tone: 'neutral',
      message: 'Select one PDF file to start.',
    });
  }

  function handleDownloadCta(): void {
    setShowDownloadGate(true);
  }

  function handleConfirmDownload(): void {
    if (!output) {
      return;
    }
    saveBlob(output.filename, output.bytes);
    setShowDownloadGate(false);
  }

  function removeSourceFile(): void {
    setSourceFile(null);
    setPageCount(null);
    setOrderInput('');
    setLastValidOrderInput('');
    setThumbnails([]);
    setPageOrderSelection([]);
    setIsDropZoneCollapsed(false);
    setOutput(null);
    setShowDownloadGate(false);
    setStatus({
      tone: 'neutral',
      message: 'Select one PDF file to start.',
    });
  }

  const actionMessage =
    status.tone === 'error'
      ? status.message
      : isProcessing
        ? 'Processing happens locally in your browser. Timing depends on your device, browser, and available resources.'
        : parsedOrder.pageOrder && parsedOrder.pageOrder.length > 0
          ? 'Ready to reorder the PDF.'
          : 'Enter the full page order or drag thumbnails to rearrange pages.';
  const actionMessageClassName = status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted';

  return (
    <ToolLayout
      title='Reorder PDF pages online — fast, private, and local'
      description='Reorder PDF pages directly in your browser. No uploads. No accounts. Your files never leave your device.'
      trustLine='Free • No signup • Works in your browser'
      metaTitle='Reorder PDF Pages Online — Private, Local & Free | Filegap'
      metaDescription='Reorder PDF pages online for free with private local processing. Change page order directly in your browser with no uploads and no signup.'
      heroVariant='brand'
    >
      <Card id='reorder-pdf-tool'>
        <div className='space-y-7'>
          {!sourceFile ? (
            <DropZone
              onFilesSelected={(files) => void handleSourceSelected(files)}
              multiple={false}
              disabled={isProcessing}
              loadedFileName={null}
            />
          ) : isDropZoneCollapsed ? (
            <div className='flex w-full items-center gap-3 rounded-xl border border-ui-border/70 bg-ui-surface px-3 py-2.5 text-left transition hover:border-brand-primary/35 hover:bg-ui-bg'>
              <span className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ui-bg text-ui-muted'>
                <FileText className='h-4.5 w-4.5' />
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block truncate text-sm font-semibold text-ui-text'>{sourceFile.name}</span>
                <span className='block text-xs text-ui-muted'>
                  {formatFileSize(sourceFile.size)}
                  {pageCount ? ` • ${pageCount} pages` : ''}
                </span>
              </span>
              <button
                type='button'
                onClick={() => setIsDropZoneCollapsed(false)}
                aria-label='Show file picker'
                title='Show file picker'
                className='inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
              >
                <span className='hidden sm:inline'>Replace</span>
                <ChevronLeft className='h-4 w-4' />
              </button>
              <button
                type='button'
                onClick={removeSourceFile}
                aria-label='Remove file'
                title='Remove file'
                className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
              >
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
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

          {sourceFile ? (
            <section className='space-y-4'>
              <div className='space-y-1'>
                <h2 className='font-heading text-2xl font-semibold text-ui-text'>Set page order</h2>
                <p className='text-sm text-ui-muted'>
                  Enter the full order manually or drag thumbnails into the sequence you want.
                </p>
              </div>

              <div className='max-w-2xl'>
                <div className='min-w-0'>
                  <label
                    htmlFor='reorder-page-order'
                    className='mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'
                  >
                    Page order
                  </label>
                  <div className='relative'>
                    <input
                      id='reorder-page-order'
                      type='text'
                      value={orderInput}
                      onChange={(event) =>
                        applyOrderInput(event.target.value, {
                          preserveInputState: true,
                          revertOnError: false,
                          updateStatusOnError: false,
                        })
                      }
                      onBlur={() =>
                        applyOrderInput(orderInput, {
                          preserveInputState: true,
                          revertOnError: true,
                          updateStatusOnError: true,
                        })
                      }
                      placeholder='3, 1, 2, 4-6'
                      className='w-full rounded-xl border border-ui-border bg-ui-surface px-4 py-3.5 pr-12 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                    />
                    {orderInput.trim().length > 0 || pageOrderSelection.length > 0 ? (
                      <button
                        type='button'
                        onClick={clearPageOrder}
                        aria-label='Clear page order'
                        className='absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ui-muted transition hover:bg-ui-bg hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25 focus-visible:ring-offset-2'
                      >
                        <X className='h-4 w-4' />
                      </button>
                    ) : null}
                  </div>
                  <div className='mt-3 flex flex-wrap items-center gap-2'>
                    <button
                      type='button'
                      onClick={restoreOriginalOrder}
                      className='inline-flex items-center gap-1 rounded-lg border border-ui-border bg-ui-surface px-3 py-1.5 text-xs font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
                    >
                      <RotateCcw className='h-3.5 w-3.5' />
                      Original order
                    </button>
                  </div>
                </div>
              </div>

              <ReorderPageGallery
                thumbnails={thumbnails}
                pageOrder={pageOrderSelection}
                isLoading={isRenderingPreviews}
                previewLimit={MAX_PREVIEW_PAGES}
                totalPages={pageCount}
                emptyHint='Upload a PDF to enable local page previews. No pages are sent anywhere.'
                onReorder={reorderGalleryPages}
              />

              <div className='sticky bottom-4 z-10 pt-2'>
                <div className='flex flex-col gap-3 rounded-2xl border border-ui-border/80 bg-ui-surface/95 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold text-ui-text'>
                      {parsedOrder.pageOrder && parsedOrder.pageOrder.length > 0
                        ? `Ready to reorder ${parsedOrder.pageOrder.length} page${parsedOrder.pageOrder.length === 1 ? '' : 's'}`
                        : pageCount
                          ? `PDF ready (${pageCount} pages)`
                          : 'Preparing PDF'}
                    </p>
                    <div className='mt-2 flex flex-wrap items-center gap-2'>
                      <p className={actionMessageClassName}>{actionMessage}</p>
                      {orderPreviewLabel ? (
                        <span className='rounded-full border border-ui-border bg-ui-bg/70 px-3 py-1.5 text-xs font-semibold text-ui-muted shadow-sm'>
                          Order {orderPreviewLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {!output ? (
                    <Button onClick={handleReorderCtaClick} loading={isProcessing} disabled={!canReorder}>
                      Reorder PDF
                    </Button>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {output ? (
            <div className='space-y-3 rounded-2xl border border-brand-primary/35 bg-brand-primary/10 p-5'>
              <div>
                <div>
                  <p className='font-heading text-lg font-semibold text-ui-text'>Reorder completed</p>
                  <p className='text-sm text-ui-text/85'>Your reordered PDF is ready to download.</p>
                </div>
              </div>
              <div className='rounded-xl border border-ui-border bg-ui-surface px-3 py-2'>
                <p className='text-sm font-medium text-ui-text'>{output.filename}</p>
                <p className='text-xs text-ui-muted'>Order {output.orderLabel}</p>
              </div>
              <div className='mt-4 flex flex-wrap gap-3'>
                <Button onClick={handleDownloadCta}>Download PDF</Button>
                <button
                  type='button'
                  onClick={startNewReorder}
                  className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
                >
                  New reorder
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <ToolLandingSections
        {...REORDER_PAGE_CONTENT}
        seoSupplement={
          <>
            <p>
              You can also <a className='text-ui-text underline' href='/extract-pages'>extract pages</a>{' '}
              or <a className='text-ui-text underline' href='/split-pdf'>split PDF files</a>{' '}
              using other Filegap tools.
            </p>
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
