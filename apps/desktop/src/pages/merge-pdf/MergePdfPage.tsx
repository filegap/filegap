import { useEffect, useMemo, useRef, useState } from 'react';
import { ToolLayout } from '../../components/layout/ToolLayout';
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
  revealInFolder,
  type PdfFileInfo,
} from '../../lib/desktop';
import { fileNameFromPath } from '../../lib/pathUtils';

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
  return 'Unknown merge error.';
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

function toInfoMap(list: PdfFileInfo[]): Map<string, PdfFileInfo> {
  return new Map(list.map((item) => [item.path, item]));
}

function createDefaultOutputName(fileCount: number): string {
  if (fileCount >= 2) {
    return `merged-${fileCount}-files.pdf`;
  }
  return 'merged.pdf';
}

export function MergePdfPage() {
  const [files, setFiles] = useState<MergeFile[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState('merged.pdf');
  const [isOutputNameDirty, setIsOutputNameDirty] = useState(false);
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [status, setStatus] = useState<StatusState>({
    tone: 'neutral',
    message: 'Idle',
  });
  const outputInputRef = useRef<HTMLInputElement>(null);

  const canMerge = useMemo(
    () => files.length >= 2 && outputDirectory.trim().length > 0 && outputName.trim().length > 0,
    [files, outputDirectory, outputName]
  );

  const mergeActionLabel = isProcessing ? 'Merging…' : hasCompleted ? 'Merge again' : 'Merge PDF';

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
    if (isOutputNameDirty) {
      return;
    }
    setOutputName(createDefaultOutputName(files.length));
  }, [files.length, isOutputNameDirty]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'o') {
        return;
      }
      event.preventDefault();
      if (!isProcessing) {
        void handleSelectInputs();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isProcessing]);

  async function handleSelectInputs() {
    const selected = await choosePdfInputs();
    if (selected.length === 0) {
      return;
    }

    const fileInfos = await inspectPdfFiles(selected);
    const infoMap = toInfoMap(fileInfos);

    const nextRows = selected.map((path) => {
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
    setStatus({ tone: 'info', message: 'Files added' });
    queueMicrotask(() => outputInputRef.current?.focus());
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
    setStatus({ tone: 'info', message: 'Order updated' });
  }

  async function handleMerge() {
    if (!canMerge || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setHasCompleted(false);
    setStatus({ tone: 'info', message: 'Processing merge...' });

    try {
      const outputPath = joinPath(outputDirectory, outputName.trim(), pathSeparator);
      const result = await mergePdfs(
        files.map((file) => file.path),
        outputPath
      );
      setLastOutputPath(outputPath);
      setHasCompleted(true);
      setStatus({
        tone: 'success',
        message: `Done: ${result.input_count} files merged`,
      });
    } catch (error) {
      const reason = readErrorMessage(error);
      console.error('[desktop.merge] command failed:', reason);
      setStatus({
        tone: 'error',
        message: `Merge failed: ${reason}`,
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
    sizeLabel: formatSize(file.sizeBytes),
    pagesLabel: file.pageCount ? String(file.pageCount) : '-',
  }));

  const destinationFriendlyLabel = !outputDirectory
    ? 'No destination selected'
    : outputDirectory === defaultDownloadDirectory
    ? '📁 Downloads'
    : `📁 ${fileNameFromPath(outputDirectory)}`;

  return (
    <ToolLayout
      title="Merge PDF"
      subtitle="Combine multiple PDF files into one document"
      leftPanel={
        <div className="merge-left-panel">
          <Dropzone disabled={isProcessing} fileCount={files.length} onSelectFiles={() => void handleSelectInputs()} />
          <FileTable rows={rows} onRemove={removeFile} onReorder={reorderFiles} />
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
          statusTone={status.tone}
          statusMessage={status.message}
          mergeActionLabel={mergeActionLabel}
          onOutputNameChange={(next) => {
            setOutputName(next);
            setIsOutputNameDirty(true);
          }}
          onChooseDestination={() => void handleChooseOutputDirectory()}
          onRun={() => void handleMerge()}
          onOpenFile={() => void handleOpenFile()}
          onShowInFolder={() => void handleShowInFolder()}
        />
      }
    />
  );
}
