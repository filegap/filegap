import { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { ReorderOutputPanel } from '../../components/ui/ReorderOutputPanel';
import { ReorderThumbnailGrid, type ReorderThumbnailItem } from '../../components/ui/ReorderThumbnailGrid';
import { SingleFilePicker } from '../../components/ui/SingleFilePicker';
import { WorkingFileHeader } from '../../components/ui/WorkingFileHeader';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  pathExists,
  readPdfBytes,
  reorderPdf,
  revealInFolder,
} from '../../lib/desktop';
import { renderFilenameTemplate, resolveOutputPathByOverwrite } from '../../lib/outputSettings';
import { joinPath, parsePath, readErrorMessage } from '../../lib/pageHelpers';
import { renderPdfThumbnails } from '../../lib/pdfPreview';
import { fileNameFromPath } from '../../lib/pathUtils';
import { useDesktopSettings } from '../../lib/settings';

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

function createDefaultOutputName(template: string, pageCount = 1): string {
  return renderFilenameTemplate(template, { n: pageCount });
}

function parsePageOrderInput(value: string, pageCount: number): number[] {
  const cleaned = value.trim();
  if (!cleaned) {
    throw new Error('Page order is required.');
  }
  if (pageCount <= 0) {
    throw new Error('No pages available to reorder.');
  }

  const tokens = cleaned
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (tokens.length !== pageCount) {
    throw new Error(`Provide exactly ${pageCount} pages in the new order.`);
  }

  const pages = tokens.map((token) => {
    if (!/^\d+$/.test(token)) {
      throw new Error('Page order must contain numbers separated by commas.');
    }
    return Number(token);
  });

  const unique = new Set(pages);
  if (unique.size !== pages.length) {
    throw new Error('Page order contains duplicate page numbers.');
  }
  if (pages.some((page) => page < 1 || page > pageCount)) {
    throw new Error(`Page order must stay within 1-${pageCount}.`);
  }
  return pages;
}

export function ReorderPdfPage() {
  const [settings] = useDesktopSettings();
  const [files, setFiles] = useState<ReorderFile[]>([]);
  const [thumbnails, setThumbnails] = useState<ReorderThumbnailItem[]>([]);
  const [originalPageOrder, setOriginalPageOrder] = useState<number[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState(createDefaultOutputName(settings.reorderFilenameTemplate));
  const [pageOrderInput, setPageOrderInput] = useState('');
  const [lastValidPageOrderInput, setLastValidPageOrderInput] = useState('');
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isRenderingPreviews, setIsRenderingPreviews] = useState(false);
  const [isDropzoneCollapsed, setIsDropzoneCollapsed] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);
  const pageOrderInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = files[0] ?? null;
  const parsedPageOrder = useMemo(() => thumbnails.map((item) => item.pageNumber), [thumbnails]);
  const expectedPageCount = selectedFile?.pageCount ?? null;
  const hasMatchingPageOrderCount = expectedPageCount ? parsedPageOrder.length === expectedPageCount : parsedPageOrder.length > 0;
  const pageOrderLabel = useMemo(() => parsedPageOrder.join(','), [parsedPageOrder]);
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
      (settings.askDestinationEveryTime || outputDirectory.trim().length > 0) &&
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
      settings.askDestinationEveryTime,
    ]
  );

  const actionLabel = isProcessing ? 'Reordering...' : hasCompleted ? 'Reorder again' : 'Reorder PDF';

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

  useEffect(() => {
    if (files.length !== 1) {
      setThumbnails([]);
      setOriginalPageOrder([]);
      setPageOrderInput('');
      setLastValidPageOrderInput('');
      return;
    }

    const selected = files[0];
    const totalPages = selected.pageCount ?? 0;
    if (totalPages <= 0) {
      setThumbnails([]);
      setOriginalPageOrder([]);
      setPageOrderInput('');
      setLastValidPageOrderInput('');
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
        const initialOrder = previews.map((preview) => preview.pageNumber).join(',');
        setPageOrderInput(initialOrder);
        setLastValidPageOrderInput(initialOrder);
        setStatus({ tone: 'neutral', message: 'Idle' });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const reason = readErrorMessage(error, 'Unknown reorder error.');
        setThumbnails([]);
        setOriginalPageOrder([]);
        setPageOrderInput('');
        setLastValidPageOrderInput('');
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
      setPageOrderInput('');
      setLastValidPageOrderInput('');
      setHasCompleted(false);
      setLastOutputPath('');
      setIsDropzoneCollapsed(true);
      setStatus({ tone: 'neutral', message: 'Idle' });
      queueMicrotask(() => outputInputRef.current?.focus());
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown reorder error.');
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
    setPageOrderInput('');
    setLastValidPageOrderInput('');
    setIsDropzoneCollapsed(false);
    setHasCompleted(false);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Files cleared' });
  }

  function startNewReorder() {
    setFiles([]);
    setThumbnails([]);
    setOriginalPageOrder([]);
    setPageOrderInput('');
    setLastValidPageOrderInput('');
    setIsDropzoneCollapsed(false);
    setHasCompleted(false);
    setLastOutputPath('');
    setOutputName(createDefaultOutputName(settings.reorderFilenameTemplate));
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

    try {
      let runDirectory = outputDirectory;
      if (settings.askDestinationEveryTime) {
        const chosen = await chooseOutputDirectory();
        if (!chosen) {
          return;
        }
        runDirectory = chosen;
        const parsed = parsePath(chosen);
        setPathSeparator(parsed.sep);
        setOutputDirectory(chosen);
      }
      if (runDirectory.trim().length === 0) {
        setStatus({ tone: 'error', message: 'Select a valid output destination.' });
        return;
      }

      setIsProcessing(true);
      setStatus({ tone: 'info', message: 'Reordering...' });

      const candidateOutputPath = joinPath(runDirectory, outputName.trim(), pathSeparator);
      const outputPath = await resolveOutputPathByOverwrite(
        candidateOutputPath,
        settings.overwriteBehavior,
        pathExists,
        async (message) => window.confirm(message)
      );
      if (!outputPath) {
        setStatus({ tone: 'info', message: 'Reorder cancelled.' });
        return;
      }

      const result = await reorderPdf(files[0].path, outputPath, parsedPageOrder);
      setHasCompleted(true);
      setLastOutputPath(result.output_path);
      setStatus({ tone: 'success', message: 'Done: pages reordered' });
      if (settings.openFileAfterExport) {
        try {
          await openFile(result.output_path);
        } catch {
          // Non-blocking post action.
        }
      }
      if (settings.revealInFolderAfterExport) {
        try {
          await revealInFolder(result.output_path);
        } catch {
          // Non-blocking post action.
        }
      }
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown reorder error.');
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
      const nextOrder = next.map((entry) => entry.pageNumber).join(',');
      setPageOrderInput(nextOrder);
      setLastValidPageOrderInput(nextOrder);
      return next;
    });
    setHasCompleted(false);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Page order updated' });
  }

  function applyPageOrderInput(nextValue: string, options?: { revertOnError?: boolean; fromInputEdit?: boolean }) {
    const revertOnError = options?.revertOnError ?? false;
    const fromInputEdit = options?.fromInputEdit ?? false;
    const totalPages = selectedFile?.pageCount ?? 0;

    try {
      const orderedPages = parsePageOrderInput(nextValue, totalPages);
      setThumbnails((current) => {
        const byPage = new Map(current.map((item) => [item.pageNumber, item]));
        const reordered = orderedPages
          .map((pageNumber) => byPage.get(pageNumber))
          .filter((item): item is ReorderThumbnailItem => item !== undefined);
        return reordered.length === current.length ? reordered : current;
      });
      const normalized = orderedPages.join(',');
      setPageOrderInput(normalized);
      setLastValidPageOrderInput(normalized);
      if (fromInputEdit) {
        setStatus({ tone: 'info', message: 'Page order updated' });
      }
      setHasCompleted(false);
      setLastOutputPath('');
    } catch {
      if (revertOnError) {
        setPageOrderInput(lastValidPageOrderInput);
      }
    }
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
      const restoredOrder = restored.map((entry) => entry.pageNumber).join(',');
      setPageOrderInput(restoredOrder);
      setLastValidPageOrderInput(restoredOrder);
      return restored.length === current.length ? restored : current;
    });
    setHasCompleted(false);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Original order restored' });
  }

  const destinationFriendlyLabel = !outputDirectory
    ? settings.askDestinationEveryTime
      ? 'Ask every time'
      : 'No destination selected'
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
          <SingleFilePicker
            hasFile={files.length > 0}
            isCollapsed={isDropzoneCollapsed}
            disabled={isProcessing || isLoadingFiles}
            fileCount={files.length}
            onSelectFiles={() => void handleSelectInput()}
            onShowPicker={() => setIsDropzoneCollapsed(false)}
            onHidePicker={() => setIsDropzoneCollapsed(true)}
          />
          {files.length > 0 ? (
            <WorkingFileHeader
              title={fileNameFromPath(files[0].path)}
              titleAttribute={fileNameFromPath(files[0].path)}
            >
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
            </WorkingFileHeader>
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
          pageOrderValue={pageOrderInput || pageOrderLabel}
          pageOrderInputRef={pageOrderInputRef}
          destinationLabel={destinationFriendlyLabel}
          destinationPath={outputDirectory}
          canRun={canRun}
          isProcessing={isProcessing}
          hasCompleted={hasCompleted}
          actionLabel={actionLabel}
          onOutputNameChange={setOutputName}
          onPageOrderChange={(next) => {
            setPageOrderInput(next);
            applyPageOrderInput(next, { fromInputEdit: true });
          }}
          onPageOrderBlur={() => applyPageOrderInput(pageOrderInput, { revertOnError: true })}
          onPageOrderSubmit={() => applyPageOrderInput(pageOrderInput, { revertOnError: true })}
          isPageOrderDisabled={files.length !== 1 || isLoadingFiles || isRenderingPreviews}
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
