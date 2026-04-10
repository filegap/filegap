import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PDFDocument } from 'pdf-lib';
import { ChevronsDownUp } from 'lucide-react';

import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { CliPreviewCard } from '../../components/ui/CliPreviewCard';
import { FileSelectionSummary } from '../../components/ui/FileSelectionSummary';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { SimpleProcessFlow } from '../../components/ui/SimpleProcessFlow';
import { ToolActionCard } from '../../components/layout/ToolActionCard';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { ToolLandingSections } from '../../components/seo/ToolLandingSections';
import { compressPdfBuffer, type CompressPreset } from '../../adapters/pdfEngine';
import { trackEvent, trackToolEvent } from '../../lib/analytics/trackEvent';
import { createWorkflowStep, type WorkflowBuilderNavigationState } from '../../lib/workflowBuilder';
import type { WorkerResponse } from '../../types';

// ⚠️ Do not log user file data. This project is privacy-first.
type StatusTone = 'neutral' | 'info' | 'error';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type CompressOutput = {
  filename: string;
  bytes: Uint8Array;
  sourceSizeBytes: number;
  outputSizeBytes: number;
  preset: CompressPreset;
  meaningfulReduction: boolean;
};

const MAX_WEB_COMPRESS_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const COMPRESS_PAGE_CONTENT = {
  howItWorksTitle: 'How to compress a PDF',
  howItWorksSteps: [
    'Upload one PDF file from your device.',
    'Choose a compression preset.',
    'Click “Compress PDF” and download the processed file.',
  ],
  whyTitle: 'Why use this Compress PDF tool',
  whyItems: [
    {
      title: 'No file uploads',
      text: 'Your PDF remains on your device. No server-side processing.',
    },
    {
      title: 'Preset-based workflow',
      text: 'Use low, balanced, or strong presets for local structural compression in-browser.',
    },
    {
      title: 'Desktop fallback for heavier files',
      text: 'For larger documents or stronger compression needs, use the desktop app.',
    },
    {
      title: 'Automation ready',
      text: 'Use Filegap via CLI or desktop app for batch processing and offline workflows.',
    },
  ],
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'Does this compress tool upload my file?',
      answer: 'No. Compression runs locally in your browser and files are not uploaded.',
    },
    {
      question: 'Will compression always reduce the file size?',
      answer: 'Not always. Results depend on the original PDF structure and embedded content.',
    },
    {
      question: 'What do presets mean?',
      answer:
        'Low favors compatibility, while balanced and strong apply more structural compaction in-browser.',
    },
    {
      question: 'Is there a web file size limit?',
      answer: 'Yes. This web compress flow supports files up to 10 MB for stable local performance.',
    },
    {
      question: 'What if the file is too large?',
      answer: 'Use Filegap Desktop or CLI for larger files while keeping processing private and local.',
    },
    {
      question: 'Why can desktop reduce size much more than web?',
      answer:
        'Desktop uses deeper image recompression and downsampling. Web currently focuses on lighter structural compression.',
    },
  ],
  seoTitle: 'Compress PDF online with private local processing',
  seoParagraphs: [
    'Filegap lets you compress PDF files online without uploading them to external servers.',
    'Compression runs locally in your browser with clear presets and instant export.',
    'For larger files and heavier workflows, use Filegap Desktop or CLI for stronger local processing.',
  ],
  finalCtaTitle: 'Ready to compress your PDF?',
  finalCtaText: 'Start compressing now — local processing, no uploads.',
  finalCtaLabel: 'Compress PDF now',
  finalCtaHref: '#compress-pdf-tool',
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

function buildCompressFilename(baseFilename: string): string {
  const base = baseFilename.toLowerCase().endsWith('.pdf')
    ? baseFilename.slice(0, -4)
    : baseFilename;
  return `${base}-compressed.pdf`;
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

function getDelta(sourceSizeBytes: number, outputSizeBytes: number): string {
  if (!Number.isFinite(sourceSizeBytes) || sourceSizeBytes <= 0) {
    return `Output size ${formatFileSize(outputSizeBytes)}.`;
  }
  const delta = sourceSizeBytes - outputSizeBytes;
  const ratio = (Math.abs(delta) / sourceSizeBytes) * 100;
  const rounded = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(ratio);

  if (delta > 0) {
    return `${formatFileSize(delta)} smaller (${rounded}% reduction).`;
  }
  if (delta < 0) {
    return `${formatFileSize(Math.abs(delta))} larger (${rounded}% increase).`;
  }
  return 'No size change detected.';
}

function hasMeaningfulReduction(sourceSizeBytes: number, outputSizeBytes: number): boolean {
  if (!Number.isFinite(sourceSizeBytes) || sourceSizeBytes <= 0) {
    return false;
  }
  const ratio = (sourceSizeBytes - outputSizeBytes) / sourceSizeBytes;
  return ratio >= 0.02;
}

function getSummary(sourceSizeBytes: number, outputSizeBytes: number): {
  badge: string;
  badgeClassName: string;
  headline: string;
} {
  if (!Number.isFinite(sourceSizeBytes) || sourceSizeBytes <= 0) {
    return { badge: 'Done', badgeClassName: 'bg-ui-bg text-ui-muted border-ui-border', headline: 'Compression completed' };
  }

  const delta = sourceSizeBytes - outputSizeBytes;
  const ratio = (Math.abs(delta) / sourceSizeBytes) * 100;
  const rounded = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(ratio);

  if (delta > 0) {
    return { badge: 'Reduced', badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200', headline: `${rounded}% smaller` };
  }
  if (delta < 0) {
    return { badge: 'Larger', badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200', headline: `${rounded}% larger` };
  }
  return { badge: 'No change', badgeClassName: 'bg-ui-bg text-ui-muted border-ui-border', headline: '0% change' };
}

function presetLabel(preset: CompressPreset): string {
  if (preset === 'low') {
    return 'Low';
  }
  if (preset === 'strong') {
    return 'Strong';
  }
  return 'Balanced';
}

export function CompressPdfPage() {
  const navigate = useNavigate();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [preset, setPreset] = useState<CompressPreset>('balanced');
  const [output, setOutput] = useState<CompressOutput | null>(null);
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Select one PDF file to start.' });
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

  const canCompress = Boolean(sourceFile) && !isProcessing;
  const sizeLimitLabel = formatFileSize(MAX_WEB_COMPRESS_FILE_SIZE_BYTES);
  const limitExceeded = limitExceededFileSize !== null;
  const summary = output ? getSummary(output.sourceSizeBytes, output.outputSizeBytes) : null;
  const cliPreview = useMemo(() => {
    if (sourceFile) {
      return `filegap compress "${sourceFile.name}" --preset ${preset} > ${buildCompressFilename(sourceFile.name)}`;
    }
    return 'filegap compress "input.pdf" --preset balanced > compressed.pdf';
  }, [preset, sourceFile]);

  async function handleSourceSelected(files: File[]): Promise<void> {
    const file = files[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_WEB_COMPRESS_FILE_SIZE_BYTES) {
      setSourceFile(null);
      setPageCount(null);
      setOutput(null);
      setShowDownloadGate(false);
      setIsDropZoneCollapsed(false);
      setLimitExceededFileSize(file.size);
      setStatus({
        tone: 'error',
        message: `Web compress supports files up to ${sizeLimitLabel}. Use the desktop app for larger PDFs.`,
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

    setStatus({ tone: 'info', message: `PDF ready (${totalPages} pages).` });
  }

  async function handleCompress(): Promise<void> {
    if (!sourceFile) {
      setStatus({ tone: 'error', message: 'Select one PDF file before compressing.' });
      return;
    }

    trackToolEvent('selection_made', 'compress');
    setIsProcessing(true);
    setStatus({
      tone: 'info',
      message: 'Processing locally in your browser... Time may vary based on file size and device performance.',
    });

    const fileBuffer = await fileToArrayBuffer(sourceFile);

    const response = await new Promise<WorkerResponse>((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ ok: false, error: 'compress timeout: worker did not respond in time' });
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
        resolve({ ok: false, error: event.message || 'worker error' });
      };

      worker.onmessageerror = () => {
        cleanup();
        resolve({ ok: false, error: 'worker message error' });
      };

      worker.postMessage({
        type: 'compress',
        payload: { file: fileBuffer, preset },
      });
    });

    let compressed: Uint8Array;
    if (!response.ok) {
      try {
        compressed = await compressPdfBuffer(fileBuffer, preset);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown compress error';
        setStatus({ tone: 'error', message: `Compress failed: ${reason}` });
        setIsProcessing(false);
        return;
      }
    } else {
      if (response.type !== 'compress') {
        setStatus({ tone: 'error', message: 'Invalid worker response type for compress.' });
        setIsProcessing(false);
        return;
      }
      compressed = response.payload.output;
    }

    setOutput({
      filename: buildCompressFilename(sourceFile.name),
      bytes: compressed,
      sourceSizeBytes: sourceFile.size,
      outputSizeBytes: compressed.byteLength,
      preset,
      meaningfulReduction: hasMeaningfulReduction(sourceFile.size, compressed.byteLength),
    });
    setShowDownloadGate(false);
    setIsProcessing(false);
    setStatus({ tone: 'info', message: 'Compress completed. Your PDF is ready to download.' });
    trackToolEvent('completed', 'compress');
  }

  function handleCompressCtaClick(): void {
    trackToolEvent('started', 'compress');
    void handleCompress();
  }

  function startNewCompress(): void {
    setSourceFile(null);
    setPageCount(null);
    setOutput(null);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(false);
    setLimitExceededFileSize(null);
    setPreset('balanced');
    setStatus({ tone: 'neutral', message: 'Select one PDF file to start.' });
  }

  function removeSourceFile(): void {
    setSourceFile(null);
    setPageCount(null);
    setOutput(null);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(false);
    setStatus({ tone: 'neutral', message: 'Select one PDF file to start.' });
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

    const compressStep = createWorkflowStep('compress');
    compressStep.compressionPreset = preset;

    const state: WorkflowBuilderNavigationState = {
      template: 'compress',
      draft: {
        inputMode: 'single',
        steps: [compressStep],
      },
      sourceFiles: [sourceFile],
    };

    navigate('/workflow-builder?template=compress', { state });
  }

  return (
    <ToolLayout
      title='Compress PDF online — private, local, and fast'
      description='Compress PDF files directly in your browser with privacy-first local processing.'
      trustLine='Free • No signup • Works in your browser'
      metaTitle='Compress PDF Online — Private, Local & Free | Filegap'
      metaDescription='Compress PDF files online for free with private local processing. Use local presets in your browser with no uploads and no signup.'
      heroVariant='brand'
    >
      <ToolActionCard id='compress-pdf-tool'>
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
              Selected file size: {formatFileSize(limitExceededFileSize ?? 0)}. Web compress supports up to {sizeLimitLabel} for stable local browser processing.
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
              <h2 className='font-heading text-2xl font-semibold text-ui-text'>Compress file</h2>
              <p className='text-sm text-ui-muted'>
                Compression runs locally and can reduce file size depending on PDF structure.
              </p>
            </div>

            <div className='max-w-xl space-y-2'>
              <label htmlFor='compress-preset' className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>
                Preset
              </label>
              <select
                id='compress-preset'
                value={preset}
                onChange={(event) => setPreset(event.target.value as CompressPreset)}
                className='w-full rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
              >
                <option value='low'>Low (better compatibility)</option>
                <option value='balanced'>Balanced</option>
                <option value='strong'>Strong (structural compaction)</option>
              </select>
              <p className='text-sm text-ui-muted'>
                For stronger compression outcomes, prefer desktop app workflows.
              </p>
            </div>

            <div className='grid gap-3 rounded-xl border border-ui-border/70 bg-ui-surface p-4 sm:grid-cols-2 sm:items-center'>
              <div className='flex h-full flex-col justify-center'>
                <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Input size</p>
                <p className='mt-1 text-sm font-semibold text-ui-text'>{formatFileSize(sourceFile.size)}</p>
              </div>
              <div className='flex h-full flex-col justify-center'>
                <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Pages</p>
                <p className='mt-1 text-sm font-semibold text-ui-text'>{pageCount ?? '-'}</p>
              </div>
            </div>

            <section className='space-y-3'>
              <h2 className='font-heading text-xl font-semibold text-ui-text'>Processing steps</h2>
              <SimpleProcessFlow
                description='Runs locally on your files.'
                steps={['Input', 'Compress', 'Output']}
                activeStepIndex={1}
                showTitle={false}
                secondaryActionLabel='Open in Workflow Builder'
                secondaryActionOnClick={openInWorkflowBuilder}
                onSecondaryActionClick={() => trackEvent('selection_made', { tool: 'compress' })}
              />
            </section>

            {!output ? (
              <div className='sticky bottom-4 z-10 pt-2'>
                <div className='flex flex-col gap-3 rounded-2xl border border-ui-border/80 bg-ui-surface/95 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold text-ui-text'>
                      {canCompress ? 'Ready to compress this PDF' : 'Preparing PDF'}
                    </p>
                    <p className={status.tone === 'error' ? 'mt-2 text-sm text-red-600' : 'mt-2 text-sm text-ui-muted'}>
                      {status.tone === 'error'
                        ? status.message
                        : 'Processing happens locally in your browser. For strongest compression outcomes, prefer desktop app workflows.'}
                    </p>
                  </div>
                  <Button onClick={handleCompressCtaClick} loading={isProcessing} disabled={!canCompress}>
                    Compress PDF
                  </Button>
                  </div>
                </div>
              ) : null}

            {!output ? (
              <section className='space-y-3'>
                <h2 className='font-heading text-xl font-semibold text-ui-text'>CLI preview</h2>
                <CliPreviewCard
                  command={cliPreview}
                  helperText='Run the same compression from your terminal.'
                  learnHref='/cli?example=compress'
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
              <p className='font-heading text-lg font-semibold text-ui-text'>Compress completed</p>
              <p className='text-sm text-ui-text/85'>Your compressed PDF is ready to download.</p>
            </div>

            <div className='rounded-xl border border-ui-border bg-ui-surface p-4'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${summary?.badgeClassName ?? 'bg-ui-bg text-ui-muted border-ui-border'}`}>
                  {summary?.badge ?? 'Done'}
                </span>
                <p className='text-sm font-medium text-ui-muted'>Preset: {presetLabel(output.preset)}</p>
              </div>

              <p className='mt-2 font-heading text-3xl font-bold leading-tight text-ui-text'>
                {summary?.headline ?? 'Compression completed'}
              </p>
              <p className='mt-1 text-sm text-ui-muted'>{getDelta(output.sourceSizeBytes, output.outputSizeBytes)}</p>

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

            {!output.meaningfulReduction ? (
              <div className='rounded-xl border border-amber-400/45 bg-amber-50 p-4'>
                <p className='text-sm font-semibold text-ui-text'>
                  No meaningful reduction detected in web mode
                </p>
                <p className='mt-1.5 text-sm text-ui-text/85'>
                  This browser flow applies light structural compression only. For stronger results (like image
                  downsampling/re-encoding), use Filegap Desktop or CLI.
                </p>
                <div className='mt-3 flex flex-wrap gap-3'>
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
              </div>
            ) : null}

            <div className='mt-4 flex flex-wrap gap-3'>
              <Button onClick={() => setShowDownloadGate(true)}>Download PDF</Button>
              <button
                type='button'
                onClick={startNewCompress}
                className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
              >
                New compress
              </button>
            </div>
          </div>
        ) : null}
      </ToolActionCard>

      <ToolLandingSections
        {...COMPRESS_PAGE_CONTENT}
        seoSupplement={
          <>
            <p>
              You can also <a className='text-ui-text underline' href='/optimize-pdf'>optimize PDF files</a>{' '}
              and <a className='text-ui-text underline' href='/reorder-pdf'>reorder pages</a> directly on web.
            </p>
            <div className='pt-1'>
              <h3 className='text-base font-semibold text-ui-text'>Need stronger compression workflows?</h3>
              <p className='mt-1.5 text-sm text-ui-muted'>
                Use Filegap Desktop or CLI for larger files and heavier processing while keeping everything local.
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
