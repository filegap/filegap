import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronsDownUp, Trash2, Upload } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { Dropzone } from '../../components/ui/Dropzone';
import { SplitOutputPanel } from '../../components/ui/SplitOutputPanel';
import { SplitThumbnailGrid } from '../../components/ui/SplitThumbnailGrid';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  readPdfBytes,
  revealInFolder,
  splitPdf,
} from '../../lib/desktop';
import { renderPdfThumbnails, type PageThumbnail } from '../../lib/pdfPreview';
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

const MAX_PREVIEW_PAGES = 60;
type SplitMode = 'pages' | 'ranges';
type SplitRangeSegment = { start: number; end: number };

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

function parseSplitRangeSegments(value: string, maxPage: number): SplitRangeSegment[] {
  const cleaned = value.trim();
  if (!cleaned) {
    return [];
  }

  const segments = cleaned.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
  const ranges: SplitRangeSegment[] = [];
  const seenPages = new Set<number>();

  for (const token of segments) {
    const singleMatch = /^(\d+)$/.exec(token);
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (!singleMatch && !rangeMatch) {
      throw new Error(`Invalid range "${token}".`);
    }

    const start = Number(singleMatch ? singleMatch[1] : rangeMatch?.[1]);
    const end = Number(singleMatch ? singleMatch[1] : rangeMatch?.[2]);
    if (start < 1 || end < 1 || start > end || end > maxPage) {
      throw new Error(`Invalid range "${token}".`);
    }

    for (let page = start; page <= end; page += 1) {
      if (seenPages.has(page)) {
        throw new Error(`Overlapping ranges are not allowed ("${token}").`);
      }
      seenPages.add(page);
    }

    ranges.push({ start, end });
  }

  return ranges;
}

function formatSplitRangeSegments(ranges: SplitRangeSegment[]): string {
  return ranges.map((range) => (range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`)).join(',');
}

function buildSplitRangesFromStarts(starts: Set<number>, maxPage: number): SplitRangeSegment[] {
  if (maxPage <= 0 || starts.size === 0) {
    return [];
  }

  const sortedStarts = [...starts]
    .filter((page) => page > 1 && page <= maxPage)
    .sort((a, b) => a - b);
  const effectiveStarts = [1, ...sortedStarts];
  const segments: SplitRangeSegment[] = [];

  for (let index = 0; index < effectiveStarts.length; index += 1) {
    const start = effectiveStarts[index];
    const nextStart = effectiveStarts[index + 1];
    const end = nextStart ? nextStart - 1 : maxPage;
    if (start <= end) {
      segments.push({ start, end });
    }
  }

  return segments;
}

export function SplitPdfPage() {
  const [files, setFiles] = useState<SplitFile[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputBaseName, setOutputBaseName] = useState('split');
  const [splitMode, setSplitMode] = useState<SplitMode>('pages');
  const [pagesPerFile, setPagesPerFile] = useState(1);
  const [pageRanges, setPageRanges] = useState('');
  const [lastValidPageRanges, setLastValidPageRanges] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isRenderingPreviews, setIsRenderingPreviews] = useState(false);
  const [isDropzoneCollapsed, setIsDropzoneCollapsed] = useState(false);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [splitStartPages, setSplitStartPages] = useState<Set<number>>(new Set());
  const [hasCompleted, setHasCompleted] = useState(false);
  const [completedOutputCount, setCompletedOutputCount] = useState<number | null>(null);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);
  const pageRangesInputRef = useRef<HTMLInputElement>(null);
  const isRangesSyncFromInputRef = useRef(false);
  const pageCount = files[0]?.pageCount ?? 0;
  const parsedRangeSegments = useMemo(() => {
    if (splitMode !== 'ranges' || pageCount <= 0 || !pageRanges.trim()) {
      return null;
    }
    try {
      return parseSplitRangeSegments(pageRanges, pageCount);
    } catch {
      return null;
    }
  }, [splitMode, pageCount, pageRanges]);
  const rangeStartPages = useMemo(() => {
    const starts = new Set<number>();
    if (splitMode === 'pages') {
      const step = Math.max(1, pagesPerFile);
      for (let page = 1; page <= pageCount; page += step) {
        starts.add(page);
      }
      return starts;
    }
    if (pageCount <= 0) {
      return starts;
    }
    if (!pageRanges.trim() && splitStartPages.size === 0) {
      return starts;
    }
    starts.add(1);
    for (const page of splitStartPages) {
      starts.add(page);
    }
    return starts;
  }, [splitMode, pagesPerFile, pageCount, splitStartPages]);

  const canRun = useMemo(
    () =>
      !isLoadingFiles &&
      !isProcessing &&
      files.length === 1 &&
      outputDirectory.trim().length > 0 &&
      outputBaseName.trim().length > 0 &&
      (splitMode === 'pages' ? pagesPerFile > 0 : parsedRangeSegments !== null && parsedRangeSegments.length > 0),
    [isLoadingFiles, isProcessing, files.length, outputDirectory, outputBaseName, splitMode, pagesPerFile, parsedRangeSegments]
  );

  const actionLabel = isProcessing ? 'Splitting...' : hasCompleted ? 'Split again' : 'Split PDF';

  useEffect(() => {
    if (files.length !== 1) {
      setThumbnails([]);
      setSplitStartPages(new Set());
      setPageRanges('');
      setLastValidPageRanges('');
      return;
    }

    const selected = files[0];
    const totalPages = selected.pageCount ?? 0;
    if (totalPages <= 0) {
      setThumbnails([]);
      setSplitStartPages(new Set());
      setPageRanges('');
      setLastValidPageRanges('');
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
        setSplitStartPages(new Set());
        setPageRanges('');
        setLastValidPageRanges('');
        setStatus({ tone: 'neutral', message: 'Idle' });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const reason = readErrorMessage(error);
        setThumbnails([]);
        setSplitStartPages(new Set());
        setPageRanges('');
        setLastValidPageRanges('');
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
    if (splitMode !== 'ranges') {
      return;
    }
    if (isRangesSyncFromInputRef.current) {
      isRangesSyncFromInputRef.current = false;
      return;
    }
    const ranges = formatSplitRangeSegments(buildSplitRangesFromStarts(splitStartPages, pageCount));
    setPageRanges(ranges);
    setLastValidPageRanges(ranges);
  }, [splitStartPages, splitMode, pageCount]);

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
      setThumbnails([]);
      setSplitStartPages(new Set());
      setPageRanges('');
      setLastValidPageRanges('');
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
    setOutputDirectory(chosen);
    setStatus({ tone: 'info', message: 'Destination selected' });
  }

  function clearSelectedFile() {
    setFiles([]);
    setThumbnails([]);
    setSplitStartPages(new Set());
    setPageRanges('');
    setLastValidPageRanges('');
    setIsDropzoneCollapsed(false);
    setHasCompleted(false);
    setCompletedOutputCount(null);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Files cleared' });
  }

  function startNewSplit() {
    setFiles([]);
    setThumbnails([]);
    setSplitStartPages(new Set());
    setPageRanges('');
    setLastValidPageRanges('');
    setSplitMode('pages');
    setIsDropzoneCollapsed(false);
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
      const result = await splitPdf(
        files[0].path,
        outputDirectory,
        outputBaseName.trim(),
        pagesPerFile,
        splitMode === 'ranges' ? pageRanges : undefined
      );
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

  function toggleSelectedPage(pageNumber: number) {
    if (splitMode !== 'ranges') {
      setSplitMode('ranges');
    }
    if (pageNumber <= 1) {
      return;
    }
    setSplitStartPages((current) => {
      const next = new Set(current);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      const nextRanges = formatSplitRangeSegments(buildSplitRangesFromStarts(next, pageCount));
      setPageRanges(nextRanges);
      setLastValidPageRanges(nextRanges);
      setHasCompleted(false);
      setCompletedOutputCount(null);
      setLastOutputPath('');
      return next;
    });
  }

  function clearRangeSelection() {
    setSplitStartPages(new Set());
    setPageRanges('');
    setLastValidPageRanges('');
    setHasCompleted(false);
    setCompletedOutputCount(null);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Range selection cleared' });
  }

  function applyPageRangesInput(nextValue: string, options?: { revertOnError?: boolean; fromInputEdit?: boolean }) {
    const revertOnError = options?.revertOnError ?? false;
    const fromInputEdit = options?.fromInputEdit ?? false;
    if (pageCount <= 0) {
      return;
    }

    const cleaned = nextValue.trim();
    if (!cleaned) {
      isRangesSyncFromInputRef.current = fromInputEdit;
      setSplitStartPages(new Set());
      setPageRanges('');
      setLastValidPageRanges('');
      return;
    }

    try {
      const ranges = parseSplitRangeSegments(cleaned, pageCount);
      const starts = new Set<number>(ranges.map((range) => range.start).filter((page) => page > 1));
      const normalized = formatSplitRangeSegments(ranges);
      isRangesSyncFromInputRef.current = fromInputEdit;
      setSplitStartPages(starts);
      if (fromInputEdit) {
        setPageRanges(nextValue);
        setLastValidPageRanges(nextValue);
      } else {
        setPageRanges(normalized);
        setLastValidPageRanges(normalized);
      }
      setHasCompleted(false);
      setCompletedOutputCount(null);
      setLastOutputPath('');
    } catch (error) {
      if (revertOnError) {
        setPageRanges(lastValidPageRanges);
        const reason = readErrorMessage(error);
        setStatus({ tone: 'error', message: reason });
      }
    }
  }

  const destinationFriendlyLabel = !outputDirectory
    ? 'No destination selected'
    : outputDirectory === defaultDownloadDirectory
    ? 'Downloads'
    : fileNameFromPath(outputDirectory);

  const footerMessage =
    isLoadingFiles || isRenderingPreviews ? 'Processing file...' : status.tone === 'neutral' ? 'Ready' : status.message;

  return (
    <ToolLayout
      title="Split PDF"
      subtitle="Split one PDF into multiple documents"
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
                {splitMode === 'ranges' ? (
                  <Button
                    variant="ghost"
                    onClick={clearRangeSelection}
                    disabled={isProcessing || isLoadingFiles || isRenderingPreviews || splitStartPages.size === 0}
                  >
                    Deselect all
                  </Button>
                ) : null}
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
          <SplitThumbnailGrid
            thumbnails={thumbnails}
            selectedPages={splitMode === 'ranges' ? splitStartPages : new Set()}
            rangeStartPages={rangeStartPages}
            isLoading={isLoadingFiles || isRenderingPreviews}
            onTogglePage={toggleSelectedPage}
          />
        </div>
      }
      rightPanel={
        <SplitOutputPanel
          splitMode={splitMode}
          outputBaseName={outputBaseName}
          outputInputRef={outputInputRef}
          pagesPerFile={pagesPerFile}
          pageRanges={pageRanges}
          pageRangesInputRef={pageRangesInputRef}
          destinationLabel={destinationFriendlyLabel}
          destinationPath={outputDirectory}
          canRun={canRun}
          isProcessing={isProcessing}
          hasCompleted={hasCompleted}
          completedOutputCount={completedOutputCount}
          actionLabel={actionLabel}
          onSplitModeChange={setSplitMode}
          onOutputBaseNameChange={setOutputBaseName}
          onPagesPerFileChange={setPagesPerFile}
          onPageRangesChange={(next) => {
            setSplitMode('ranges');
            setPageRanges(next);
            applyPageRangesInput(next, { fromInputEdit: true });
          }}
          onPageRangesBlur={() => applyPageRangesInput(pageRanges, { revertOnError: true })}
          onPageRangesSubmit={() => applyPageRangesInput(pageRanges, { revertOnError: true })}
          isPageRangesDisabled={files.length !== 1 || isLoadingFiles || isRenderingPreviews || splitMode !== 'ranges'}
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
