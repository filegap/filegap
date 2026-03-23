import { useEffect, useMemo, useRef, useState } from 'react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { Dropzone } from '../../components/ui/Dropzone';
import { FileTable } from '../../components/ui/FileTable';
import { OutputPanel } from '../../components/ui/OutputPanel';
import {
  chooseOutputDirectory,
  choosePdfInputs,
  getDownloadDirectory,
  inspectPdfFiles,
  mergePdfs,
  openFile,
  pathExists,
  revealInFolder,
  type PdfFileInfo,
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

type MergeFile = {
  id: string;
  path: string;
  sizeBytes: number;
  pageCount: number | null;
};

function toInfoMap(list: PdfFileInfo[]): Map<string, PdfFileInfo> {
  return new Map(list.map((item) => [item.path, item]));
}

function createDefaultOutputName(fileCount: number, template: string): string {
  return renderFilenameTemplate(template, { n: fileCount >= 2 ? fileCount : 1 });
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

export function MergePdfPage() {
  const [settings] = useDesktopSettings();
  const [files, setFiles] = useState<MergeFile[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState(createDefaultOutputName(0, settings.mergeFilenameTemplate));
  const [isOutputNameDirty, setIsOutputNameDirty] = useState(false);
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string[] | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [completedMergeCount, setCompletedMergeCount] = useState<number | null>(null);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [status, setStatus] = useState<StatusState>({
    tone: 'neutral',
    message: 'Idle',
  });
  const outputInputRef = useRef<HTMLInputElement>(null);
  const processingFilesMessage = pendingSelection?.length
    ? `Processing ${pendingSelection.length} files...`
    : 'Processing files...';

  const canMerge = useMemo(
    () =>
      !isLoadingFiles &&
      files.length >= 2 &&
      (settings.askDestinationEveryTime || outputDirectory.trim().length > 0) &&
      outputName.trim().length > 0,
    [files, outputDirectory, outputName, isLoadingFiles, settings.askDestinationEveryTime]
  );

  const mergeActionLabel = isProcessing ? 'Merging...' : hasCompleted ? 'Merge again' : 'Merge PDF';

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
    if (isOutputNameDirty) {
      return;
    }
    setOutputName(createDefaultOutputName(files.length, settings.mergeFilenameTemplate));
  }, [files.length, isOutputNameDirty, settings.mergeFilenameTemplate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'o') {
        return;
      }
      event.preventDefault();
      if (!isProcessing && !isLoadingFiles) {
        void handleSelectInputs();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isProcessing, isLoadingFiles]);

  useEffect(() => {
    if (!pendingSelection || pendingSelection.length === 0) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const fileInfos = await inspectPdfFiles(pendingSelection);
        if (cancelled) {
          return;
        }

        const infoMap = toInfoMap(fileInfos);
        const nextRows = pendingSelection.map((path) => {
          const info = infoMap.get(path);
          return {
            id: `${path}-${Math.random().toString(16).slice(2)}`,
            path,
            sizeBytes: info?.size_bytes ?? 0,
            pageCount: info?.page_count ?? null,
          };
        });

        setFiles((current) => [...current, ...nextRows]);
        setHasCompleted(false);
        setCompletedMergeCount(null);
        setStatus({ tone: 'neutral', message: 'Idle' });
        queueMicrotask(() => outputInputRef.current?.focus());
      } catch (error) {
        const reason = readErrorMessage(error, 'Unknown merge error.');
        if (!cancelled) {
          setStatus({ tone: 'error', message: `Failed to inspect files: ${reason}` });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFiles(false);
          setPendingSelection(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingSelection]);

  async function handleSelectInputs() {
    const selected = await choosePdfInputs();
    if (selected.length === 0) {
      return;
    }

    setIsLoadingFiles(true);
    setStatus({ tone: 'info', message: 'Processing files...' });
    setPendingSelection(selected);
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

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
    setHasCompleted(false);
    setCompletedMergeCount(null);
    setStatus({ tone: 'info', message: 'File removed' });
  }

  function reorderFiles(fromIndex: number, toIndex: number) {
    setFiles((current) => {
      if (toIndex < 0 || toIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
    setHasCompleted(false);
    setCompletedMergeCount(null);
    setStatus({ tone: 'info', message: 'Order updated' });
  }

  function clearAllFiles() {
    setFiles([]);
    setHasCompleted(false);
    setCompletedMergeCount(null);
    setLastOutputPath('');
    setStatus({ tone: 'info', message: 'Files cleared' });
  }

  function startNewMerge() {
    setFiles([]);
    setHasCompleted(false);
    setCompletedMergeCount(null);
    setLastOutputPath('');
    setOutputName(createDefaultOutputName(0, settings.mergeFilenameTemplate));
    setIsOutputNameDirty(false);
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  async function handleMerge() {
    if (!canMerge || isProcessing) {
      return;
    }

    if (hasCompleted) {
      setHasCompleted(false);
      setCompletedMergeCount(null);
      setLastOutputPath('');
      await waitForNextFrame();
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
      setCompletedMergeCount(null);
      setStatus({ tone: 'info', message: 'Merging...' });

      const candidateOutputPath = joinPath(runDirectory, outputName.trim(), pathSeparator);
      const outputPath = await resolveOutputPathByOverwrite(
        candidateOutputPath,
        settings.overwriteBehavior,
        pathExists,
        async (message) => window.confirm(message)
      );
      if (!outputPath) {
        setStatus({ tone: 'info', message: 'Merge cancelled.' });
        return;
      }

      const result = await mergePdfs(
        files.map((file) => file.path),
        outputPath
      );
      setLastOutputPath(outputPath);
      setHasCompleted(true);
      setCompletedMergeCount(result.input_count);
      setStatus({
        tone: 'success',
        message: `Done: ${result.input_count} files merged`,
      });
      if (settings.openFileAfterExport) {
        try {
          await openFile(outputPath);
        } catch {
          // Non-blocking post action.
        }
      }
      if (settings.revealInFolderAfterExport) {
        try {
          await revealInFolder(outputPath);
        } catch {
          // Non-blocking post action.
        }
      }
    } catch {
      setStatus({
        tone: 'error',
        message: 'Merge failed. Please try again.',
      });
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
    sizeLabel: formatKilobytes(file.sizeBytes),
    pagesLabel: file.pageCount ? String(file.pageCount) : '-',
  }));
  const tableRows = isLoadingFiles ? [] : rows;

  const destinationFriendlyLabel = settings.askDestinationEveryTime
    ? 'Ask every time'
    : !outputDirectory
    ? 'No destination selected'
    : outputDirectory === defaultDownloadDirectory
    ? 'Downloads'
    : fileNameFromPath(outputDirectory);

  const footerMessage = isLoadingFiles ? processingFilesMessage : status.tone === 'neutral' ? 'Ready' : status.message;

  return (
    <ToolLayout
      title="Merge PDF"
      subtitle="Combine multiple PDF files into one document"
      footerMessage={footerMessage}
      leftPanel={
        <div className="merge-left-panel">
          <Dropzone disabled={isProcessing || isLoadingFiles} fileCount={files.length} onSelectFiles={() => void handleSelectInputs()} />
          {files.length > 0 ? (
            <div className="uploaded-files-header">
              <p>Selected files ({files.length})</p>
              <Button variant="ghost" onClick={clearAllFiles} disabled={isProcessing || isLoadingFiles}>
                Clear all
              </Button>
            </div>
          ) : null}
          {isLoadingFiles ? <p className="file-loading-hint">{processingFilesMessage}</p> : null}
          <FileTable rows={tableRows} onRemove={removeFile} onReorder={reorderFiles} isLoading={isLoadingFiles} />
        </div>
      }
      rightPanel={
        <OutputPanel
          outputName={outputName}
          outputInputRef={outputInputRef}
          destinationLabel={destinationFriendlyLabel}
          destinationPath={outputDirectory}
          canRun={canMerge}
          isProcessing={isProcessing}
          hasCompleted={hasCompleted}
          completedMergeCount={completedMergeCount}
          mergeActionLabel={mergeActionLabel}
          onOutputNameChange={(next) => {
            setOutputName(next);
            setIsOutputNameDirty(true);
          }}
          onChooseDestination={() => void handleChooseOutputDirectory()}
          onRun={() => void handleMerge()}
          onNewMerge={startNewMerge}
          onOpenFile={() => void handleOpenFile()}
          onShowInFolder={() => void handleShowInFolder()}
        />
      }
    />
  );
}
