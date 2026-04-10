import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PDFDocument } from 'pdf-lib';
import { ChevronsDownUp, X } from 'lucide-react';

import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { CliPreviewCard } from '../../components/ui/CliPreviewCard';
import { ToolActionCard } from '../../components/layout/ToolActionCard';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { SimpleProcessFlow } from '../../components/ui/SimpleProcessFlow';
import { ToolLandingSections } from '../../components/seo/ToolLandingSections';
import { PdfPageGallery } from '../../components/ui/PdfPageGallery';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileSelectionSummary } from '../../components/ui/FileSelectionSummary';
import { extractPdfByRanges, parseSplitRanges, type SplitRangeSegment } from '../../adapters/pdfEngine';
import { trackEvent, trackToolEvent } from '../../lib/analytics/trackEvent';
import { renderPdfThumbnails, type PageThumbnail } from '../../lib/pdfPreview';
import { createWorkflowStep, type WorkflowBuilderNavigationState } from '../../lib/workflowBuilder';
import type { WorkerResponse } from '../../types';

// ⚠️ Do not log user file data. This project is privacy-first.
type StatusTone = 'neutral' | 'info' | 'error';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type ExtractOutput = {
  filename: string;
  bytes: Uint8Array;
  rangeLabel: string;
};

const MAX_PREVIEW_PAGES = 40;

function compactPagesToRanges(pages: number[]): string {
  if (pages.length === 0) {
    return '';
  }

  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    ranges.push(start === previous ? String(start) : `${start}-${previous}`);
    start = current;
    previous = current;
  }

  ranges.push(start === previous ? String(start) : `${start}-${previous}`);
  return ranges.join(',');
}

function rangesToPages(ranges: SplitRangeSegment[]): number[] {
  return ranges.flatMap((range) =>
    Array.from({ length: range.end - range.start + 1 }, (_, index) => range.start + index)
  );
}

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

function formatRangeLabel(range: SplitRangeSegment): string {
  return range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`;
}

function buildExtractFilename(baseFilename: string): string {
  const base = baseFilename.toLowerCase().endsWith('.pdf')
    ? baseFilename.slice(0, -4)
    : baseFilename;
  return `${base}-extracted.pdf`;
}

function formatFileSize(sizeBytes: number): string {
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

const EXTRACT_PAGE_CONTENT = {
  howItWorksTitle: 'How to extract pages from a PDF',
  howItWorksSteps: [
    'Upload one PDF file from your device.',
    'Enter page ranges such as 1-3 or 5-7 to keep only the pages you need.',
    'Click “Extract pages” and download your new PDF instantly.',
  ],
  whyTitle: 'Why use this Extract Pages tool',
  whyItems: [
    {
      title: 'No file uploads',
      text: 'Your PDF stays local and is never uploaded to any external server.',
    },
    {
      title: 'Keep only what you need',
      text: 'Extract specific pages from long PDFs and save a smaller, focused document.',
    },
    {
      title: 'Secure and private',
      text: 'All processing happens in your browser, so your files remain on your device.',
    },
    {
      title: 'Automation ready',
      text: 'Use Filegap via CLI or desktop app for batch processing and offline workflows.',
    },
  ],
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'How do I extract pages from a PDF online?',
      answer:
        'Upload your PDF, enter the page ranges you need, and click “Extract pages” to download a new file.',
    },
    {
      question: 'Is it safe to extract PDF pages with Filegap?',
      answer: 'Yes. Filegap processes files locally in your browser and never uploads them.',
    },
    {
      question: 'Can I extract PDF pages without uploading the file?',
      answer:
        'Yes. Filegap processes your PDF locally in your browser, so your file is never uploaded to a server.',
    },
    {
      question: 'Can I keep only certain pages from a PDF?',
      answer:
        'Yes. Enter the page ranges you want to keep, and Filegap will create a new PDF containing only those pages.',
    },
    {
      question: 'Can I extract PDF pages for free?',
      answer: 'Yes. You can use the Extract Pages tool for free without creating an account.',
    },
    {
      question: 'Is there a file size limit?',
      answer: 'Limits depend on your browser and device resources because processing is local.',
    },
  ],
  seoTitle: 'Extract PDF pages quickly and securely',
  seoParagraphs: [
    'Filegap lets you extract pages from PDF files online without uploading documents to a server. Everything runs fully in your browser without installing software, which makes it a better option for private or sensitive files.',
    'You can select exact page ranges, generate a clean output PDF, and keep only the pages you need before downloading the file.',
    'Whether you need specific pages for work, school, or personal use, Filegap offers a fast, private, and free way to extract PDF pages directly on your device.',
  ],
  finalCtaTitle: 'Ready to extract your pages?',
  finalCtaText: 'Start extracting PDF pages now — no uploads, no signup.',
  finalCtaLabel: 'Extract pages now',
  finalCtaHref: '#extract-pdf-tool',
};

export function ExtractPagesPage() {
  const navigate = useNavigate();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [rangeInput, setRangeInput] = useState('');
  const [lastValidRangeInput, setLastValidRangeInput] = useState('');
  const [output, setOutput] = useState<ExtractOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingPreviews, setIsRenderingPreviews] = useState(false);
  const [isDropZoneCollapsed, setIsDropZoneCollapsed] = useState(false);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    tone: 'neutral',
    message: 'Select one PDF file to start.',
  });
  const isSyncingFromSelectionRef = useRef(false);

  const worker = useMemo(
    () => new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' }),
    []
  );

  const parsedRanges = useMemo(() => {
    if (!rangeInput.trim() || !pageCount || pageCount < 1) {
      return { ranges: null as SplitRangeSegment[] | null, error: null as string | null };
    }
    try {
      return { ranges: parseSplitRanges(rangeInput, pageCount), error: null };
    } catch (error) {
      return {
        ranges: null,
        error: error instanceof Error ? error.message : 'Invalid page selection.',
      };
    }
  }, [rangeInput, pageCount]);

  const canExtract =
    Boolean(sourceFile) &&
    Boolean(parsedRanges.ranges) &&
    (parsedRanges.ranges?.length ?? 0) > 0 &&
    !isProcessing;
  const canClearPageRange = rangeInput.trim().length > 0 || selectedPages.size > 0;

  const selectedPagesSummary = useMemo(() => {
    if (selectedPages.size === 0) {
      return '';
    }

    const compact = compactPagesToRanges(Array.from(selectedPages));
    return compact.length > 32 ? `${compact.slice(0, 32)}...` : compact;
  }, [selectedPages]);

  const activePreset = useMemo(() => {
    if (!pageCount || pageCount < 1) {
      return null;
    }

    if (selectedPages.size === 0) {
      return null;
    }

    if (selectedPages.size === 1 && selectedPages.has(1)) {
      return 'first';
    }

    const allPages = Array.from({ length: pageCount }, (_, index) => index + 1);
    const hasAll = allPages.every((page) => selectedPages.has(page));
    if (hasAll) {
      return 'all';
    }

    const oddPages = allPages.filter((page) => page % 2 === 1);
    if (oddPages.length === selectedPages.size && oddPages.every((page) => selectedPages.has(page))) {
      return 'odd';
    }

    const evenPages = allPages.filter((page) => page % 2 === 0);
    if (evenPages.length === selectedPages.size && evenPages.every((page) => selectedPages.has(page))) {
      return 'even';
    }

    return null;
  }, [pageCount, selectedPages]);

  useEffect(() => {
    return () => worker.terminate();
  }, [worker]);

  useEffect(() => {
    if (!sourceFile || !pageCount || pageCount < 1) {
      setThumbnails([]);
      setSelectedPages(new Set());
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
          message: `PDF ready (${pageCount} pages). Preview unavailable, but extraction still works locally.`,
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
    if (isSyncingFromSelectionRef.current) {
      isSyncingFromSelectionRef.current = false;
      return;
    }

    const ranges = compactPagesToRanges(Array.from(selectedPages));
    setRangeInput(ranges);
    setLastValidRangeInput(ranges);
  }, [selectedPages]);

  async function handleSourceSelected(files: File[]): Promise<void> {
    const file = files[0];
    if (!file) {
      return;
    }

    setSourceFile(file);
    setOutput(null);
    setShowDownloadGate(false);
    setRangeInput('');
    setLastValidRangeInput('');
    setSelectedPages(new Set());
    setThumbnails([]);
    setIsDropZoneCollapsed(true);
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
      message: `PDF ready (${totalPages} pages). Enter pages to extract like 1-3,5,7-9.`,
    });
    setIsDropZoneCollapsed(true);
  }

  function applyRangesInput(
    nextValue: string,
    options?: { preserveInputState?: boolean; revertOnError?: boolean; updateStatusOnError?: boolean }
  ): void {
    if (!pageCount || pageCount < 1) {
      setRangeInput(nextValue);
      return;
    }

    const preserveInputState = options?.preserveInputState ?? false;
    const revertOnError = options?.revertOnError ?? false;
    const updateStatusOnError = options?.updateStatusOnError ?? false;
    const cleaned = nextValue.trim();

    if (!cleaned) {
      isSyncingFromSelectionRef.current = preserveInputState;
      setRangeInput('');
      setLastValidRangeInput('');
      setSelectedPages(new Set());
      return;
    }

    try {
      const ranges = parseSplitRanges(cleaned, pageCount);
      const normalized = ranges.map(formatRangeLabel).join(',');
      const pages = rangesToPages(ranges);
      isSyncingFromSelectionRef.current = preserveInputState;
      setSelectedPages(new Set(pages));
      setRangeInput(preserveInputState ? normalized : nextValue);
      setLastValidRangeInput(preserveInputState ? normalized : nextValue);
    } catch (error) {
      setRangeInput(nextValue);
      if (revertOnError) {
        setRangeInput(lastValidRangeInput);
      }
      if (updateStatusOnError && error instanceof Error && cleaned) {
        setStatus({ tone: 'error', message: error.message });
      }
    }
  }

  function toggleSelectedPage(pageNumber: number): void {
    setSelectedPages((current) => {
      const next = new Set(current);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  }

  function clearPageRange(): void {
    setRangeInput('');
    setLastValidRangeInput('');
    setSelectedPages(new Set());
    setStatus({ tone: 'info', message: 'Page selection cleared.' });
  }

  function selectPageGroup(mode: 'all' | 'odd' | 'even' | 'first' | 'none'): void {
    if (!pageCount || pageCount < 1) {
      return;
    }

    if (mode === 'none') {
      setSelectedPages(new Set());
      setStatus({ tone: 'info', message: 'Page selection cleared.' });
      return;
    }

    if (mode === 'first') {
      setSelectedPages(new Set([1]));
      setStatus({ tone: 'info', message: 'Selected first page.' });
      return;
    }

    const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((page) => {
      if (mode === 'all') {
        return true;
      }
      if (mode === 'odd') {
        return page % 2 === 1;
      }
      return page % 2 === 0;
    });

    setSelectedPages(new Set(pages));
    setStatus({
      tone: 'info',
      message:
        mode === 'all' ? 'Selected all pages.' : mode === 'odd' ? 'Selected odd pages.' : 'Selected even pages.',
    });
  }

  async function handleExtract(): Promise<void> {
    if (!sourceFile) {
      setStatus({ tone: 'error', message: 'Select a PDF file before extracting pages.' });
      return;
    }
    if (!pageCount || pageCount < 1) {
      setStatus({ tone: 'error', message: 'Could not read PDF page count.' });
      return;
    }
    if (!parsedRanges.ranges || parsedRanges.ranges.length === 0) {
      setStatus({
        tone: 'error',
        message: parsedRanges.error ?? 'Enter at least one page range.',
      });
      return;
    }
    const ranges = parsedRanges.ranges;
    trackToolEvent('selection_made', 'extract');

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
          error: 'extract timeout: worker did not respond in time',
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
        type: 'extract',
        payload: {
          file: fileBuffer,
          ranges,
        },
      });
    });

    let extracted: Uint8Array;
    if (!response.ok) {
      try {
        extracted = await extractPdfByRanges(fileBuffer, ranges);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown extract error';
        setStatus({ tone: 'error', message: `Extract failed: ${reason}` });
        setIsProcessing(false);
        return;
      }
    } else {
      if (response.type !== 'extract') {
        setStatus({ tone: 'error', message: 'Invalid worker response type for extract.' });
        setIsProcessing(false);
        return;
      }
      extracted = response.payload.output;
    }

    setOutput({
      filename: buildExtractFilename(sourceFile.name),
      bytes: extracted,
      rangeLabel: ranges.map(formatRangeLabel).join(','),
    });
    setShowDownloadGate(false);
    setIsProcessing(false);
    setStatus({ tone: 'info', message: 'Extract completed. Your PDF is ready to download.' });
    trackToolEvent('completed', 'extract');
  }

  function handleExtractCtaClick(): void {
    trackToolEvent('started', 'extract');
    void handleExtract();
  }

  function startNewExtract(): void {
    setSourceFile(null);
    setPageCount(null);
    setRangeInput('');
    setLastValidRangeInput('');
    setSelectedPages(new Set());
    setThumbnails([]);
    setIsDropZoneCollapsed(false);
    setOutput(null);
    setShowDownloadGate(false);
    setStatus({
      tone: 'neutral',
      message: 'Select one PDF file to start.',
    });
  }

  function removeSourceFile(): void {
    setSourceFile(null);
    setPageCount(null);
    setRangeInput('');
    setLastValidRangeInput('');
    setSelectedPages(new Set());
    setThumbnails([]);
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

  function openInWorkflowBuilder(): void {
    if (!sourceFile) {
      return;
    }

    const extractStep = createWorkflowStep('extract');
    const pageRanges = rangeInput.trim() || lastValidRangeInput.trim();
    if (pageRanges) {
      extractStep.pageRanges = pageRanges;
    }

    const state: WorkflowBuilderNavigationState = {
      template: 'extract',
      draft: {
        inputMode: 'single',
        steps: [extractStep],
      },
      sourceFiles: [sourceFile],
    };

    navigate('/workflow-builder?template=extract', { state });
  }

  const actionMessage =
    status.tone === 'error'
      ? status.message
      : isProcessing
        ? 'Processing happens locally in your browser. Timing depends on your device, browser, and available resources.'
      : selectedPages.size > 0
        ? 'Ready to extract the selected pages.'
        : 'Choose pages from the gallery or enter ranges above.';
  const actionMessageClassName = status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted';
  const cliPreview = useMemo(() => {
    const currentRanges = rangeInput.trim() || lastValidRangeInput.trim();
    if (sourceFile) {
      return `filegap extract "${sourceFile.name}" --pages "${currentRanges || '1-3'}" > ${buildExtractFilename(sourceFile.name)}`;
    }
    return 'filegap extract "input.pdf" --pages "1-3" > extracted.pdf';
  }, [lastValidRangeInput, rangeInput, sourceFile]);

  return (
    <ToolLayout
      title='Extract PDF pages online — fast, private, and local'
      description='Extract pages from PDF files directly in your browser. No account required.'
      trustLine='Free • No signup • Works in your browser'
      metaTitle='Extract PDF Pages Online — Private, Local & Free | Filegap'
      metaDescription='Extract PDF pages online for free with private local processing. Keep only the pages you need directly in your browser with no uploads and no signup.'
      heroVariant='brand'
    >
      <ToolActionCard id='extract-pdf-tool'>
          {!sourceFile ? (
            <DropZone
              onFilesSelected={(files) => void handleSourceSelected(files)}
              multiple={false}
              disabled={isProcessing}
              loadedFileName={null}
            />
          ) : isDropZoneCollapsed ? (
            <div className='animate-[fade-in_180ms_ease-out]'>
              <FileSelectionSummary
                label='Input file'
                filename={sourceFile.name}
                meta={`${formatFileSize(sourceFile.size)}${pageCount ? ` • ${pageCount} pages` : ''}`}
                onReplace={() => setIsDropZoneCollapsed(false)}
                onRemove={removeSourceFile}
              />
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
                <ChevronsDownUp className='h-4 w-4' />
              </button>
              <DropZone
                onFilesSelected={(files) => void handleSourceSelected(files)}
                multiple={false}
                disabled={isProcessing}
                loadedFileName={sourceFile?.name ?? null}
              />
            </div>
          )}

          {sourceFile ? (
            <section className='space-y-4'>
              <div className='space-y-1'>
                <h2 className='font-heading text-2xl font-semibold text-ui-text'>Select pages to extract</h2>
                <p className='text-sm text-ui-muted'>
                  Pick pages from the gallery or enter ranges directly. Everything stays on your device.
                </p>
              </div>

              <div className='max-w-xl'>
                <div className='min-w-0'>
                  <label
                    htmlFor='extract-page-ranges'
                    className='mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'
                  >
                    Page range
                  </label>
                  <div className='relative'>
                    <input
                      id='extract-page-ranges'
                      type='text'
                      value={rangeInput}
                      onChange={(event) =>
                        applyRangesInput(event.target.value, {
                          preserveInputState: true,
                          revertOnError: false,
                          updateStatusOnError: false,
                        })
                      }
                      onBlur={() =>
                        applyRangesInput(rangeInput, {
                          preserveInputState: true,
                          revertOnError: true,
                          updateStatusOnError: true,
                        })
                      }
                      placeholder='1-3, 5, 7-9'
                      className='w-full rounded-xl border border-ui-border bg-ui-surface px-4 py-3.5 pr-12 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                    />
                    {canClearPageRange ? (
                      <button
                        type='button'
                        onClick={clearPageRange}
                        aria-label='Clear page range'
                        className='absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ui-muted transition hover:bg-ui-bg hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25 focus-visible:ring-offset-2'
                      >
                        <X className='h-4 w-4' />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className='mt-3 flex w-full flex-wrap items-center gap-2.5'>
                  <div className='flex flex-wrap items-center gap-2.5'>
                    {[
                      { key: 'all', label: 'Select all', action: () => selectPageGroup('all') },
                      { key: 'odd', label: 'Odd', action: () => selectPageGroup('odd') },
                      { key: 'even', label: 'Even', action: () => selectPageGroup('even') },
                      { key: 'first', label: 'First page', action: () => selectPageGroup('first') },
                    ].map((action) => (
                      <button
                        key={action.key}
                        type='button'
                        onClick={action.action}
                        aria-pressed={activePreset === action.key}
                        disabled={!pageCount || isProcessing}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                          activePreset === action.key
                            ? 'border-ui-border bg-ui-bg text-ui-text shadow-sm'
                            : 'border-transparent bg-ui-bg/55 text-ui-muted hover:border-ui-border hover:bg-ui-surface hover:text-ui-text active:bg-ui-bg'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <PdfPageGallery
                thumbnails={thumbnails}
                selectedPages={selectedPages}
                isLoading={isRenderingPreviews}
                previewLimit={MAX_PREVIEW_PAGES}
                totalPages={pageCount}
                emptyHint='Upload a PDF to enable local page previews. No pages are sent anywhere.'
                onTogglePage={toggleSelectedPage}
              />

              <section className='space-y-3'>
                <h2 className='font-heading text-xl font-semibold text-ui-text'>Processing steps</h2>
                <SimpleProcessFlow
                  description='Runs locally on your files.'
                  steps={['Input', 'Extract', 'Output']}
                  activeStepIndex={1}
                  showTitle={false}
                  secondaryActionLabel='Open in Workflow Builder'
                  secondaryActionOnClick={openInWorkflowBuilder}
                  onSecondaryActionClick={() => trackEvent('selection_made', { tool: 'extract' })}
                />
              </section>

              <div className='sticky bottom-4 z-10 pt-2'>
                <div className='flex flex-col gap-3 rounded-2xl border border-ui-border/80 bg-ui-surface/95 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold text-ui-text'>
                      {selectedPages.size > 0
                        ? `${selectedPages.size} page${selectedPages.size === 1 ? '' : 's'} selected`
                        : pageCount
                          ? `PDF ready (${pageCount} pages)`
                          : 'Preparing PDF'}
                    </p>
                    <div className='mt-2 flex flex-wrap items-center gap-2'>
                      <p className={actionMessageClassName}>{actionMessage}</p>
                      {parsedRanges.ranges
                        ? parsedRanges.ranges.map((range) => (
                          <span
                            key={`${range.start}-${range.end}`}
                            className='rounded-full border border-ui-border bg-ui-bg/70 px-3 py-1.5 text-xs font-semibold text-ui-muted shadow-sm'
                          >
                            {formatRangeLabel(range)}
                          </span>
                        ))
                        : null}
                    </div>
                  </div>
                  {!output ? (
                    <Button onClick={handleExtractCtaClick} loading={isProcessing} disabled={!canExtract}>
                      Extract pages
                    </Button>
                  ) : null}
                </div>
              </div>

              {!output ? (
                <section className='space-y-3'>
                  <h2 className='font-heading text-xl font-semibold text-ui-text'>CLI preview</h2>
                  <CliPreviewCard
                    command={cliPreview}
                    helperText='Run the same extract step from your terminal.'
                    learnHref='/cli?example=extract'
                    learnLabel='Try the CLI →'
                    showTitle={false}
                  />
                </section>
              ) : null}
            </section>
          ) : null}

          {output ? (
            <div className='space-y-3 rounded-2xl border border-brand-primary/35 bg-brand-primary/10 p-5'>
              <div>
                <div>
                  <p className='font-heading text-lg font-semibold text-ui-text'>Extract completed</p>
                  <p className='text-sm text-ui-text/85'>Your extracted PDF is ready to download.</p>
                </div>
              </div>
              <div className='rounded-xl border border-ui-border bg-ui-surface px-3 py-2'>
                <p className='text-sm font-medium text-ui-text'>{output.filename}</p>
                <p className='text-xs text-ui-muted'>Pages {output.rangeLabel}</p>
              </div>
              <div className='mt-4 flex flex-wrap gap-3'>
                <Button onClick={handleDownloadCta}>Download PDF</Button>
                <button
                  type='button'
                  onClick={startNewExtract}
                  className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
                >
                  New extract
                </button>
              </div>
            </div>
          ) : null}
      </ToolActionCard>

      <ToolLandingSections
        {...EXTRACT_PAGE_CONTENT}
        seoSupplement={
          <>
            <p>
              You can also <a className='text-ui-text underline' href='/split-pdf'>split PDF files</a>{' '}
              or <a className='text-ui-text underline' href='/reorder-pdf'>reorder PDF pages</a>{' '}
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
