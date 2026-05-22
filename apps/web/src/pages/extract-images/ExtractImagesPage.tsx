import { useEffect, useMemo, useState } from 'react';
import { ChevronsDownUp, Image as ImageIcon } from 'lucide-react';

import { ToolActionCard } from '../../components/layout/ToolActionCard';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { ToolLandingSections } from '../../components/seo/ToolLandingSections';
import { Button } from '../../components/ui/Button';
import { DropZone } from '../../components/ui/DropZone';
import { FileSelectionSummary } from '../../components/ui/FileSelectionSummary';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { SimpleProcessFlow } from '../../components/ui/SimpleProcessFlow';
import { extractEmbeddedImages, type ExtractedEmbeddedImage } from '../../adapters/pdfEngine';
import type { WorkerResponse } from '../../types';
import { createStoredZip } from '../../lib/zip';

type StatusTone = 'neutral' | 'info' | 'error';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type ExtractImagesOutput = {
  filename: string;
  bytes: Uint8Array;
  imageCount: number;
  sampleNames: string[];
};

const EXTRACT_IMAGES_CONTENT = {
  howItWorksTitle: 'How to extract embedded images from a PDF',
  howItWorksSteps: [
    'Upload one PDF file from your device.',
    'Filegap inspects supported embedded image streams locally in your browser.',
    'Download a ZIP containing the extracted JPEG or JPEG 2000 assets.',
  ],
  whyTitle: 'Why use this embedded image extractor',
  whyItems: [
    {
      title: 'No uploads',
      text: 'Your PDF is inspected locally in the browser and never sent to a server.',
    },
    {
      title: 'Original image streams',
      text: 'Supported embedded JPEG and JPEG 2000 streams are copied without page rendering or recompression.',
    },
    {
      title: 'Clear scope',
      text: 'This tool extracts supported embedded image assets, which is different from converting full PDF pages to images.',
    },
    {
      title: 'ZIP output',
      text: 'Extracted assets are packaged into one local ZIP download for easier handling.',
    },
  ],
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'Are PDFs uploaded for image extraction?',
      answer: 'No. Extraction runs locally in your browser after the page has loaded.',
    },
    {
      question: 'Is this the same as converting PDF pages to images?',
      answer:
        'No. This tool inspects embedded image assets inside the PDF. It does not render each page as a bitmap.',
    },
    {
      question: 'Which embedded image formats are supported?',
      answer:
        'This browser tool currently extracts JPEG and JPEG 2000 image XObjects with a single supported PDF filter.',
    },
    {
      question: 'Why are some images missing?',
      answer:
        'Some PDFs store images with unsupported filters, custom color spaces, inline images, or nested structures that this focused browser MVP does not extract.',
    },
  ],
  seoTitle: 'Extract embedded PDF images privately',
  seoParagraphs: [
    'Filegap extracts supported embedded image streams from PDF files directly in your browser, without upload endpoints or server-side PDF processing.',
    'The tool is intentionally scoped to supported JPEG and JPEG 2000 image XObjects so the output remains predictable and clearly different from page rendering.',
    'For PDFs that do not contain supported embedded image streams, Filegap reports an empty result instead of silently fabricating rendered page images.',
  ],
  finalCtaTitle: 'Ready to extract embedded images?',
  finalCtaText: 'Start extracting supported PDF image assets locally — no uploads, no signup.',
  finalCtaLabel: 'Extract embedded images',
  finalCtaHref: '#extract-images-tool',
};

function saveBlob(filename: string, bytes: Uint8Array, type: string): void {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type });
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

function buildZipFilename(baseFilename: string): string {
  const base = baseFilename.toLowerCase().endsWith('.pdf')
    ? baseFilename.slice(0, -4)
    : baseFilename;
  return `${base}-embedded-images.zip`;
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

function buildZipOutput(sourceFilename: string, images: ExtractedEmbeddedImage[]): ExtractImagesOutput {
  const zipBytes = createStoredZip(images.map((image) => ({ name: image.filename, bytes: image.bytes })));
  return {
    filename: buildZipFilename(sourceFilename),
    bytes: zipBytes,
    imageCount: images.length,
    sampleNames: images.slice(0, 4).map((image) => image.filename),
  };
}

export function ExtractImagesPage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDropZoneCollapsed, setIsDropZoneCollapsed] = useState(false);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [output, setOutput] = useState<ExtractImagesOutput | null>(null);
  const [status, setStatus] = useState<StatusState>({
    tone: 'neutral',
    message: 'Select one PDF file to start.',
  });

  const worker = useMemo(
    () => new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' }),
    []
  );

  const canExtract = Boolean(sourceFile) && !isProcessing;

  useEffect(() => () => worker.terminate(), [worker]);

  const actionMessage =
    status.tone === 'error'
      ? status.message
      : isProcessing
        ? 'Inspecting supported embedded image streams locally in your browser.'
        : 'Processing happens locally in your browser. Supported embedded JPEG and JPEG 2000 streams are copied into a ZIP.';
  const actionMessageClassName = status.tone === 'error' ? 'mt-2 text-sm text-red-600' : 'mt-2 text-sm text-ui-muted';

  async function runWorker(file: ArrayBuffer): Promise<WorkerResponse> {
    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
        resolve({ ok: false, error: 'extract images timeout: worker did not respond in time' });
      }, 30000);

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        window.clearTimeout(timeout);
        resolve(event.data);
      };

      worker.onerror = (event: ErrorEvent) => {
        window.clearTimeout(timeout);
        resolve({ ok: false, error: event.message || 'worker error' });
      };

      worker.onmessageerror = () => {
        window.clearTimeout(timeout);
        resolve({ ok: false, error: 'worker message error' });
      };

      worker.postMessage({
        type: 'extract-images',
        payload: { file },
      });
    });
  }

  async function extractWithFallback(file: ArrayBuffer): Promise<ExtractedEmbeddedImage[]> {
    const response = await runWorker(file);
    if (response.ok) {
      if (response.type !== 'extract-images') {
        throw new Error('Invalid worker response type for extract images.');
      }
      return response.payload.images;
    }

    return extractEmbeddedImages(file);
  }

  async function handleSourceSelected(files: File[]): Promise<void> {
    const file = files[0];
    if (!file) {
      return;
    }

    setSourceFile(file);
    setOutput(null);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(true);
    setStatus({
      tone: 'info',
      message: 'PDF ready. Extract supported embedded images when you are ready.',
    });
  }

  async function handleExtract(): Promise<void> {
    if (!sourceFile) {
      setStatus({ tone: 'error', message: 'Select one PDF file before extracting images.' });
      return;
    }

    setIsProcessing(true);
    setOutput(null);
    setShowDownloadGate(false);
    setStatus({
      tone: 'info',
      message: 'Inspecting embedded image streams locally in your browser.',
    });

    try {
      const bytes = await fileToArrayBuffer(sourceFile);
      const images = await extractWithFallback(bytes);
      const zipOutput = buildZipOutput(sourceFile.name, images);
      setOutput(zipOutput);
      setStatus({
        tone: 'info',
        message: 'Embedded image extraction completed.',
      });
    } catch {
      setStatus({
        tone: 'error',
        message: 'No supported embedded images were found in this PDF.',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function resetTool(): void {
    setSourceFile(null);
    setOutput(null);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(false);
    setStatus({ tone: 'neutral', message: 'Select one PDF file to start.' });
  }

  function handleConfirmDownload(): void {
    if (!output) {
      return;
    }
    saveBlob(output.filename, output.bytes, 'application/zip');
    setShowDownloadGate(false);
  }

  return (
    <ToolLayout
      title='Extract images from PDF — private and local'
      description='Extract supported embedded JPEG and JPEG 2000 assets from a PDF directly in your browser.'
      trustLine='Free • No signup • Works in your browser'
      metaTitle='Extract images from PDF online — private and local | Filegap'
      metaDescription='Extract supported embedded images from PDF files locally in your browser. No uploads, no account, and no server-side PDF processing.'
      heroVariant='brand'
    >
      <ToolActionCard id='extract-images-tool'>
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
            meta={formatFileSize(sourceFile.size)}
            onReplace={() => setIsDropZoneCollapsed(false)}
            onRemove={resetTool}
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

        {sourceFile ? (
          <section className='space-y-5'>
            <div className='space-y-1'>
              <h2 className='font-heading text-2xl font-semibold text-ui-text'>Embedded image extraction</h2>
              <p className='text-sm text-ui-muted'>
                Extract supported image assets stored inside the PDF and download them as one ZIP file.
              </p>
            </div>

            <div className='grid gap-3 rounded-xl border border-ui-border/70 bg-ui-surface p-4 sm:grid-cols-3'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Supported</p>
                <p className='mt-1 text-sm font-semibold text-ui-text'>JPEG, JPEG 2000</p>
              </div>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Output</p>
                <p className='mt-1 text-sm font-semibold text-ui-text'>ZIP archive</p>
              </div>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Mode</p>
                <p className='mt-1 text-sm font-semibold text-ui-text'>No page rendering</p>
              </div>
            </div>

            <section className='space-y-3'>
              <h2 className='font-heading text-xl font-semibold text-ui-text'>Processing steps</h2>
              <SimpleProcessFlow
                description='Runs locally on your files.'
                steps={['Input PDF', 'Extract images', 'Download ZIP']}
                activeStepIndex={1}
                showTitle={false}
              />
            </section>

            {!output ? (
              <div className='sticky bottom-4 z-10 pt-2'>
                <div className='flex flex-col gap-3 rounded-2xl border border-ui-border/80 bg-ui-surface/95 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold text-ui-text'>
                      {canExtract ? 'Ready to extract embedded images' : 'Preparing PDF'}
                    </p>
                    <p className={actionMessageClassName}>{actionMessage}</p>
                  </div>
                  <Button onClick={() => void handleExtract()} loading={isProcessing} disabled={!canExtract}>
                    Extract images
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {output ? (
          <div className='space-y-4 rounded-2xl border border-brand-primary/35 bg-brand-primary/10 p-5'>
            <div className='flex items-start gap-3'>
              <span className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ui-surface text-brand-primary'>
                <ImageIcon className='h-5 w-5' aria-hidden='true' />
              </span>
              <div>
                <p className='font-heading text-lg font-semibold text-ui-text'>Extraction completed</p>
                <p className='text-sm text-ui-text/85'>
                  {output.imageCount} embedded {output.imageCount === 1 ? 'image is' : 'images are'} ready in one ZIP file.
                </p>
              </div>
            </div>

            <div className='grid gap-3 rounded-xl border border-ui-border bg-ui-surface p-4 sm:grid-cols-3'>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-muted'>Images</p>
                <p className='mt-1 text-sm font-semibold text-ui-text'>{output.imageCount}</p>
              </div>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-muted'>ZIP size</p>
                <p className='mt-1 text-sm font-semibold text-ui-text'>{formatFileSize(output.bytes.byteLength)}</p>
              </div>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-muted'>Output</p>
                <p className='mt-1 truncate text-sm font-semibold text-ui-text' title={output.filename}>
                  {output.filename}
                </p>
              </div>
            </div>

            {output.sampleNames.length > 0 ? (
              <div className='rounded-xl border border-ui-border bg-ui-surface p-4'>
                <p className='text-sm font-semibold text-ui-text'>First extracted files</p>
                <ul className='mt-3 space-y-2 text-sm text-ui-muted'>
                  {output.sampleNames.map((name) => (
                    <li key={name} className='truncate'>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className='flex flex-wrap gap-3'>
              <Button onClick={() => setShowDownloadGate(true)}>Download ZIP</Button>
              <button
                type='button'
                onClick={resetTool}
                className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
              >
                New extraction
              </button>
            </div>
          </div>
        ) : null}

        <p className={status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted'}>
          {status.message}
        </p>
      </ToolActionCard>

      <ToolLandingSections {...EXTRACT_IMAGES_CONTENT} />

      <PreDownloadModal
        open={showDownloadGate}
        title='Your image ZIP is ready'
        confirmLabel='Download ZIP'
        onClose={() => setShowDownloadGate(false)}
        onConfirm={handleConfirmDownload}
      />
    </ToolLayout>
  );
}
