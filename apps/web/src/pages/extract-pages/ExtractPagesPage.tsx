import { useEffect, useMemo, useState } from 'react';

import { PDFDocument } from 'pdf-lib';

import { Card } from '../../components/ui/Card';
import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { ToolLandingSections } from '../../components/seo/ToolLandingSections';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { UploadedFilesTable } from '../../components/ui/UploadedFilesTable';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { extractPdfByRanges, parseSplitRanges, type SplitRangeSegment } from '../../adapters/pdfEngine';
import { trackEvent, trackToolEvent } from '../../lib/analytics/trackEvent';
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

function getSelectedPagesCount(ranges: SplitRangeSegment[]): number {
  return ranges.reduce((total, range) => total + (range.end - range.start + 1), 0);
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
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [rangeInput, setRangeInput] = useState('');
  const [output, setOutput] = useState<ExtractOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    tone: 'neutral',
    message: 'Select one PDF file to start.',
  });

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

  useEffect(() => {
    return () => worker.terminate();
  }, [worker]);

  async function handleSourceSelected(files: File[]): Promise<void> {
    const file = files[0];
    if (!file) {
      return;
    }

    setSourceFile(file);
    setOutput(null);
    setShowDownloadGate(false);
    setRangeInput('');
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
    const selectedPagesCount = getSelectedPagesCount(ranges);
    trackToolEvent('selection_made', 'extract', { pages_count: selectedPagesCount });

    setIsProcessing(true);
    setStatus({ tone: 'info', message: 'Processing locally in your browser...' });

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
    trackToolEvent('completed', 'extract', { pages_count: selectedPagesCount });
  }

  function handleExtractCtaClick(): void {
    trackToolEvent('started', 'extract', { ranges_count: parsedRanges.ranges?.length ?? 0 });
    void handleExtract();
  }

  function startNewExtract(): void {
    setSourceFile(null);
    setPageCount(null);
    setRangeInput('');
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

  const statusClassName = status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted';
  const uploadedFiles = sourceFile
    ? [
        {
          id: 'source',
          filename: sourceFile.name,
          sizeBytes: sourceFile.size,
          pages: pageCount,
          pagesStatus: pageCount ? 'ready' : 'error',
        } as const,
      ]
    : [];

  return (
    <ToolLayout
      title='Extract PDF pages online — fast, private, and local'
      description='Extract pages from PDF files directly in your browser. No uploads. No accounts. Your files never leave your device.'
      trustLine='Free • No signup • Works in your browser'
      metaTitle='Extract PDF Pages Online — Private, Local & Free | Filegap'
      metaDescription='Extract PDF pages online for free with private local processing. Keep only the pages you need directly in your browser with no uploads and no signup.'
      heroVariant='brand'
    >
      <Card id='extract-pdf-tool'>
        <div className='space-y-6'>
          <DropZone
            onFilesSelected={(files) => void handleSourceSelected(files)}
            multiple={false}
            disabled={isProcessing}
            loadedFileName={sourceFile?.name ?? null}
          />

          <TrustNotice />

          <UploadedFilesTable
            files={uploadedFiles}
            reorderable={false}
            onRemove={() => removeSourceFile()}
          />

          <div className='space-y-2'>
            <h2 className='font-heading text-2xl font-semibold text-ui-text'>Page selection</h2>
            <p className='text-sm text-ui-muted'>
              Enter non-overlapping page ranges to keep in the new PDF. Example: 1-3, 5, 7-9.
            </p>
            <input
              type='text'
              value={rangeInput}
              onChange={(event) => setRangeInput(event.target.value)}
              placeholder='e.g. 1-3, 5, 7-9'
              className='w-full rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
            />
            {parsedRanges.ranges ? (
              <div className='flex flex-wrap gap-2'>
                {parsedRanges.ranges.map((range) => (
                  <span
                    key={`${range.start}-${range.end}`}
                    className='rounded-md border border-ui-border bg-ui-bg px-2 py-1 text-xs text-ui-muted'
                  >
                    {formatRangeLabel(range)}
                  </span>
                ))}
              </div>
            ) : null}
            {parsedRanges.error && rangeInput.trim() ? (
              <p className='text-xs font-medium text-red-600'>{parsedRanges.error}</p>
            ) : null}
          </div>

          <div className='flex flex-wrap items-center gap-4'>
            {!output ? (
              <Button onClick={handleExtractCtaClick} loading={isProcessing}>
                Extract pages
              </Button>
            ) : null}
            <p className={statusClassName}>{status.message}</p>
          </div>

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
        </div>
      </Card>

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
