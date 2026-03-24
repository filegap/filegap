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
import { parseSplitRanges, splitPdfByRanges, type SplitRangeSegment } from '../../adapters/pdfEngine';
import { trackEvent, trackToolEvent } from '../../lib/analytics/trackEvent';
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

function getSelectedPagesCount(ranges: SplitRangeSegment[]): number {
  return ranges.reduce((total, range) => total + (range.end - range.start + 1), 0);
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
  const [outputs, setOutputs] = useState<SplitOutput[]>([]);
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
        error: error instanceof Error ? error.message : 'Invalid split ranges.',
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
    setOutputs([]);
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
      message: `PDF ready (${totalPages} pages). Enter split ranges like 1-3,4-7.`,
    });
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
    const selectedPagesCount = getSelectedPagesCount(ranges);
    trackToolEvent('selection_made', 'split', { pages_count: selectedPagesCount });

    setIsProcessing(true);
    setStatus({ tone: 'info', message: 'Processing locally in your browser...' });

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
    trackToolEvent('completed', 'split', {
      output_files_count: nextOutputs.length,
      pages_count: selectedPagesCount,
    });
  }

  function handleSplitCtaClick(): void {
    trackToolEvent('started', 'split', { ranges_count: parsedRanges.ranges?.length ?? 0 });
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
    setOutputs([]);
    setShowDownloadGate(false);
    setStatus({
      tone: 'neutral',
      message: 'Select one PDF file to start.',
    });
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
      title='Split PDF files online — fast, private, and local'
      description='Split PDF files into multiple documents directly in your browser. No uploads. No accounts. Your files never leave your device.'
      trustLine='Free • No signup • Works in your browser'
      metaTitle='Split PDF Files Online — Private, Local & Free | Filegap'
      metaDescription='Split PDF files online for free with private local processing. Create separate PDF files directly in your browser with no uploads and no signup.'
      heroVariant='brand'
    >
      <Card id='split-pdf-tool'>
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
            <h2 className='font-heading text-2xl font-semibold text-ui-text'>Split setup</h2>
            <p className='text-sm text-ui-muted'>
              Enter non-overlapping page ranges to create separate PDF files. Example: 1-3, 4, 5-10.
            </p>
            <input
              type='text'
              value={rangeInput}
              onChange={(event) => setRangeInput(event.target.value)}
              placeholder='e.g. 1-3, 4, 5-10'
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
            {outputs.length === 0 ? (
              <Button onClick={handleSplitCtaClick} loading={isProcessing}>
                Split PDF
              </Button>
            ) : null}
            <p className={statusClassName}>{status.message}</p>
          </div>

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
