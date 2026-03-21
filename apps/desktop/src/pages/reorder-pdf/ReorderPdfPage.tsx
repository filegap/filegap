import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronsDownUp, Trash2, Upload } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { Dropzone } from '../../components/ui/Dropzone';
import { ReorderOutputPanel } from '../../components/ui/ReorderOutputPanel';
import { ReorderThumbnailGrid, type ReorderThumbnailItem } from '../../components/ui/ReorderThumbnailGrid';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  readPdfBytes,
  reorderPdf,
  revealInFolder,
} from '../../lib/desktop';
import { renderPdfThumbnails } from '../../lib/pdfPreview';
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

function createDefaultOutputName(): string {
  return 'reordered.pdf';
}

export function ReorderPdfPage() {
  const [files, setFiles] = useState<ReorderFile[]>([]);
  const [thumbnails, setThumbnails] = useState<ReorderThumbnailItem[]>([]);
  const [originalPageOrder, setOriginalPageOrder] = useState<number[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState(createDefaultOutputName());
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isRenderingPreviews, setIsRenderingPreviews] = useState(false);
  const [isDropzoneCollapsed, setIsDropzoneCollapsed] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = files[0] ?? null;
  const parsedPageOrder = useMemo(() => thumbnails.map((item) => item.pageNumber), [thumbnails]);
  const expectedPageCount = selectedFile?.pageCount ?? null;
  const hasMatchingPageOrderCount = expectedPageCount ? parsedPageOrder.length === expectedPageCount : parsedPageOrder.length > 0;
  const pageOrderLabel = useMemo(() => {
    const full = parsedPageOrder.join(',');
    return full.length > 80 ? `${full.slice(0, 80)}...` : full;
  }, [parsedPageOrder]);
  const canRestoreOrder = useMemo(() => {
    if (parsedPageOrder.length === 0 || originalPageOrder.length === 0) {
      return false;
    }
    if (parsedPageOrder.length !== originalPageOrder.length) {
      return false;
    }
    return parsedPageOrder.some((pageNumber, index) => pageNumber !== originalPageOrder[index]);
  }, [parsedPageOrder, originalPageOrder]);

  const canRun = useMemo(
    () =>
      !isLoadingFiles &&
      !isRenderingPreviews &&
      !isProcessing &&
      files.length === 1 &&
      outputDirectory.trim().length > 0 &&
      outputName.trim().length > 0 &&
      parsedPageOrder.length > 0 &&
      hasMatchingPageOrderCount,
    [
      isLoadingFiles,
      isRenderingPreviews,
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

  useEffect(() => {
    if (files.length !== 1) {
      setThumbnails([]);
      setOriginalPageOrder([]);
      return;
    }

    const selected = files[0];
    const totalPages = selected.pageCount ?? 0;
    if (totalPages <= 0) {
      setThumbnails([]);
      setOriginalPageOrder([]);
      return;
    }

    let cancelled = false;
    setIsRenderingPreviews(true);
    setStatus({ tone: 'info', message: 'Rendering page previews...' });

    void (async () => {
      try {
        const bytes = await readPdfBytes(selected.path);
        const previews = await renderPdfThumbnails(bytes, totalPages, totalPages);
        if (cancelled) {
          return;
        }
        setThumbnails(previews);
        setOriginalPageOrder(previews.map((preview) => preview.pageNumber));
        setStatus({ tone: 'neutral', message: 'Idle' });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const reason = readErrorMessage(error);
        setThumbnails([]);
        setOriginalPageOrder([]);
        setStatus({ tone: 'error', message: `Preview rendering failed: ${reason}` });
      } finally {
        if (!cancelled) {
          setIsRenderingPreviews(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [files]);

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
      setThumbnails([]);
      setOriginalPageOrder([]);
      setHasCompleted(false);
      setLastOutputPath('');
      setIsDropzoneCollapsed(true);
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
    const parsed = parsePath(chosen);
    setOutputDirectory(chosen);
    setPathSeparator(parsed.sep);
    setStatus({ tone: 'info', message: 'Destination selected' });
  }

  function clearSelectedFile() {
    setFiles([]);
    setThumbnails([]);
    setOriginalPageOrder([]);
    setIsDropzoneCollapsed(false);
    setHasCompleted(false);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Files cleared' });
  }

  function startNewReorder() {
    setFiles([]);
    setThumbnails([]);
    setOriginalPageOrder([]);
    setIsDropzoneCollapsed(false);
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

  function reorderThumbnails(fromIndex: number, toIndex: number) {
    setThumbnails((current) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
    setHasCompleted(false);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Page order updated' });
  }

  function restoreOriginalOrder() {
    if (!canRestoreOrder || originalPageOrder.length === 0) {
      return;
    }
    setThumbnails((current) => {
      const byPage = new Map(current.map((item) => [item.pageNumber, item]));
      const restored = originalPageOrder
        .map((pageNumber) => byPage.get(pageNumber))
        .filter((item): item is ReorderThumbnailItem => item !== undefined);
      return restored.length === current.length ? restored : current;
    });
    setHasCompleted(false);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Original order restored' });
  }

  const destinationFriendlyLabel = !outputDirectory
    ? 'No destination selected'
    : outputDirectory === defaultDownloadDirectory
      ? 'Downloads'
      : fileNameFromPath(outputDirectory);

  const pageOrderHint =
    expectedPageCount && !hasMatchingPageOrderCount
      ? `Provide exactly ${expectedPageCount} pages in the new order.`
      : '';

  const footerMessage = isLoadingFiles || isRenderingPreviews
    ? 'Processing file...'
    : pageOrderHint || (status.tone === 'neutral' ? 'Ready' : status.message);

  return (
    <ToolLayout
      title="Reorder PDF"
      subtitle="Change page sequence for one PDF file"
      footerMessage={footerMessage}
      leftPanel={
        <div className="merge-left-panel">
          {files.length === 0 ? (
            <Dropzone disabled={isProcessing || isLoadingFiles} fileCount={files.length} onSelectFiles={() => void handleSelectInput()} />
          ) : isDropzoneCollapsed ? (
            <button
              type="button"
              className="extract-picker-collapsed-bar"
              onClick={() => setIsDropzoneCollapsed(false)}
              aria-label="Show file picker"
              title="Show file picker"
            >
              <span className="extract-picker-collapsed-left" aria-hidden="true">
                <Upload />
              </span>
              <span className="extract-picker-collapsed-right" aria-hidden="true">
                <ChevronLeft />
              </span>
            </button>
          ) : (
            <div className="extract-dropzone-shell">
              <button
                type="button"
                className="extract-dropzone-collapse-btn"
                onClick={() => setIsDropzoneCollapsed(true)}
                aria-label="Hide file picker"
                title="Hide file picker"
              >
                <ChevronsDownUp />
              </button>
              <Dropzone disabled={isProcessing || isLoadingFiles} fileCount={files.length} onSelectFiles={() => void handleSelectInput()} />
            </div>
          )}
          {files.length > 0 ? (
            <div className="uploaded-files-header">
              <p className="uploaded-file-name" title={fileNameFromPath(files[0].path)}>
                {fileNameFromPath(files[0].path)}
              </p>
              <div className="stack-row">
                <Button variant="ghost" onClick={restoreOriginalOrder} disabled={!canRestoreOrder || isProcessing || isLoadingFiles}>
                  Restore
                </Button>
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
              </div>
            </div>
          ) : null}
          {isLoadingFiles ? <p className="file-loading-hint">Processing file...</p> : null}
          <ReorderThumbnailGrid
            items={thumbnails}
            isLoading={isLoadingFiles || isRenderingPreviews}
            onReorder={reorderThumbnails}
          />
        </div>
      }
      rightPanel={
        <ReorderOutputPanel
          outputName={outputName}
          outputInputRef={outputInputRef}
          pageOrderLabel={pageOrderLabel}
          destinationLabel={destinationFriendlyLabel}
          destinationPath={outputDirectory}
          canRun={canRun}
          isProcessing={isProcessing}
          hasCompleted={hasCompleted}
          actionLabel={actionLabel}
          onOutputNameChange={setOutputName}
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
