import { useEffect, useMemo, useRef, useState } from 'react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { Dropzone } from '../../components/ui/Dropzone';
import { FileTable } from '../../components/ui/FileTable';
import { ReorderOutputPanel } from '../../components/ui/ReorderOutputPanel';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  reorderPdf,
  revealInFolder,
} from '../../lib/desktop';
import { fileNameFromPath } from '../../lib/pathUtils';

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type ReorderFile = {
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
  return 'Unknown reorder error.';
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

function createDefaultOutputName(): string {
  return 'reordered.pdf';
}

function parsePageOrderInput(value: string): number[] {
  return value
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => Number(token))
    .filter((page) => Number.isInteger(page) && page > 0);
}

function buildSequentialPageOrder(pageCount: number): string {
  if (pageCount <= 0) {
    return '';
  }
  return Array.from({ length: pageCount }, (_, index) => String(index + 1)).join(',');
}

export function ReorderPdfPage() {
  const [files, setFiles] = useState<ReorderFile[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState(createDefaultOutputName());
  const [pageOrderInput, setPageOrderInput] = useState('');
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);
  const pageOrderInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = files[0] ?? null;
  const parsedPageOrder = useMemo(() => parsePageOrderInput(pageOrderInput), [pageOrderInput]);
  const expectedPageCount = selectedFile?.pageCount ?? null;
  const hasMatchingPageOrderCount = expectedPageCount ? parsedPageOrder.length === expectedPageCount : parsedPageOrder.length > 0;

  const canRun = useMemo(
    () =>
      !isLoadingFiles &&
      !isProcessing &&
      files.length === 1 &&
      outputDirectory.trim().length > 0 &&
      outputName.trim().length > 0 &&
      parsedPageOrder.length > 0 &&
      hasMatchingPageOrderCount,
    [
      isLoadingFiles,
      isProcessing,
      files.length,
      outputDirectory,
      outputName,
      parsedPageOrder.length,
      hasMatchingPageOrderCount,
    ]
  );

  const actionLabel = isProcessing ? 'Reordering...' : hasCompleted ? 'Reorder again' : 'Reorder PDF';

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
      const pageCount = info?.page_count ?? null;
      setFiles([
        {
          id: `${selected}-${Math.random().toString(16).slice(2)}`,
          path: selected,
          sizeBytes: info?.size_bytes ?? 0,
          pageCount,
        },
      ]);
      setPageOrderInput(pageCount ? buildSequentialPageOrder(pageCount) : '');
      setHasCompleted(false);
      setLastOutputPath('');
      setStatus({ tone: 'neutral', message: 'Idle' });
      queueMicrotask(() => pageOrderInputRef.current?.focus());
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
    setPageOrderInput('');
    setHasCompleted(false);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Files cleared' });
  }

  function startNewReorder() {
    setFiles([]);
    setPageOrderInput('');
    setHasCompleted(false);
    setLastOutputPath('');
    setOutputName(createDefaultOutputName());
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  async function handleReorder() {
    if (!canRun || files.length === 0) {
      return;
    }

    if (hasCompleted) {
      setHasCompleted(false);
      setLastOutputPath('');
    }

    setIsProcessing(true);
    setStatus({ tone: 'info', message: 'Reordering...' });
    try {
      const outputPath = joinPath(outputDirectory, outputName.trim(), pathSeparator);
      const result = await reorderPdf(files[0].path, outputPath, parsedPageOrder);
      setHasCompleted(true);
      setLastOutputPath(result.output_path);
      setStatus({ tone: 'success', message: 'Done: pages reordered' });
    } catch (error) {
      const reason = readErrorMessage(error);
      setStatus({ tone: 'error', message: `Reorder failed: ${reason}` });
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

  const pageOrderHint =
    expectedPageCount && !hasMatchingPageOrderCount
      ? `Provide exactly ${expectedPageCount} pages in the new order.`
      : '';

  const footerMessage = isLoadingFiles
    ? 'Processing file...'
    : pageOrderHint || (status.tone === 'neutral' ? 'Ready' : status.message);

  return (
    <ToolLayout
      title="Reorder PDF"
      subtitle="Change page sequence for one PDF file"
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
        <ReorderOutputPanel
          outputName={outputName}
          outputInputRef={outputInputRef}
          pageOrder={pageOrderInput}
          pageOrderInputRef={pageOrderInputRef}
          destinationLabel={destinationFriendlyLabel}
          destinationPath={outputDirectory}
          canRun={canRun}
          isProcessing={isProcessing}
          hasCompleted={hasCompleted}
          actionLabel={actionLabel}
          onOutputNameChange={setOutputName}
          onPageOrderChange={setPageOrderInput}
          onChooseDestination={() => void handleChooseOutputDirectory()}
          onRun={() => void handleReorder()}
          onNewReorder={startNewReorder}
          onOpenFile={() => void handleOpenFile()}
          onShowInFolder={() => void handleShowInFolder()}
        />
      }
    />
  );
}
