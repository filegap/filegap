import { useEffect, useMemo, useState } from 'react';

import { PDFDocument } from 'pdf-lib';

import { Card } from '../../components/ui/Card';
import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { logDebug, logError, logInfo, logWarn } from '../../lib/logging/logger';
import { parseSplitRanges, splitPdfByRanges, type SplitRangeSegment } from '../../adapters/pdfEngine';
import type { WorkerResponse } from '../../types';

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

export function SplitPdfPage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [rangeInput, setRangeInput] = useState('');
  const [outputs, setOutputs] = useState<SplitOutput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
    setRangeInput('');
    setStatus({ tone: 'info', message: 'Reading PDF metadata...' });

    logInfo('Split source file selected.', {
      fileName: file.name,
      bytes: file.size,
    });

    const totalPages = await getPdfPageCount(file);
    setPageCount(totalPages);
    if (!totalPages) {
      setStatus({
        tone: 'error',
        message: 'Could not read page count. Please select a valid PDF file.',
      });
      logWarn('Split source metadata unavailable.');
      return;
    }

    setStatus({
      tone: 'info',
      message: `PDF ready (${totalPages} pages). Enter split ranges like 1-3,4-7.`,
    });
    logDebug('Split source metadata loaded.', { pageCount: totalPages });
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

    setIsProcessing(true);
    setStatus({ tone: 'info', message: 'Processing locally in your browser...' });
    logInfo('Starting local split in browser.', {
      pageCount,
      ranges: parsedRanges.ranges.length,
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
      logWarn('Worker unavailable for split, falling back to main thread.', {
        reason: response.error,
      });
      try {
        outputBuffers = await splitPdfByRanges(fileBuffer, ranges);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown split error';
        setStatus({ tone: 'error', message: `Split failed: ${reason}` });
        setIsProcessing(false);
        logError('Split failed in main-thread fallback.', { reason });
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
    setIsProcessing(false);
    setStatus({
      tone: 'info',
      message: `Split completed. ${nextOutputs.length} PDF files are ready to download.`,
    });

    logInfo('Split completed successfully.', {
      outputs: nextOutputs.length,
    });
  }

  function handleDownloadAll(): void {
    outputs.forEach((output, index) => {
      setTimeout(() => saveBlob(output.filename, output.bytes), index * 150);
    });
    logInfo('Split download-all triggered.', { outputs: outputs.length });
  }

  function startNewSplit(): void {
    setSourceFile(null);
    setPageCount(null);
    setRangeInput('');
    setOutputs([]);
    setStatus({
      tone: 'neutral',
      message: 'Select one PDF file to start.',
    });
    logInfo('New split started.');
  }

  const statusClassName = status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted';

  return (
    <ToolLayout
      title='Split PDF'
      description='Split one PDF into multiple files directly in your browser. No uploads, no server processing.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-6'>
          <DropZone
            onFilesSelected={(files) => void handleSourceSelected(files)}
            multiple={false}
            disabled={isProcessing}
          />

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
            <h2 className='font-heading text-2xl font-semibold text-ui-text'>Split setup</h2>
            <p className='text-sm text-ui-muted'>
              Enter non-overlapping ranges to generate output parts. Example: 1-3,4,5-10.
            </p>
            <input
              type='text'
              value={rangeInput}
              onChange={(event) => setRangeInput(event.target.value)}
              placeholder='1-3,4-7,8-10'
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
              <Button onClick={() => void handleSplit()} loading={isProcessing}>
                Split PDF
              </Button>
            ) : null}
            <p className={statusClassName}>{status.message}</p>
          </div>

          {outputs.length > 0 ? (
            <div className='space-y-3 rounded-2xl border border-brand-primary/35 bg-brand-primary/10 p-5 shadow-[0_10px_24px_rgba(255,46,139,0.16)]'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <p className='font-heading text-lg font-semibold text-ui-text'>Split completed</p>
                  <p className='text-sm text-ui-text/85'>Your output files are ready to download.</p>
                </div>
                <div className='flex flex-wrap gap-3'>
                  <Button onClick={handleDownloadAll}>Download all</Button>
                  <button
                    type='button'
                    onClick={startNewSplit}
                    className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
                  >
                    New split
                  </button>
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
            </div>
          ) : null}
        </div>
      </Card>

      <section className='grid gap-6 md:grid-cols-2'>
        <Card>
          <h3 className='font-heading text-2xl font-semibold text-ui-text'>How it works</h3>
          <ol className='mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ui-muted'>
            <li>Select one PDF file.</li>
            <li>Enter page ranges for each output part (single pages supported, like 4).</li>
            <li>Split locally and download generated files.</li>
          </ol>
        </Card>

        <Card>
          <h3 className='font-heading text-2xl font-semibold text-ui-text'>Preview-ready foundation</h3>
          <ul className='mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ui-muted'>
            <li>Range parsing is isolated from UI controls.</li>
            <li>The same split segments can drive future visual page selection.</li>
            <li>No backend is required for this evolution path.</li>
          </ul>
        </Card>
      </section>
    </ToolLayout>
  );
}
