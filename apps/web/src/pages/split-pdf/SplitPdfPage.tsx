import { useEffect, useMemo, useRef, useState } from 'react';

import { PDFDocument } from 'pdf-lib';
import { ChevronLeft, ChevronsDownUp, FileText, Trash2, X } from 'lucide-react';

import { Card } from '../../components/ui/Card';
import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { ToolLandingSections } from '../../components/seo/ToolLandingSections';
import { SplitPageGallery } from '../../components/ui/SplitPageGallery';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { parseSplitRanges, splitPdfByRanges, type SplitRangeSegment } from '../../adapters/pdfEngine';
import { trackEvent, trackToolEvent } from '../../lib/analytics/trackEvent';
import { renderPdfThumbnails, type PageThumbnail } from '../../lib/pdfPreview';
import type { WorkerResponse } from '../../types';

// ⚠️ Do not log user file data. This project is privacy-first.
type StatusTone = 'neutral' | 'info' | 'error';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type SplitOutput = {
  id: string;
  filename: string;
  bytes: Uint8Array;
  rangeLabel: string;
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

function buildSplitFilename(baseFilename: string, index: number, range: SplitRangeSegment): string {
  const base = baseFilename.toLowerCase().endsWith('.pdf')
    ? baseFilename.slice(0, -4)
    : baseFilename;
  return `${base}-part-${index + 1}-${range.start}-${range.end}.pdf`;
}

function formatRangeLabel(range: SplitRangeSegment): string {
  if (range.start === range.end) {
    return `${range.start}`;
  }
  return `${range.start}-${range.end}`;
}

function formatFileSize(sizeBytes: number): string {
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function buildSplitRangesFromStarts(starts: Set<number>, maxPage: number): SplitRangeSegment[] {
  if (maxPage <= 0) {
    return [];
  }

  const sortedStarts = [...starts]
    .filter((page) => page > 1 && page <= maxPage)
    .sort((a, b) => a - b);
  const effectiveStarts = [1, ...sortedStarts];
  const segments: SplitRangeSegment[] = [];

  for (let index = 0; index < effectiveStarts.length; index += 1) {
    const start = effectiveStarts[index];
    const nextStart = effectiveStarts[index + 1];
    const end = nextStart ? nextStart - 1 : maxPage;
    if (start <= end) {
      segments.push({ start, end });
    }
  }

  return segments;
}

function formatSplitRanges(ranges: SplitRangeSegment[]): string {
  return ranges.map(formatRangeLabel).join(',');
}

const SPLIT_PAGE_CONTENT = {
  howItWorksTitle: 'How to split PDF files',
  howItWorksSteps: [
    'Upload one PDF file from your device.',
    'Enter page ranges such as 1-3 or 4-7 to create separate PDF files.',
    'Click “Split PDF” and download your separate PDF files instantly.',
  ],
  whyTitle: 'Why use this Split PDF tool',
  whyItems: [
    {
      title: 'No file uploads',
      text: 'Your PDF is processed locally in your browser and never uploaded to any server.',
    },
    {
      title: 'Fast and flexible',
      text: 'Split large PDFs into multiple parts in seconds using custom page ranges.',
    },
    {
      title: 'Private by design',
      text: 'Your documents stay on your device throughout the entire process.',
    },
    {
      title: 'Automation ready',
      text: 'Use Filegap via CLI or desktop app for batch processing and offline workflows.',
    },
  ],
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'How do I split PDF files online?',
      answer:
        'Upload your PDF, enter ranges like 1-3,4-7, and click “Split PDF” to generate separate files.',
    },
    {
      question: 'Is it safe to split PDF files with Filegap?',
      answer: 'Yes. All processing happens locally in your browser. Your files are never uploaded.',
    },
    {
      question: 'Can I split a PDF without uploading it?',
      answer:
        'Yes. Filegap processes your PDF locally in your browser, so your file is never uploaded to a server.',
    },
    {
      question: 'Can I split PDF files for free?',
      answer: 'Yes. You can split PDF files for free with no signup required.',
    },
    {
      question: 'Is there a file size limit?',
      answer: 'Limits depend on your device performance because processing happens locally.',
    },
  ],
  seoTitle: 'Split PDF files quickly and securely',
  seoParagraphs: [
    'Filegap helps you split PDF files online without sending them to a server. Everything runs locally in your browser without installing software, which makes it a safer option for sensitive documents.',
    'You can define custom ranges, generate multiple output files, and download them immediately after processing.',
    'Whether you need to split PDFs for work, study, or personal tasks, Filegap gives you a fast, private, and free tool directly in your browser.',
  ],
  finalCtaTitle: 'Ready to split your PDF?',
  finalCtaText: 'Start splitting your PDF files now — no uploads, no signup.',
  finalCtaLabel: 'Split your PDF now',
  finalCtaHref: '#split-pdf-tool',
};

export function SplitPdfPage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [rangeInput, setRangeInput] = useState('');
  const [lastValidRangeInput, setLastValidRangeInput] = useState('');
  const [outputs, setOutputs] = useState<SplitOutput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingPreviews, setIsRenderingPreviews] = useState(false);
  const [isDropZoneCollapsed, setIsDropZoneCollapsed] = useState(false);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [splitStartPages, setSplitStartPages] = useState<Set<number>>(new Set());
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
        error: error instanceof Error ? error.message : 'Invalid split ranges.',
      };
    }
  }, [rangeInput, pageCount]);

  const canSplit =
    Boolean(sourceFile) &&
    Boolean(parsedRanges.ranges) &&
    (parsedRanges.ranges?.length ?? 0) > 0 &&
    !isProcessing;

  const rangeStartPages = useMemo(() => {
    const starts = new Set<number>();
    if (pageCount && pageCount > 0) {
      starts.add(1);
    }
    splitStartPages.forEach((page) => starts.add(page));
    return starts;
  }, [pageCount, splitStartPages]);

  const selectedRangesSummary = useMemo(() => {
    if (!parsedRanges.ranges || parsedRanges.ranges.length === 0) {
      return [];
    }
    return parsedRanges.ranges;
  }, [parsedRanges.ranges]);

  useEffect(() => {
    return () => worker.terminate();
  }, [worker]);

  useEffect(() => {
    if (!sourceFile || !pageCount || pageCount < 1) {
      setThumbnails([]);
      setSplitStartPages(new Set());
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
          message: `PDF ready (${pageCount} pages). Preview unavailable, but splitting still works locally.`,
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

    const ranges = formatSplitRanges(buildSplitRangesFromStarts(splitStartPages, pageCount ?? 0));
    setRangeInput(ranges);
    setLastValidRangeInput(ranges);
  }, [pageCount, splitStartPages]);

  async function handleSourceSelected(files: File[]): Promise<void> {
    const file = files[0];
    if (!file) {
      return;
    }

    setSourceFile(file);
    setOutputs([]);
    setShowDownloadGate(false);
    setRangeInput('');
    setLastValidRangeInput('');
    setSplitStartPages(new Set());
    setThumbnails([]);
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

    setStatus({
      tone: 'info',
      message: `PDF ready (${totalPages} pages). Enter split ranges like 1-3,4-7.`,
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
      setSplitStartPages(new Set());
      return;
    }

    try {
      const ranges = parseSplitRanges(cleaned, pageCount);
      const starts = new Set<number>(ranges.map((range) => range.start).filter((page) => page > 1));
      const normalized = formatSplitRanges(ranges);
      isSyncingFromSelectionRef.current = preserveInputState;
      setSplitStartPages(starts);
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
    if (pageNumber <= 1) {
      return;
    }

    setSplitStartPages((current) => {
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
    setSplitStartPages(new Set());
    setStatus({ tone: 'info', message: 'Split ranges cleared.' });
  }

  async function handleSplit(): Promise<void> {
    if (!sourceFile) {
      setStatus({ tone: 'error', message: 'Select a PDF file before splitting.' });
      return;
    }
    if (!pageCount || pageCount < 1) {
      setStatus({ tone: 'error', message: 'Could not read PDF page count.' });
      return;
    }
    if (!parsedRanges.ranges || parsedRanges.ranges.length === 0) {
      setStatus({
        tone: 'error',
        message: parsedRanges.error ?? 'Enter at least one split range.',
      });
      return;
    }
    const ranges = parsedRanges.ranges;
    trackToolEvent('selection_made', 'split');

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
          error: 'split timeout: worker did not respond in time',
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
        type: 'split',
        payload: {
          file: fileBuffer,
          ranges,
        },
      });
    });

    let outputBuffers: Uint8Array[] = [];
    if (!response.ok) {
      try {
        outputBuffers = await splitPdfByRanges(fileBuffer, ranges);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown split error';
        setStatus({ tone: 'error', message: `Split failed: ${reason}` });
        setIsProcessing(false);
        return;
      }
    } else {
      if (response.type !== 'split') {
        setStatus({ tone: 'error', message: 'Invalid worker response type for split.' });
        setIsProcessing(false);
        return;
      }
      outputBuffers = response.payload.outputs;
    }

    const nextOutputs: SplitOutput[] = outputBuffers.map((bytes, index) => ({
      id: `output-${index}`,
      filename: buildSplitFilename(sourceFile.name, index, ranges[index]),
      bytes,
      rangeLabel: formatRangeLabel(ranges[index]),
    }));
    setOutputs(nextOutputs);
    setShowDownloadGate(false);
    setIsProcessing(false);
    setStatus({
      tone: 'info',
      message: `Split completed. ${nextOutputs.length} PDF files are ready to download.`,
    });
    trackToolEvent('completed', 'split');
  }

  function handleSplitCtaClick(): void {
    trackToolEvent('started', 'split');
    void handleSplit();
  }

  function handleDownloadAll(): void {
    outputs.forEach((output, index) => {
      setTimeout(() => saveBlob(output.filename, output.bytes), index * 150);
    });
  }

  function handleDownloadCta(): void {
    setShowDownloadGate(true);
  }

  function handleConfirmDownload(): void {
    handleDownloadAll();
    setShowDownloadGate(false);
  }

  function startNewSplit(): void {
    setSourceFile(null);
    setPageCount(null);
    setRangeInput('');
    setLastValidRangeInput('');
    setSplitStartPages(new Set());
    setThumbnails([]);
    setIsDropZoneCollapsed(false);
    setOutputs([]);
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
    setSplitStartPages(new Set());
    setThumbnails([]);
    setIsDropZoneCollapsed(false);
    setOutputs([]);
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
      : selectedRangesSummary.length > 0
        ? `Ready to split into ${selectedRangesSummary.length} file${selectedRangesSummary.length === 1 ? '' : 's'}.`
        : 'Choose split ranges from the gallery or enter them above.';
  const actionMessageClassName = status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted';

  return (
    <ToolLayout
      title='Split PDF files online — fast, private, and local'
      description='Split PDF files into multiple documents directly in your browser. No uploads. No accounts. Your files never leave your device.'
      trustLine='Free • No signup • Works in your browser'
      metaTitle='Split PDF Files Online — Private, Local & Free | Filegap'
      metaDescription='Split PDF files online for free with private local processing. Create separate PDF files directly in your browser with no uploads and no signup.'
      heroVariant='brand'
    >
      <Card id='split-pdf-tool'>
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
                <h2 className='font-heading text-2xl font-semibold text-ui-text'>Define split ranges</h2>
                <p className='text-sm text-ui-muted'>
                  Enter ranges manually or click pages to mark where a new split should start.
                </p>
              </div>

              <div className='max-w-xl'>
                <div className='min-w-0'>
                  <label
                    htmlFor='split-page-ranges'
                    className='mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'
                  >
                    Split ranges
                  </label>
                  <div className='relative'>
                    <input
                      id='split-page-ranges'
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
                      placeholder='1-3, 4, 5-10'
                      className='w-full rounded-xl border border-ui-border bg-ui-surface px-4 py-3.5 pr-12 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                    />
                    {rangeInput.trim().length > 0 || splitStartPages.size > 0 ? (
                      <button
                        type='button'
                        onClick={clearPageRange}
                        aria-label='Clear split range'
                        className='absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ui-muted transition hover:bg-ui-bg hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25 focus-visible:ring-offset-2'
                      >
                        <X className='h-4 w-4' />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <SplitPageGallery
                thumbnails={thumbnails}
                selectedPages={splitStartPages}
                rangeStartPages={rangeStartPages}
                isLoading={isRenderingPreviews}
                previewLimit={MAX_PREVIEW_PAGES}
                totalPages={pageCount}
                emptyHint='Upload a PDF to enable local page previews. No pages are sent anywhere.'
                onTogglePage={toggleSelectedPage}
              />

              <div className='sticky bottom-4 z-10 pt-2'>
                <div className='flex flex-col gap-3 rounded-2xl border border-ui-border/80 bg-ui-surface/95 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold text-ui-text'>
                      {selectedRangesSummary.length > 0
                        ? `${selectedRangesSummary.length} split file${selectedRangesSummary.length === 1 ? '' : 's'} configured`
                        : pageCount
                          ? `PDF ready (${pageCount} pages)`
                          : 'Preparing PDF'}
                    </p>
                    <div className='mt-2 flex flex-wrap items-center gap-2'>
                      <p className={actionMessageClassName}>{actionMessage}</p>
                      {selectedRangesSummary.length > 0
                        ? selectedRangesSummary.map((range) => (
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
                  {outputs.length === 0 ? (
                    <Button onClick={handleSplitCtaClick} loading={isProcessing} disabled={!canSplit}>
                      Split PDF
                    </Button>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {outputs.length > 0 ? (
            <div className='space-y-3 rounded-2xl border border-brand-primary/35 bg-brand-primary/10 p-5'>
              <div>
                <div>
                  <p className='font-heading text-lg font-semibold text-ui-text'>Split completed</p>
                  <p className='text-sm text-ui-text/85'>Your output files are ready to download.</p>
                </div>
              </div>
              <ul className='space-y-2'>
                {outputs.map((output) => (
                  <li
                    key={output.id}
                    className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ui-border bg-ui-surface px-3 py-2'
                  >
                    <div>
                      <p className='text-sm font-medium text-ui-text'>{output.filename}</p>
                      <p className='text-xs text-ui-muted'>Pages {output.rangeLabel}</p>
                    </div>
                    <button
                      type='button'
                      onClick={() => saveBlob(output.filename, output.bytes)}
                      className='rounded-lg border border-ui-border px-3 py-2 text-xs font-semibold text-ui-text transition hover:bg-ui-bg'
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
              <div className='mt-4 flex flex-wrap gap-3'>
                <Button onClick={handleDownloadCta}>Download all</Button>
                <button
                  type='button'
                  onClick={startNewSplit}
                  className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
                >
                  New split
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <ToolLandingSections
        {...SPLIT_PAGE_CONTENT}
        seoSupplement={
          <>
            <p>
              You can also <a className='text-ui-text underline' href='/merge-pdf'>merge PDF files</a>{' '}
              or <a className='text-ui-text underline' href='/extract-pages'>extract specific pages</a>{' '}
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
        open={showDownloadGate && outputs.length > 0}
        onConfirm={handleConfirmDownload}
        onClose={() => setShowDownloadGate(false)}
      />
    </ToolLayout>
  );
}
