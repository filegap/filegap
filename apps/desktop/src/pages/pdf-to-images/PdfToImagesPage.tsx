import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Image, Trash2 } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { OutputActionSection } from '../../components/ui/OutputActionSection';
import { OutputDestinationField } from '../../components/ui/OutputDestinationField';
import { SidebarSection } from '../../components/ui/SidebarSection';
import { SingleFilePicker } from '../../components/ui/SingleFilePicker';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { WorkingFileHeader } from '../../components/ui/WorkingFileHeader';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  pathExists,
  readPdfBytes,
  revealInFolder,
  writeBinaryFile,
} from '../../lib/desktop';
import { renderPdfPagesToImages, type PdfImageFormat, type PdfPageImage } from '../../lib/pdfImages';
import { renderFilenameTemplate, resolveOutputPathByOverwrite } from '../../lib/outputSettings';
import { joinPath, parsePath, readErrorMessage } from '../../lib/pageHelpers';
import { fileNameFromPath } from '../../lib/pathUtils';
import { useDesktopSettings } from '../../lib/settings';
import { createStoredZip } from '../../lib/zip';

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type ImageQualityPreset = 'screen' | 'print';

type PdfImageFile = {
  id: string;
  path: string;
  sizeBytes: number;
  pageCount: number | null;
};

type ProgressState = {
  completed: number;
  total: number;
};

function createDefaultOutputName(): string {
  return renderFilenameTemplate('pdf-images-{date}.zip');
}

function formatBytesHuman(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const precision = value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: precision }).format(value)} ${units[exponent]}`;
}

function getPresetScale(preset: ImageQualityPreset): number {
  return preset === 'print' ? 2 : 1;
}

function normalizeZipName(name: string): string {
  const clean = name.trim().length > 0 ? name.trim() : createDefaultOutputName();
  return clean.toLowerCase().endsWith('.zip') ? clean : `${clean}.zip`;
}

export function PdfToImagesPage() {
  const [settings] = useDesktopSettings();
  const [files, setFiles] = useState<PdfImageFile[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState(createDefaultOutputName());
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [format, setFormat] = useState<PdfImageFormat>('jpeg');
  const [qualityPreset, setQualityPreset] = useState<ImageQualityPreset>('screen');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isDropzoneCollapsed, setIsDropzoneCollapsed] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [lastImageCount, setLastImageCount] = useState(0);
  const [lastZipSizeBytes, setLastZipSizeBytes] = useState(0);
  const [sampleImages, setSampleImages] = useState<PdfPageImage[]>([]);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = files[0] ?? null;
  const canRun = useMemo(
    () =>
      !isLoadingFiles &&
      !isProcessing &&
      files.length === 1 &&
      (settings.askDestinationEveryTime || outputDirectory.trim().length > 0) &&
      outputName.trim().length > 0,
    [isLoadingFiles, isProcessing, files.length, settings.askDestinationEveryTime, outputDirectory, outputName]
  );
  const actionLabel = isProcessing ? 'Converting...' : hasCompleted ? 'Convert again' : 'Convert to images';
  const destinationFriendlyLabel = outputDirectory || defaultDownloadDirectory || 'Choose destination';
  const progressLabel = progress ? `Rendered ${progress.completed} of ${progress.total} pages` : 'Rendering pages...';
  const footerMessage =
    status.tone === 'success'
      ? status.message
      : status.tone === 'error'
        ? status.message
        : status.tone === 'info'
          ? status.message
          : 'Ready';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const downloads = await getDownloadDirectory();
      if (cancelled) {
        return;
      }
      const fallbackDirectory = settings.askDestinationEveryTime ? null : settings.defaultOutputDirectory ?? downloads;
      setDefaultDownloadDirectory(downloads ?? '');
      if (!fallbackDirectory) {
        return;
      }
      const parsed = parsePath(fallbackDirectory);
      setPathSeparator(parsed.sep);
      setOutputDirectory((current) => (current.trim().length === 0 ? fallbackDirectory : current));
    })();
    return () => {
      cancelled = true;
    };
  }, [settings.askDestinationEveryTime, settings.defaultOutputDirectory]);

  async function handleSelectInput() {
    const selected = await chooseSinglePdfInput();
    if (!selected) {
      return;
    }

    setIsLoadingFiles(true);
    setStatus({ tone: 'info', message: 'Processing file...' });
    try {
      const [info] = await inspectPdfFiles([selected]);
      setFiles([
        {
          id: `${selected}-${Math.random().toString(16).slice(2)}`,
          path: selected,
          sizeBytes: info?.size_bytes ?? 0,
          pageCount: info?.page_count ?? null,
        },
      ]);
      setHasCompleted(false);
      setLastOutputPath('');
      setLastImageCount(0);
      setLastZipSizeBytes(0);
      setSampleImages([]);
      setProgress(null);
      setIsDropzoneCollapsed(true);
      setStatus({ tone: 'neutral', message: 'Idle' });
      queueMicrotask(() => outputInputRef.current?.focus());
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown file error.');
      setStatus({ tone: 'error', message: `Failed to inspect file: ${reason}` });
    } finally {
      setIsLoadingFiles(false);
    }
  }

  async function handleChooseOutputDirectory() {
    const chosen = await chooseOutputDirectory();
    if (!chosen) {
      return;
    }
    const parsed = parsePath(chosen);
    setPathSeparator(parsed.sep);
    setOutputDirectory(chosen);
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  function clearSelectedFile() {
    setFiles([]);
    setIsDropzoneCollapsed(false);
    setHasCompleted(false);
    setLastOutputPath('');
    setLastImageCount(0);
    setLastZipSizeBytes(0);
    setSampleImages([]);
    setProgress(null);
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  async function handleConvert() {
    if (!selectedFile) {
      setStatus({ tone: 'error', message: 'Select one PDF file.' });
      return;
    }

    const destinationRoot = settings.askDestinationEveryTime
      ? outputDirectory.trim()
      : outputDirectory.trim() || defaultDownloadDirectory.trim();
    if (!destinationRoot) {
      setStatus({ tone: 'error', message: 'Select an output destination first.' });
      return;
    }

    const requestedPath = joinPath(destinationRoot, normalizeZipName(outputName), pathSeparator);
    let outputPath: string | null = null;
    try {
      outputPath = await resolveOutputPathByOverwrite(
        requestedPath,
        settings.overwriteBehavior,
        pathExists,
        async (message) => window.confirm(message)
      );
    } catch {
      outputPath = null;
    }

    if (!outputPath) {
      setStatus({ tone: 'info', message: 'Operation cancelled.' });
      return;
    }

    setIsProcessing(true);
    setHasCompleted(false);
    setLastOutputPath('');
    setLastImageCount(0);
    setLastZipSizeBytes(0);
    setSampleImages([]);
    setProgress({ completed: 0, total: selectedFile.pageCount ?? 0 });
    setStatus({ tone: 'info', message: 'Rendering PDF pages...' });

    try {
      const bytes = await readPdfBytes(selectedFile.path);
      const images = await renderPdfPagesToImages(
        bytes,
        {
          format,
          scale: getPresetScale(qualityPreset),
          jpegQuality: qualityPreset === 'print' ? 0.9 : 0.78,
          baseFilename: fileNameFromPath(selectedFile.path),
        },
        (completed, total) => setProgress({ completed, total })
      );
      const zipBytes = createStoredZip(
        images.map((image) => ({
          name: image.filename,
          bytes: image.bytes,
        }))
      );
      await writeBinaryFile(outputPath, zipBytes);

      setLastOutputPath(outputPath);
      setLastImageCount(images.length);
      setLastZipSizeBytes(zipBytes.byteLength);
      setSampleImages(images.slice(0, 3));
      setHasCompleted(true);
      setStatus({ tone: 'success', message: 'Done: image ZIP exported' });
      if (settings.openFileAfterExport) {
        void openFile(outputPath);
      } else if (settings.revealInFolderAfterExport) {
        void revealInFolder(outputPath);
      }
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown conversion error.');
      setStatus({ tone: 'error', message: `Conversion failed: ${reason}` });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleOpenFile() {
    if (!lastOutputPath) {
      return;
    }
    try {
      await openFile(lastOutputPath);
    } catch (error) {
      const reason = readErrorMessage(error, 'Unable to open file.');
      setStatus({ tone: 'error', message: reason });
    }
  }

  async function handleShowInFolder() {
    if (!lastOutputPath) {
      return;
    }
    try {
      await revealInFolder(lastOutputPath);
    } catch (error) {
      const reason = readErrorMessage(error, 'Unable to reveal file.');
      setStatus({ tone: 'error', message: reason });
    }
  }

  function startNewConversion() {
    clearSelectedFile();
    setOutputName(createDefaultOutputName());
  }

  return (
    <ToolLayout
      title="PDF to Images"
      subtitle="Convert every PDF page into JPEG or PNG files locally"
      footerMessage={footerMessage}
      leftPanel={
        <div className="merge-left-panel">
          <SingleFilePicker
            hasFile={files.length > 0}
            isCollapsed={isDropzoneCollapsed}
            disabled={isProcessing || isLoadingFiles}
            fileCount={files.length}
            onSelectFiles={() => void handleSelectInput()}
            onShowPicker={() => setIsDropzoneCollapsed(false)}
            onHidePicker={() => setIsDropzoneCollapsed(true)}
          />
          {selectedFile ? (
            <WorkingFileHeader title={fileNameFromPath(selectedFile.path)} titleAttribute={selectedFile.path}>
              <Button
                variant="ghost"
                className="extract-delete-file-btn"
                onClick={clearSelectedFile}
                disabled={isProcessing || isLoadingFiles}
                aria-label="Delete file"
                title="Delete file"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </WorkingFileHeader>
          ) : null}
          {selectedFile ? (
            <dl className="compress-file-info-grid">
              <dt>Size</dt>
              <dd>{formatBytesHuman(selectedFile.sizeBytes)}</dd>
              <dt>Pages</dt>
              <dd>{selectedFile.pageCount ?? '-'}</dd>
              <dt>Output</dt>
              <dd>{format === 'png' ? 'PNG images' : 'JPEG images'}</dd>
              <dt>Preset</dt>
              <dd>{qualityPreset === 'print' ? 'Print' : 'Screen'}</dd>
            </dl>
          ) : null}
          {isLoadingFiles ? <p className="file-loading-hint">Processing file...</p> : null}
        </div>
      }
      rightPanel={
        <div className="output-panel">
          <SidebarSection title="Image settings" className="output-panel-top">
            <label className="output-label" htmlFor="pdf-image-format">
              Format
            </label>
            <select
              id="pdf-image-format"
              value={format}
              onChange={(event) => setFormat(event.target.value as PdfImageFormat)}
              className="output-input"
              disabled={isProcessing}
            >
              <option value="jpeg">JPEG (smaller files)</option>
              <option value="png">PNG (lossless)</option>
            </select>

            <label className="output-label" htmlFor="pdf-image-preset">
              Resolution
            </label>
            <select
              id="pdf-image-preset"
              value={qualityPreset}
              onChange={(event) => setQualityPreset(event.target.value as ImageQualityPreset)}
              className="output-input"
              disabled={isProcessing}
            >
              <option value="screen">Screen</option>
              <option value="print">Print</option>
            </select>
            <p className="output-helper-text">
              Renders pages locally with PDF.js and packages the images into one ZIP file.
            </p>
          </SidebarSection>

          <div className="output-panel-divider" />

          <SidebarSection title="Export" className="output-panel-top">
            <label className="output-label" htmlFor="images-output-file-name">
              File name
            </label>
            <input
              id="images-output-file-name"
              type="text"
              ref={outputInputRef}
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
              className="output-input"
              disabled={isProcessing}
            />
            <OutputDestinationField
              destinationLabel={destinationFriendlyLabel}
              destinationPath={outputDirectory}
              onChooseDestination={() => void handleChooseOutputDirectory()}
            />
          </SidebarSection>

          <div className="output-panel-divider" />

          <OutputActionSection
            canRun={canRun}
            isProcessing={isProcessing}
            actionLabel={actionLabel}
            loadingLabel="Converting..."
            progressLabel={progressLabel}
            onRun={() => void handleConvert()}
            showCompletionState={hasCompleted && !isProcessing}
            completionTitle="Conversion completed"
            completionDetails="Your image ZIP is ready"
            onOpenFile={() => void handleOpenFile()}
            onShowInFolder={() => void handleShowInFolder()}
            onNewAction={startNewConversion}
            newActionLabel="New conversion"
          />

          {hasCompleted ? (
            <>
              <div className="output-panel-divider" />
              <SidebarSection title="Result" className="output-panel-top">
                <div className="pdf-images-result-summary">
                  <span className="pdf-images-result-icon" aria-hidden="true">
                    <Image />
                  </span>
                  <span>{lastImageCount} images</span>
                  <span>{formatBytesHuman(lastZipSizeBytes)}</span>
                </div>
                {sampleImages.length > 0 ? (
                  <ul className="pdf-images-sample-list">
                    {sampleImages.map((image) => (
                      <li key={image.filename}>
                        <span>{image.filename}</span>
                        <span>{image.width} x {image.height}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </SidebarSection>
            </>
          ) : null}

          <div className="output-panel-divider" />

          <SidebarSection title="Processing steps" className="output-panel-section">
            <p className="tool-process-flow-helper">Runs locally on your files.</p>
            <div className="tool-process-flow-row" aria-label="Processing steps">
              {['Input PDF', 'Render pages', 'ZIP output'].map((step, index) => (
                <div key={step} className="tool-process-flow-step-wrap">
                  <span
                    className={`tool-process-flow-step ${index === 1 ? 'tool-process-flow-step-active' : ''}`.trim()}
                  >
                    {step}
                  </span>
                  {index < 2 ? <ArrowRight aria-hidden="true" className="tool-process-flow-arrow" /> : null}
                </div>
              ))}
            </div>
          </SidebarSection>

          <TrustNotice className="output-panel-trust" />
        </div>
      }
    />
  );
}
