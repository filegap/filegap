import { useEffect, useMemo, useState } from 'react';

import { PDFDocument } from 'pdf-lib';

import { Card } from '../../components/ui/Card';
import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { logDebug, logError, logInfo, logWarn } from '../../lib/logging/logger';
import { extractPdfByRanges, parseSplitRanges, type SplitRangeSegment } from '../../adapters/pdfEngine';
import type { WorkerResponse } from '../../types';

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

    logInfo('Extract source file selected.', { fileName: file.name, bytes: file.size });

    const totalPages = await getPdfPageCount(file);
    setPageCount(totalPages);
    if (!totalPages) {
      setStatus({
        tone: 'error',
        message: 'Could not read page count. Please select a valid PDF file.',
      });
      logWarn('Extract source metadata unavailable.');
      return;
    }

    setStatus({
      tone: 'info',
      message: `PDF ready (${totalPages} pages). Enter pages to extract like 1-3,5,7-9.`,
    });
    logDebug('Extract source metadata loaded.', { pageCount: totalPages });
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

    setIsProcessing(true);
    setStatus({ tone: 'info', message: 'Processing locally in your browser...' });
    logInfo('Starting local extract in browser.', {
      pageCount,
      ranges: ranges.length,
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
      logWarn('Worker unavailable for extract, falling back to main thread.', {
        reason: response.error,
      });
      try {
        extracted = await extractPdfByRanges(fileBuffer, ranges);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown extract error';
        setStatus({ tone: 'error', message: `Extract failed: ${reason}` });
        setIsProcessing(false);
        logError('Extract failed in main-thread fallback.', { reason });
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
    logInfo('Extract completed successfully.');
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
    logInfo('New extract started.');
  }

  function handleDownloadCta(): void {
    setShowDownloadGate(true);
    logInfo('Pre-download modal opened for extract.');
  }

  function handleConfirmDownload(): void {
    if (!output) {
      return;
    }
    saveBlob(output.filename, output.bytes);
    setShowDownloadGate(false);
    logInfo('Extract download started.');
  }

  const statusClassName = status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted';

  return (
    <ToolLayout
      title='Extract PDF Pages'
      description='Extract selected pages from one PDF directly in your browser. No uploads, no server processing.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-6'>
          <DropZone
            onFilesSelected={(files) => void handleSourceSelected(files)}
            multiple={false}
            disabled={isProcessing}
          />

          <TrustNotice />

          <div className='space-y-2'>
            <h2 className='font-heading text-2xl font-semibold text-ui-text'>Uploaded files</h2>
            {!sourceFile ? (
              <p className='text-sm text-ui-muted'>No files selected yet.</p>
            ) : (
              <div className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3'>
                <p className='text-sm font-medium text-ui-text'>{sourceFile.name}</p>
                <p className='text-xs text-ui-muted'>
                  {Math.max(1, Math.round(sourceFile.size / 1024))} KB
                  {pageCount ? ` · ${pageCount} pages` : ''}
                </p>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <h2 className='font-heading text-2xl font-semibold text-ui-text'>Page selection</h2>
            <p className='text-sm text-ui-muted'>
              Enter non-overlapping page ranges to keep. Example: 1-3,5,7-9.
            </p>
            <input
              type='text'
              value={rangeInput}
              onChange={(event) => setRangeInput(event.target.value)}
              placeholder='1-3,5,7-9'
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
              <Button onClick={() => void handleExtract()} loading={isProcessing}>
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

      <section className='grid gap-6 md:grid-cols-2'>
        <Card>
          <h3 className='font-heading text-2xl font-semibold text-ui-text'>How it works</h3>
          <ol className='mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ui-muted'>
            <li>Select one PDF file.</li>
            <li>Enter page ranges to keep.</li>
            <li>Extract locally and download the result.</li>
          </ol>
        </Card>

        <Card>
          <h3 className='font-heading text-2xl font-semibold text-ui-text'>Preview-ready foundation</h3>
          <ul className='mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ui-muted'>
            <li>Range parsing is isolated from UI controls.</li>
            <li>The same segments can power future visual page selection.</li>
            <li>All processing remains local in browser runtime.</li>
          </ul>
        </Card>
      </section>

      <PreDownloadModal
        open={showDownloadGate && Boolean(output)}
        title='Extract completed'
        description='PDFlo runs entirely in your browser. If it helps, support the project and share it with people who need truly private PDF tools.'
        confirmLabel='Continue to download'
        onConfirm={handleConfirmDownload}
        onClose={() => setShowDownloadGate(false)}
      />
    </ToolLayout>
  );
}
