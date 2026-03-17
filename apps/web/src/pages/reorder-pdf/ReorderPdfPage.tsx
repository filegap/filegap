import { useEffect, useMemo, useState } from 'react';

import { PDFDocument } from 'pdf-lib';

import { Card } from '../../components/ui/Card';
import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { ToolLandingSections } from '../../components/seo/ToolLandingSections';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { logDebug, logError, logInfo, logWarn } from '../../lib/logging/logger';
import { parsePageOrder, reorderPdfPages } from '../../adapters/pdfEngine';
import type { WorkerResponse } from '../../types';

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
  const [output, setOutput] = useState<ReorderOutput | null>(null);
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
    setOrderInput('');
    setStatus({ tone: 'info', message: 'Reading PDF metadata...' });

    logInfo('Reorder source file selected.', { fileName: file.name, bytes: file.size });

    const totalPages = await getPdfPageCount(file);
    setPageCount(totalPages);
    if (!totalPages) {
      setStatus({
        tone: 'error',
        message: 'Could not read page count. Please select a valid PDF file.',
      });
      logWarn('Reorder source metadata unavailable.');
      return;
    }

    const recommended = Array.from({ length: totalPages }, (_, index) => index + 1).join(',');
    setOrderInput(recommended);
    setStatus({
      tone: 'info',
      message: `PDF ready (${totalPages} pages). Update page order if needed.`,
    });
    logDebug('Reorder source metadata loaded.', { pageCount: totalPages });
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

    setIsProcessing(true);
    setStatus({ tone: 'info', message: 'Processing locally in your browser...' });
    logInfo('Starting local reorder in browser.', { pageCount, pageOrderLength: pageOrder.length });

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
      logWarn('Worker unavailable for reorder, falling back to main thread.', {
        reason: response.error,
      });
      try {
        reordered = await reorderPdfPages(fileBuffer, pageOrder);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown reorder error';
        setStatus({ tone: 'error', message: `Reorder failed: ${reason}` });
        setIsProcessing(false);
        logError('Reorder failed in main-thread fallback.', { reason });
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
    logInfo('Reorder completed successfully.');
  }

  function startNewReorder(): void {
    setSourceFile(null);
    setPageCount(null);
    setOrderInput('');
    setOutput(null);
    setShowDownloadGate(false);
    setStatus({
      tone: 'neutral',
      message: 'Select one PDF file to start.',
    });
    logInfo('New reorder started.');
  }

  function handleDownloadCta(): void {
    setShowDownloadGate(true);
    logInfo('Pre-download modal opened for reorder.');
  }

  function handleConfirmDownload(): void {
    if (!output) {
      return;
    }
    saveBlob(output.filename, output.bytes);
    setShowDownloadGate(false);
    logInfo('Reorder download started.');
  }

  const statusClassName = status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted';

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
        <div className='space-y-6'>
          <DropZone
            onFilesSelected={(files) => void handleSourceSelected(files)}
            multiple={false}
            disabled={isProcessing}
            loadedFileName={sourceFile?.name ?? null}
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
            <h2 className='font-heading text-2xl font-semibold text-ui-text'>Page order</h2>
            <p className='text-sm text-ui-muted'>
              Enter the full page order exactly once. Example: 3, 1, 2, 4-6.
            </p>
            <input
              type='text'
              value={orderInput}
              onChange={(event) => setOrderInput(event.target.value)}
              placeholder='e.g. 3, 1, 2, 4-6'
              className='w-full rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
            />
            {parsedOrder.pageOrder ? (
              <div className='rounded-md border border-ui-border bg-ui-bg px-2 py-1 text-xs text-ui-muted'>
                Final order: {parsedOrder.pageOrder.join(',')}
              </div>
            ) : null}
            {parsedOrder.error && orderInput.trim() ? (
              <p className='text-xs font-medium text-red-600'>{parsedOrder.error}</p>
            ) : null}
          </div>

          <div className='flex flex-wrap items-center gap-4'>
            {!output ? (
              <Button onClick={() => void handleReorder()} loading={isProcessing}>
                Reorder PDF
              </Button>
            ) : null}
            <p className={statusClassName}>{status.message}</p>
          </div>

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
          <p>
            You can also <a className='text-ui-text underline' href='/extract-pages'>extract pages</a>{' '}
            or <a className='text-ui-text underline' href='/split-pdf'>split PDF files</a>{' '}
            using other Filegap tools.
          </p>
        }
      />

      <PreDownloadModal
        open={showDownloadGate && Boolean(output)}
        title='Reorder completed'
        description='Filegap runs entirely in your browser. If it helps, support the project and share it with people who need private PDF tools that run locally.'
        confirmLabel='Continue to download'
        onConfirm={handleConfirmDownload}
        onClose={() => setShowDownloadGate(false)}
      />
    </ToolLayout>
  );
}
