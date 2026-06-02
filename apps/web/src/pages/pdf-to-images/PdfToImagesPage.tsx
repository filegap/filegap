import { useState } from 'react';

import { PDFDocument } from 'pdf-lib';
import { ChevronsDownUp, Image as ImageIcon } from 'lucide-react';

import { ToolActionCard } from '../../components/layout/ToolActionCard';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { ToolLandingSections } from '../../components/seo/ToolLandingSections';
import { Button } from '../../components/ui/Button';
import { DropZone } from '../../components/ui/DropZone';
import { FileSelectionSummary } from '../../components/ui/FileSelectionSummary';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { SimpleProcessFlow } from '../../components/ui/SimpleProcessFlow';
import { trackToolEvent } from '../../lib/analytics/trackEvent';
import { baseRelatedTools, canonicalUrl } from '../../lib/seo/seoLandingPages';
import type { ToolPageSeoConfig } from '../../lib/seo/toolPageConfig';
import {
  renderPdfPagesToImages,
  type PdfImageFormat,
  type PdfPageImage,
} from '../../lib/pdfImages';
import { createStoredZip } from '../../lib/zip';

type StatusTone = 'neutral' | 'info' | 'error';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type ImageQualityPreset = 'screen' | 'print';

type ImageOutput = {
  filename: string;
  bytes: Uint8Array;
  imageCount: number;
  format: PdfImageFormat;
  sampleImages: PdfPageImage[];
};

const IMAGE_PAGE_CONTENT = {
  howItWorksTitle: 'How to convert PDF pages to images',
  howItWorksSteps: [
    'Upload one PDF file from your device.',
    'Choose JPEG or PNG output and a resolution preset.',
    'Convert locally in your browser and download a ZIP with one image per page.',
  ],
  whyTitle: 'Why use this PDF to images tool',
  whyItems: [
    {
      title: 'No uploads',
      text: 'Your PDF is rendered locally in your browser and never sent to a server.',
    },
    {
      title: 'One image per page',
      text: 'Each PDF page is exported as a separate image and packaged into a ZIP file.',
    },
    {
      title: 'Useful output presets',
      text: 'Use JPEG for smaller files or PNG when crisp lossless output matters more.',
    },
    {
      title: 'Privacy-first workflow',
      text: 'PDF bytes, rendered pages, and exported images stay in local browser memory.',
    },
  ],
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'Are PDF pages uploaded for conversion?',
      answer:
        'No. Rendering happens locally in your browser after the page has loaded.',
    },
    {
      question: 'What image formats are supported?',
      answer:
        'You can export PDF pages as JPEG or PNG images.',
    },
    {
      question: 'Why is the output a ZIP file?',
      answer:
        'A PDF can contain many pages, so Filegap packages the images into one local ZIP download.',
    },
    {
      question: 'Does image conversion preserve selectable text?',
      answer:
        'No. This tool renders each page as a bitmap image, so text becomes pixels.',
    },
    {
      question: 'What limits apply?',
      answer:
        'Limits depend on browser memory and device performance because every page is rendered locally.',
    },
  ],
  seoTitle: 'Convert PDF pages into images privately',
  seoParagraphs: [
    'Filegap converts PDF pages to images directly in your browser, with no upload endpoint or server-side PDF processing.',
    'Use JPEG when you want smaller exported images, or PNG when you prefer lossless page renders.',
    'The generated image files are bundled into a ZIP locally, then downloaded from your browser.',
  ],
  finalCtaTitle: 'Ready to convert PDF pages?',
  finalCtaText: 'Start converting PDF pages to images locally — no uploads, no signup.',
  finalCtaLabel: 'Convert PDF to images',
  finalCtaHref: '#pdf-to-images-tool',
};

type PdfToImagesPageProps = {
  seoConfig?: ToolPageSeoConfig;
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

async function getPdfPageCount(file: File): Promise<number | null> {
  try {
    const bytes = await fileToArrayBuffer(file);
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  } catch {
    return null;
  }
}

function buildZipFilename(baseFilename: string): string {
  const base = baseFilename.toLowerCase().endsWith('.pdf')
    ? baseFilename.slice(0, -4)
    : baseFilename;
  return `${base}-images.zip`;
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

function getPresetScale(preset: ImageQualityPreset): number {
  return preset === 'print' ? 2 : 1;
}

export function PdfToImagesPage({ seoConfig }: PdfToImagesPageProps = {}) {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [format, setFormat] = useState<PdfImageFormat>('jpeg');
  const [qualityPreset, setQualityPreset] = useState<ImageQualityPreset>('screen');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDropZoneCollapsed, setIsDropZoneCollapsed] = useState(false);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [output, setOutput] = useState<ImageOutput | null>(null);
  const [status, setStatus] = useState<StatusState>({
    tone: 'neutral',
    message: 'Select one PDF file to start.',
  });

  const canConvert = Boolean(sourceFile) && Boolean(pageCount) && !isProcessing;
  const formatLabel = format === 'png' ? 'PNG' : 'JPEG';
  const presetLabel = qualityPreset === 'print' ? 'Print' : 'Screen';

  async function handleSourceSelected(files: File[]): Promise<void> {
    const file = files[0];
    if (!file) {
      return;
    }

    setSourceFile(file);
    setOutput(null);
    setShowDownloadGate(false);
    setProgress(null);
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
      message: `PDF ready (${totalPages} pages). Choose output settings, then convert.`,
    });
  }

  async function handleConvert(): Promise<void> {
    if (!sourceFile || !pageCount) {
      setStatus({ tone: 'error', message: 'Select one PDF file before converting.' });
      return;
    }

    trackToolEvent('started', 'images');
    setIsProcessing(true);
    setOutput(null);
    setShowDownloadGate(false);
    setProgress({ completed: 0, total: pageCount });
    setStatus({
      tone: 'info',
      message: 'Rendering pages locally in your browser. Larger PDFs can take longer.',
    });

    try {
      const fileBytes = new Uint8Array(await fileToArrayBuffer(sourceFile));
      const images = await renderPdfPagesToImages(
        fileBytes,
        {
          format,
          scale: getPresetScale(qualityPreset),
          jpegQuality: qualityPreset === 'print' ? 0.9 : 0.78,
          baseFilename: sourceFile.name,
        },
        (completed, total) => setProgress({ completed, total })
      );
      const zipBytes = createStoredZip(
        images.map((image) => ({
          name: image.filename,
          bytes: image.bytes,
        }))
      );

      setOutput({
        filename: buildZipFilename(sourceFile.name),
        bytes: zipBytes,
        imageCount: images.length,
        format,
        sampleImages: images.slice(0, 3),
      });
      setStatus({
        tone: 'info',
        message: 'Conversion completed. Your image ZIP is ready to download.',
      });
      trackToolEvent('completed', 'images');
    } catch {
      setStatus({
        tone: 'error',
        message: 'Conversion failed. Try a smaller PDF or the screen preset.',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function removeSourceFile(): void {
    setSourceFile(null);
    setPageCount(null);
    setOutput(null);
    setShowDownloadGate(false);
    setProgress(null);
    setIsDropZoneCollapsed(false);
    setStatus({
      tone: 'neutral',
      message: 'Select one PDF file to start.',
    });
  }

  function startNewConversion(): void {
    removeSourceFile();
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
      title={seoConfig?.title ?? 'Convert PDF to images — private, local, and fast'}
      description={seoConfig?.description ?? 'Export every PDF page as a JPEG or PNG image directly in your browser.'}
      trustLine={seoConfig?.trustLine ?? 'Free • No signup • Works in your browser'}
      metaTitle={seoConfig?.metaTitle ?? 'Convert PDF to Images Online — Private & Local | Filegap'}
      metaDescription={seoConfig?.metaDescription ?? 'Convert PDF pages to JPEG or PNG images locally in your browser. No uploads, no account, and no server-side PDF processing.'}
      canonicalPath={seoConfig?.canonicalPath}
      robots={seoConfig?.robots}
      heroVariant='brand'
    >
      <ToolActionCard id='pdf-to-images-tool'>
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

        {sourceFile ? (
          <section className='space-y-5'>
            <div className='space-y-1'>
              <h2 className='font-heading text-2xl font-semibold text-ui-text'>Image export settings</h2>
              <p className='text-sm text-ui-muted'>
                Convert each PDF page into a bitmap image and download all images as one ZIP file.
              </p>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <fieldset className='space-y-3 rounded-xl border border-ui-border/70 bg-ui-surface p-4'>
                <legend className='px-1 text-sm font-semibold text-ui-text'>Format</legend>
                <div className='grid grid-cols-2 gap-2'>
                  {(['jpeg', 'png'] as const).map((value) => (
                    <button
                      key={value}
                      type='button'
                      onClick={() => setFormat(value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        format === value
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-ui-border bg-ui-bg text-ui-muted hover:text-ui-text'
                      }`}
                    >
                      {value === 'png' ? 'PNG' : 'JPEG'}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className='space-y-3 rounded-xl border border-ui-border/70 bg-ui-surface p-4'>
                <legend className='px-1 text-sm font-semibold text-ui-text'>Resolution</legend>
                <div className='grid grid-cols-2 gap-2'>
                  {(['screen', 'print'] as const).map((value) => (
                    <button
                      key={value}
                      type='button'
                      onClick={() => setQualityPreset(value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        qualityPreset === value
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-ui-border bg-ui-bg text-ui-muted hover:text-ui-text'
                      }`}
                    >
                      {value === 'print' ? 'Print' : 'Screen'}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className='grid gap-3 rounded-xl border border-ui-border/70 bg-ui-surface p-4 sm:grid-cols-3'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Pages</p>
                <p className='mt-1 text-sm font-semibold text-ui-text'>{pageCount ?? '-'}</p>
              </div>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Format</p>
                <p className='mt-1 text-sm font-semibold text-ui-text'>{formatLabel}</p>
              </div>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Preset</p>
                <p className='mt-1 text-sm font-semibold text-ui-text'>{presetLabel}</p>
              </div>
            </div>

            <section className='space-y-3'>
              <h2 className='font-heading text-xl font-semibold text-ui-text'>Processing steps</h2>
              <SimpleProcessFlow
                description='Runs locally on your files.'
                steps={['Input PDF', 'Render pages', 'Download ZIP']}
                activeStepIndex={1}
                showTitle={false}
              />
            </section>

            {!output ? (
              <div className='sticky bottom-4 z-10 pt-2'>
                <div className='flex flex-col gap-3 rounded-2xl border border-ui-border/80 bg-ui-surface/95 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold text-ui-text'>
                      {canConvert ? 'Ready to convert this PDF' : 'Preparing PDF'}
                    </p>
                    <p className={status.tone === 'error' ? 'mt-2 text-sm text-red-600' : 'mt-2 text-sm text-ui-muted'}>
                      {status.tone === 'error'
                        ? status.message
                        : progress
                        ? `Rendered ${progress.completed} of ${progress.total} pages.`
                        : 'Processing happens locally in your browser. Timing depends on your device and selected preset.'}
                    </p>
                  </div>
                  <Button onClick={() => void handleConvert()} loading={isProcessing} disabled={!canConvert}>
                    Convert to images
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
                <ImageIcon className='h-5 w-5' />
              </span>
              <div>
                <p className='font-heading text-lg font-semibold text-ui-text'>Conversion completed</p>
                <p className='text-sm text-ui-text/85'>
                  {output.imageCount} {output.format === 'png' ? 'PNG' : 'JPEG'} images are ready in one ZIP file.
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

            {output.sampleImages.length > 0 ? (
              <div className='rounded-xl border border-ui-border bg-ui-surface p-4'>
                <p className='text-sm font-semibold text-ui-text'>First exported files</p>
                <ul className='mt-3 space-y-2 text-sm text-ui-muted'>
                  {output.sampleImages.map((image) => (
                    <li key={image.filename} className='flex items-center justify-between gap-3'>
                      <span className='truncate'>{image.filename}</span>
                      <span className='shrink-0 text-xs'>{image.width} x {image.height}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className='flex flex-wrap gap-3'>
              <Button onClick={() => setShowDownloadGate(true)}>Download ZIP</Button>
              <button
                type='button'
                onClick={startNewConversion}
                className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
              >
                New conversion
              </button>
            </div>
          </div>
        ) : null}

        <p className={status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted'}>
          {status.message}
        </p>
      </ToolActionCard>

      <ToolLandingSections
        {...(seoConfig?.landingContent ?? IMAGE_PAGE_CONTENT)}
        relatedTools={seoConfig?.relatedTools ?? [...baseRelatedTools.images]}
        structuredData={{
          pageTitle: seoConfig?.metaTitle ?? 'PDF to Images Online — Private, Local & Free | Filegap',
          pageDescription: seoConfig?.metaDescription ?? 'Convert PDF pages into JPEG or PNG images from your browser without uploading the document.',
          pageUrl: canonicalUrl(seoConfig?.routePath ?? '/pdf-to-images'),
          breadcrumbLabel: seoConfig?.breadcrumbLabel ?? 'PDF to Images',
        }}
      />

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
