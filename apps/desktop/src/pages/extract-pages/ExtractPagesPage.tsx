import { useEffect, useMemo, useRef, useState } from 'react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { Dropzone } from '../../components/ui/Dropzone';
import { ExtractOutputPanel } from '../../components/ui/ExtractOutputPanel';
import { FileTable } from '../../components/ui/FileTable';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  extractPages,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  revealInFolder,
} from '../../lib/desktop';
import { fileNameFromPath } from '../../lib/pathUtils';

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type ExtractFile = {
  id: string;
  path: string;
  sizeBytes: number;
  pageCount: number | null;
};

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
  return 'Unknown extract error.';
}

function parsePath(filePath: string): { dir: string; name: string; sep: '/' | '\\' } {
  const sep: '/' | '\\' = filePath.includes('\\') ? '\\' : '/';
  const index = filePath.lastIndexOf(sep);
  if (index < 0) {
    return { dir: '', name: filePath, sep };
  }
  return {
    dir: filePath.slice(0, index),
    name: filePath.slice(index + 1),
    sep,
  };
}

function joinPath(dir: string, name: string, sep: '/' | '\\'): string {
  if (!dir) {
    return name;
  }
  return `${dir}${sep}${name}`;
}

function formatSize(sizeBytes: number): string {
  if (sizeBytes <= 0) {
    return '-';
  }
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function createDefaultExtractOutputName(): string {
  return 'extracted-pages.pdf';
}

export function ExtractPagesPage() {
  const [files, setFiles] = useState<ExtractFile[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState(createDefaultExtractOutputName());
  const [pageRanges, setPageRanges] = useState('');
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);
  const pageRangesInputRef = useRef<HTMLInputElement>(null);

  const canRun = useMemo(
    () =>
      !isLoadingFiles &&
      !isProcessing &&
      files.length === 1 &&
      outputDirectory.trim().length > 0 &&
      outputName.trim().length > 0 &&
      pageRanges.trim().length > 0,
    [isLoadingFiles, isProcessing, files.length, outputDirectory, outputName, pageRanges]
  );

  const actionLabel = isProcessing ? 'Extracting...' : hasCompleted ? 'Extract again' : 'Extract pages';

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
      setLastOutputPath('');
      setStatus({ tone: 'neutral', message: 'Idle' });
      queueMicrotask(() => pageRangesInputRef.current?.focus());
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
    const parsed = parsePath(chosen);
    setOutputDirectory(chosen);
    setPathSeparator(parsed.sep);
    setStatus({ tone: 'info', message: 'Destination selected' });
  }

  function clearSelectedFile() {
    setFiles([]);
    setHasCompleted(false);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Files cleared' });
  }

  function startNewExtract() {
    setFiles([]);
    setHasCompleted(false);
    setLastOutputPath('');
    setOutputName(createDefaultExtractOutputName());
    setPageRanges('');
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  async function handleExtract() {
    if (!canRun || files.length === 0) {
      return;
    }

    if (hasCompleted) {
      setHasCompleted(false);
      setLastOutputPath('');
    }

    setIsProcessing(true);
    setStatus({ tone: 'info', message: 'Extracting...' });
    try {
      const outputPath = joinPath(outputDirectory, outputName.trim(), pathSeparator);
      const result = await extractPages(files[0].path, outputPath, pageRanges.trim());
      setHasCompleted(true);
      setLastOutputPath(result.output_path);
      setStatus({ tone: 'success', message: 'Done: pages extracted' });
    } catch (error) {
      const reason = readErrorMessage(error);
      setStatus({ tone: 'error', message: `Extract failed: ${reason}` });
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
      title="Extract Pages"
      subtitle="Keep only selected page ranges from one PDF"
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
        <ExtractOutputPanel
          outputName={outputName}
          outputInputRef={outputInputRef}
          pageRanges={pageRanges}
          pageRangesInputRef={pageRangesInputRef}
          destinationLabel={destinationFriendlyLabel}
          destinationPath={outputDirectory}
          canRun={canRun}
          isProcessing={isProcessing}
          hasCompleted={hasCompleted}
          actionLabel={actionLabel}
          onOutputNameChange={setOutputName}
          onPageRangesChange={setPageRanges}
          onChooseDestination={() => void handleChooseOutputDirectory()}
          onRun={() => void handleExtract()}
          onNewExtract={startNewExtract}
          onOpenFile={() => void handleOpenFile()}
          onShowInFolder={() => void handleShowInFolder()}
        />
      }
    />
  );
}
