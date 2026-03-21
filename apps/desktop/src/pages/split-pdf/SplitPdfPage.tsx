import { useEffect, useMemo, useRef, useState } from 'react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { Dropzone } from '../../components/ui/Dropzone';
import { FileTable } from '../../components/ui/FileTable';
import { SplitOutputPanel } from '../../components/ui/SplitOutputPanel';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  revealInFolder,
  splitPdf,
  type PdfFileInfo,
} from '../../lib/desktop';
import { fileNameFromPath } from '../../lib/pathUtils';

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type SplitFile = {
  id: string;
  path: string;
  sizeBytes: number;
  pageCount: number | null;
};

function formatSize(sizeBytes: number): string {
  if (sizeBytes <= 0) {
    return '-';
  }
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function readErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    if (message.trim().length > 0) {
      return message;
    }
  }
  return 'Unknown split error.';
}

export function SplitPdfPage() {
  const [files, setFiles] = useState<SplitFile[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputBaseName, setOutputBaseName] = useState('split');
  const [pagesPerFile, setPagesPerFile] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [completedOutputCount, setCompletedOutputCount] = useState<number | null>(null);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);

  const canRun = useMemo(
    () =>
      !isLoadingFiles &&
      !isProcessing &&
      files.length === 1 &&
      outputDirectory.trim().length > 0 &&
      outputBaseName.trim().length > 0 &&
      pagesPerFile > 0,
    [isLoadingFiles, isProcessing, files.length, outputDirectory, outputBaseName, pagesPerFile]
  );

  const actionLabel = isProcessing ? 'Splitting...' : hasCompleted ? 'Split again' : 'Split PDF';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const downloads = await getDownloadDirectory();
      if (!downloads || cancelled) {
        return;
      }
      setDefaultDownloadDirectory(downloads);
      setOutputDirectory((current) => (current.trim().length === 0 ? downloads : current));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      setCompletedOutputCount(null);
      setStatus({ tone: 'neutral', message: 'Idle' });
      queueMicrotask(() => outputInputRef.current?.focus());
    } catch (error) {
      const reason = readErrorMessage(error);
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
    setOutputDirectory(chosen);
    setStatus({ tone: 'info', message: 'Destination selected' });
  }

  function clearSelectedFile() {
    setFiles([]);
    setHasCompleted(false);
    setCompletedOutputCount(null);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Files cleared' });
  }

  function startNewSplit() {
    setFiles([]);
    setHasCompleted(false);
    setCompletedOutputCount(null);
    setLastOutputPath('');
    setOutputBaseName('split');
    setPagesPerFile(1);
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  async function handleSplit() {
    if (!canRun || files.length === 0) {
      return;
    }

    if (hasCompleted) {
      setHasCompleted(false);
      setCompletedOutputCount(null);
      setLastOutputPath('');
    }

    setIsProcessing(true);
    setStatus({ tone: 'info', message: 'Splitting...' });
    try {
      const result = await splitPdf(files[0].path, outputDirectory, outputBaseName.trim(), pagesPerFile);
      setHasCompleted(true);
      setCompletedOutputCount(result.output_count);
      setLastOutputPath(result.first_output_path || result.output_dir);
      setStatus({ tone: 'success', message: `Done: ${result.output_count} files created` });
    } catch (error) {
      const reason = readErrorMessage(error);
      setStatus({ tone: 'error', message: `Split failed: ${reason}` });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleOpenFile() {
    if (!lastOutputPath) return;
    await openFile(lastOutputPath);
  }

  async function handleShowInFolder() {
    if (!lastOutputPath) return;
    await revealInFolder(lastOutputPath);
  }

  const rows = files.map((file) => ({
    id: file.id,
    filename: fileNameFromPath(file.path),
    sizeLabel: formatSize(file.sizeBytes),
    pagesLabel: file.pageCount ? String(file.pageCount) : '-',
  }));

  const destinationFriendlyLabel = !outputDirectory
    ? 'No destination selected'
    : outputDirectory === defaultDownloadDirectory
    ? 'Downloads'
    : fileNameFromPath(outputDirectory);

  const footerMessage = isLoadingFiles ? 'Processing file...' : status.tone === 'neutral' ? 'Ready' : status.message;

  return (
    <ToolLayout
      title="Split PDF"
      subtitle="Split one PDF into multiple documents"
      footerMessage={footerMessage}
      leftPanel={
        <div className="merge-left-panel">
          <Dropzone disabled={isProcessing || isLoadingFiles} fileCount={files.length} onSelectFiles={() => void handleSelectInput()} />
          {files.length > 0 ? (
            <div className="uploaded-files-header">
              <p>Selected files ({files.length})</p>
              <Button variant="ghost" onClick={clearSelectedFile} disabled={isProcessing || isLoadingFiles}>
                Clear all
              </Button>
            </div>
          ) : null}
          {isLoadingFiles ? <p className="file-loading-hint">Processing file...</p> : null}
          <FileTable
            rows={isLoadingFiles ? [] : rows}
            onRemove={() => clearSelectedFile()}
            onReorder={() => {}}
            isLoading={isLoadingFiles}
          />
        </div>
      }
      rightPanel={
        <SplitOutputPanel
          outputBaseName={outputBaseName}
          outputInputRef={outputInputRef}
          pagesPerFile={pagesPerFile}
          destinationLabel={destinationFriendlyLabel}
          destinationPath={outputDirectory}
          canRun={canRun}
          isProcessing={isProcessing}
          hasCompleted={hasCompleted}
          completedOutputCount={completedOutputCount}
          actionLabel={actionLabel}
          onOutputBaseNameChange={setOutputBaseName}
          onPagesPerFileChange={setPagesPerFile}
          onChooseDestination={() => void handleChooseOutputDirectory()}
          onRun={() => void handleSplit()}
          onNewSplit={startNewSplit}
          onOpenFile={() => void handleOpenFile()}
          onShowInFolder={() => void handleShowInFolder()}
        />
      }
    />
  );
}
