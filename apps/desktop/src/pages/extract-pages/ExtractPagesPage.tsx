import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronsDownUp, Trash2, Upload } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { Dropzone } from '../../components/ui/Dropzone';
import { ExtractOutputPanel } from '../../components/ui/ExtractOutputPanel';
import { PdfThumbnailGrid } from '../../components/ui/PdfThumbnailGrid';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  extractPages,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  readPdfBytes,
  revealInFolder,
} from '../../lib/desktop';
import { renderPdfThumbnails, type PageThumbnail } from '../../lib/pdfPreview';
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

const MAX_PREVIEW_PAGES = 60;

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

function compactPagesToRanges(pages: number[]): string {
  if (pages.length === 0) {
    return '';
  }
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }
    ranges.push(start === previous ? String(start) : `${start}-${previous}`);
    start = current;
    previous = current;
  }

  ranges.push(start === previous ? String(start) : `${start}-${previous}`);
  return ranges.join(',');
}

function parseRangesInput(value: string, maxPage: number): number[] {
  const cleaned = value.trim();
  if (!cleaned) {
    return [];
  }

  const pages: number[] = [];
  for (const token of cleaned.split(',').map((item) => item.trim()).filter((item) => item.length > 0)) {
    const singleMatch = /^(\d+)$/.exec(token);
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (!singleMatch && !rangeMatch) {
      throw new Error(`Invalid range "${token}".`);
    }

    if (singleMatch) {
      const page = Number(singleMatch[1]);
      if (page < 1 || page > maxPage) {
        throw new Error(`Page "${page}" is out of bounds (1-${maxPage}).`);
      }
      pages.push(page);
      continue;
    }

    const start = Number(rangeMatch?.[1]);
    const end = Number(rangeMatch?.[2]);
    if (start < 1 || end < 1 || start > end || end > maxPage) {
      throw new Error(`Invalid range "${token}".`);
    }
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
  }

  return [...new Set(pages)].sort((a, b) => a - b);
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
  const [isRenderingPreviews, setIsRenderingPreviews] = useState(false);
  const [isDropzoneCollapsed, setIsDropzoneCollapsed] = useState(false);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);
  const pageRangesInputRef = useRef<HTMLInputElement>(null);
  const pageCount = files[0]?.pageCount ?? 0;

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

  const selectedPageCount = useMemo(() => {
    if (selectedPages.size > 0) {
      return selectedPages.size;
    }
    if (pageCount <= 0) {
      return 0;
    }
    try {
      return parseRangesInput(pageRanges, pageCount).length;
    } catch {
      return 0;
    }
  }, [selectedPages, pageCount, pageRanges]);

  const actionLabel = isProcessing
    ? 'Extracting...'
    : selectedPageCount > 0
      ? `Extract ${selectedPageCount} ${selectedPageCount === 1 ? 'page' : 'pages'}`
      : 'Extract pages';

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
      setSelectedPages(new Set());
      return;
    }

    const selected = files[0];
    const totalPages = selected.pageCount ?? 0;
    if (totalPages <= 0) {
      setThumbnails([]);
      setSelectedPages(new Set());
      return;
    }

    let cancelled = false;
    setIsRenderingPreviews(true);
    setStatus({ tone: 'info', message: 'Rendering page previews...' });

    void (async () => {
      try {
        const bytes = await readPdfBytes(selected.path);
        const previews = await renderPdfThumbnails(bytes, totalPages, MAX_PREVIEW_PAGES);
        if (cancelled) {
          return;
        }
        setThumbnails(previews);
        setSelectedPages(new Set());
        setStatus({ tone: 'neutral', message: 'Idle' });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const reason = readErrorMessage(error);
        setThumbnails([]);
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

  useEffect(() => {
    const ranges = compactPagesToRanges(Array.from(selectedPages));
    setPageRanges(ranges);
  }, [selectedPages]);

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
      setSelectedPages(new Set());
      setIsDropzoneCollapsed(true);
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
    setThumbnails([]);
    setSelectedPages(new Set());
    setIsDropzoneCollapsed(false);
    setHasCompleted(false);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Files cleared' });
  }

  function startNewExtract() {
    setFiles([]);
    setThumbnails([]);
    setSelectedPages(new Set());
    setIsDropzoneCollapsed(false);
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

  function toggleSelectedPage(pageNumber: number) {
    setSelectedPages((current) => {
      const next = new Set(current);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  }

  function handleClearSelectedPages() {
    setSelectedPages(new Set());
    setStatus({ tone: 'info', message: 'Page selection cleared' });
  }

  function handleSelectAllPages() {
    if (pageCount <= 0) {
      return;
    }
    setSelectedPages(new Set(Array.from({ length: pageCount }, (_, index) => index + 1)));
    setStatus({ tone: 'info', message: 'Selected all pages' });
  }

  function handleSelectOddPages() {
    if (pageCount <= 0) {
      return;
    }
    const oddPages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((page) => page % 2 === 1);
    setSelectedPages(new Set(oddPages));
    setStatus({ tone: 'info', message: 'Selected odd pages' });
  }

  function handleSelectEvenPages() {
    if (pageCount <= 0) {
      return;
    }
    const evenPages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((page) => page % 2 === 0);
    setSelectedPages(new Set(evenPages));
    setStatus({ tone: 'info', message: 'Selected even pages' });
  }

  function handleSelectFirstPage() {
    if (pageCount <= 0) {
      return;
    }
    setSelectedPages(new Set([1]));
    setStatus({ tone: 'info', message: 'Selected first page' });
  }

  function handleLoadRangesFromInput() {
    if (pageCount <= 0) {
      return;
    }
    try {
      const pages = parseRangesInput(pageRanges, pageCount);
      setSelectedPages(new Set(pages));
      setStatus({ tone: 'info', message: pages.length ? 'Applied ranges to page selection' : 'No ranges to apply' });
    } catch (error) {
      const reason = readErrorMessage(error);
      setStatus({ tone: 'error', message: reason });
    }
  }

  const destinationFriendlyLabel = !outputDirectory
    ? 'No destination selected'
    : outputDirectory === defaultDownloadDirectory
    ? 'Downloads'
    : fileNameFromPath(outputDirectory);

  const footerMessage = isLoadingFiles || isRenderingPreviews
    ? 'Processing file...'
    : status.tone === 'neutral'
      ? 'Ready'
      : status.message;

  return (
    <ToolLayout
      title="Extract Pages"
      subtitle="Keep only selected page ranges from one PDF"
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
                <Button
                  variant="ghost"
                  onClick={handleSelectAllPages}
                  disabled={isProcessing || isLoadingFiles || isRenderingPreviews || pageCount <= 0}
                >
                  Select all
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSelectOddPages}
                  disabled={isProcessing || isLoadingFiles || isRenderingPreviews || pageCount <= 0}
                >
                  Odd
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSelectEvenPages}
                  disabled={isProcessing || isLoadingFiles || isRenderingPreviews || pageCount <= 0}
                >
                  Even
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSelectFirstPage}
                  disabled={isProcessing || isLoadingFiles || isRenderingPreviews || pageCount <= 0}
                >
                  First page
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClearSelectedPages}
                  disabled={isProcessing || isLoadingFiles || isRenderingPreviews || selectedPages.size === 0}
                >
                  Deselect all
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLoadRangesFromInput}
                  disabled={
                    isProcessing ||
                    isLoadingFiles ||
                    isRenderingPreviews ||
                    pageCount <= 0 ||
                    pageRanges.trim().length === 0
                  }
                >
                  Load ranges
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
          {files.length === 1 && files[0].pageCount && files[0].pageCount > MAX_PREVIEW_PAGES ? (
            <p className="file-loading-hint">
              Showing first {MAX_PREVIEW_PAGES} pages for preview (of {files[0].pageCount}).
            </p>
          ) : null}
          <PdfThumbnailGrid
            thumbnails={thumbnails}
            selectedPages={selectedPages}
            isLoading={isLoadingFiles || isRenderingPreviews}
            emptyTitle="No files selected"
            emptyHint="Drag & drop PDFs or click to browse"
            onTogglePage={toggleSelectedPage}
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
