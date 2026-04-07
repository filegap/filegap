import { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { CompressOutputPanel } from '../../components/ui/CompressOutputPanel';
import { SingleFilePicker } from '../../components/ui/SingleFilePicker';
import { WorkingFileHeader } from '../../components/ui/WorkingFileHeader';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  compressPdf,
  type CompressPreset,
  type PdfMetadata,
  getDownloadDirectory,
  inspectPdfFiles,
  inspectPdfMetadata,
  openFile,
  pathExists,
  revealInFolder,
} from '../../lib/desktop';
import { renderFilenameTemplate, resolveOutputPathByOverwrite } from '../../lib/outputSettings';
import { joinPath, parsePath, readErrorMessage } from '../../lib/pageHelpers';
import { fileNameFromPath } from '../../lib/pathUtils';
import { useDesktopSettings } from '../../lib/settings';

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type CompressFile = {
  id: string;
  path: string;
  sizeBytes: number;
  pageCount: number | null;
};

function createDefaultOutputName(): string {
  return renderFilenameTemplate('compressed-{date}.pdf');
}

function displayValue(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '-';
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

function formatPdfDate(value: string | null | undefined): string {
  const raw = displayValue(value);
  if (raw === '-') {
    return raw;
  }
  const match = raw.match(/^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) {
    return raw;
  }
  const [, year, month, day, hour, minute, second] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function CompressPdfPage() {
  const [settings] = useDesktopSettings();
  const [files, setFiles] = useState<CompressFile[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState(createDefaultOutputName());
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [preset, setPreset] = useState<CompressPreset>('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isDropzoneCollapsed, setIsDropzoneCollapsed] = useState(false);
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);

  const canRun = useMemo(
    () =>
      !isLoadingFiles &&
      !isProcessing &&
      files.length === 1 &&
      (settings.askDestinationEveryTime || outputDirectory.trim().length > 0) &&
      outputName.trim().length > 0,
    [isLoadingFiles, isProcessing, files.length, settings.askDestinationEveryTime, outputDirectory, outputName]
  );

  const actionLabel = isProcessing ? 'Compressing...' : hasCompleted ? 'Compress again' : 'Compress PDF';
  const selectedFile = files[0] ?? null;

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
      const [[info], fileMetadata] = await Promise.all([inspectPdfFiles([selected]), inspectPdfMetadata(selected)]);
      setFiles([
        {
          id: `${selected}-${Math.random().toString(16).slice(2)}`,
          path: selected,
          sizeBytes: info?.size_bytes ?? 0,
          pageCount: info?.page_count ?? null,
        },
      ]);
      setMetadata(fileMetadata);
      setHasCompleted(false);
      setLastOutputPath('');
      setIsDropzoneCollapsed(true);
      setStatus({ tone: 'neutral', message: 'Idle' });
      queueMicrotask(() => outputInputRef.current?.focus());
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown compress error.');
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
    setMetadata(null);
    setIsDropzoneCollapsed(false);
    setHasCompleted(false);
    setLastOutputPath('');
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  async function handleCompress() {
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

    const cleanName = outputName.trim().length > 0 ? outputName.trim() : createDefaultOutputName();
    const normalizedName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
    const requestedPath = joinPath(destinationRoot, normalizedName, pathSeparator);

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
    setStatus({ tone: 'info', message: 'Compressing PDF...' });
    setHasCompleted(false);
    try {
      const result = await compressPdf(selectedFile.path, outputPath, preset);
      setLastOutputPath(result.output_path);
      setHasCompleted(true);
      setStatus({ tone: 'success', message: 'Done: PDF compressed' });
      if (settings.openFileAfterExport) {
        void openFile(result.output_path);
      } else if (settings.revealInFolderAfterExport) {
        void revealInFolder(result.output_path);
      }
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown compress error.');
      setStatus({ tone: 'error', message: `Compress failed: ${reason}` });
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

  function startNewCompress() {
    clearSelectedFile();
    setOutputName(createDefaultOutputName());
    setPreset('balanced');
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  const destinationFriendlyLabel = outputDirectory || defaultDownloadDirectory || 'Choose destination';
  const footerMessage =
    status.tone === 'success'
      ? status.message
      : status.tone === 'error'
        ? status.message
        : status.tone === 'info'
          ? status.message
          : 'Ready';

  return (
    <ToolLayout
      title="Compress PDF"
      subtitle="Reduce PDF size locally with quality presets"
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
              <dd>{formatBytesHuman(metadata?.size_bytes ?? selectedFile.sizeBytes)}</dd>
              <dt>Pages</dt>
              <dd>{metadata?.pages ?? selectedFile.pageCount ?? '-'}</dd>
              <dt>PDF version</dt>
              <dd>{displayValue(metadata?.pdf_version)}</dd>
              <dt>Encrypted</dt>
              <dd>{metadata ? (metadata.encrypted ? 'Yes' : 'No') : '-'}</dd>
              <dt>Title</dt>
              <dd>{displayValue(metadata?.title)}</dd>
              <dt>Author</dt>
              <dd>{displayValue(metadata?.author)}</dd>
              <dt>Creator</dt>
              <dd>{displayValue(metadata?.creator)}</dd>
              <dt>Producer</dt>
              <dd
                className="compress-file-info-value compress-file-info-value--truncate"
                title={displayValue(metadata?.producer)}
              >
                {displayValue(metadata?.producer)}
              </dd>
              <dt>Created</dt>
              <dd>{formatPdfDate(metadata?.creation_date)}</dd>
              <dt>Modified</dt>
              <dd>{formatPdfDate(metadata?.modification_date)}</dd>
            </dl>
          ) : null}
          {isLoadingFiles ? <p className="file-loading-hint">Processing file...</p> : null}
        </div>
      }
      rightPanel={
        <CompressOutputPanel
          outputName={outputName}
          outputInputRef={outputInputRef}
          preset={preset}
          destinationLabel={destinationFriendlyLabel}
          destinationPath={outputDirectory}
          canRun={canRun}
          isProcessing={isProcessing}
          hasCompleted={hasCompleted}
          actionLabel={actionLabel}
          onOutputNameChange={setOutputName}
          onPresetChange={setPreset}
          onChooseDestination={() => void handleChooseOutputDirectory()}
          onRun={() => void handleCompress()}
          onNewCompress={startNewCompress}
          onOpenFile={() => void handleOpenFile()}
          onShowInFolder={() => void handleShowInFolder()}
        />
      }
    />
  );
}
