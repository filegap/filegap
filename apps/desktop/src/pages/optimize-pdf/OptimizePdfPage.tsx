import { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { OptimizeOutputPanel } from '../../components/ui/OptimizeOutputPanel';
import { SingleFilePicker } from '../../components/ui/SingleFilePicker';
import { WorkingFileHeader } from '../../components/ui/WorkingFileHeader';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  optimizePdf,
  pathExists,
  revealInFolder,
} from '../../lib/desktop';
import { renderFilenameTemplate, resolveOutputPathByOverwrite } from '../../lib/outputSettings';
import { formatKilobytes, joinPath, parsePath, readErrorMessage } from '../../lib/pageHelpers';
import { fileNameFromPath } from '../../lib/pathUtils';
import { useDesktopSettings } from '../../lib/settings';

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type OptimizeFile = {
  id: string;
  path: string;
  sizeBytes: number;
  pageCount: number | null;
};

function createDefaultOutputName(): string {
  return renderFilenameTemplate('optimized-{date}.pdf');
}

export function OptimizePdfPage() {
  const [settings] = useDesktopSettings();
  const [files, setFiles] = useState<OptimizeFile[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState(createDefaultOutputName());
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isDropzoneCollapsed, setIsDropzoneCollapsed] = useState(false);
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

  const actionLabel = isProcessing ? 'Optimizing...' : hasCompleted ? 'Optimize again' : 'Optimize PDF';
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
      setIsDropzoneCollapsed(true);
      setStatus({ tone: 'neutral', message: 'Idle' });
      queueMicrotask(() => outputInputRef.current?.focus());
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown optimize error.');
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
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  async function handleOptimize() {
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
    setStatus({ tone: 'info', message: 'Optimizing PDF...' });
    setHasCompleted(false);
    try {
      const result = await optimizePdf(selectedFile.path, outputPath);
      setLastOutputPath(result.output_path);
      setHasCompleted(true);
      setStatus({ tone: 'success', message: 'Done: PDF optimized' });
      if (settings.openFileAfterExport) {
        void openFile(result.output_path);
      } else if (settings.revealInFolderAfterExport) {
        void revealInFolder(result.output_path);
      }
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown optimize error.');
      setStatus({ tone: 'error', message: `Optimize failed: ${reason}` });
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

  function startNewOptimize() {
    clearSelectedFile();
    setOutputName(createDefaultOutputName());
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
      title="Optimize PDF"
      subtitle="Clean PDF structure locally without intentional quality loss"
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
            <p className="file-loading-hint">
              Selected: {formatKilobytes(selectedFile.sizeBytes)} {selectedFile.pageCount ? `• ${selectedFile.pageCount} pages` : ''}
            </p>
          ) : null}
          {isLoadingFiles ? <p className="file-loading-hint">Processing file...</p> : null}
        </div>
      }
      rightPanel={
        <OptimizeOutputPanel
          outputName={outputName}
          outputInputRef={outputInputRef}
          destinationLabel={destinationFriendlyLabel}
          destinationPath={outputDirectory}
          canRun={canRun}
          isProcessing={isProcessing}
          hasCompleted={hasCompleted}
          actionLabel={actionLabel}
          onOutputNameChange={setOutputName}
          onChooseDestination={() => void handleChooseOutputDirectory()}
          onRun={() => void handleOptimize()}
          onNewOptimize={startNewOptimize}
          onOpenFile={() => void handleOpenFile()}
          onShowInFolder={() => void handleShowInFolder()}
        />
      }
    />
  );
}
