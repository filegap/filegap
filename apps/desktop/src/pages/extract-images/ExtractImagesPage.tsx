import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, GitBranch, Images, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { OutputActionSection } from '../../components/ui/OutputActionSection';
import { OutputDestinationField } from '../../components/ui/OutputDestinationField';
import { SidebarSection } from '../../components/ui/SidebarSection';
import { SingleFilePicker } from '../../components/ui/SingleFilePicker';
import { ToolCliPreview } from '../../components/ui/ToolCliPreview';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { WorkingFileHeader } from '../../components/ui/WorkingFileHeader';
import {
  chooseOutputDirectory,
  chooseSinglePdfInput,
  extractImages,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  pathExists,
  revealInFolder,
} from '../../lib/desktop';
import { renderFilenameTemplate, resolveOutputPathByOverwrite } from '../../lib/outputSettings';
import { joinPath, parsePath, quoteCliArg, readErrorMessage } from '../../lib/pageHelpers';
import { fileNameFromPath } from '../../lib/pathUtils';
import { useDesktopSettings } from '../../lib/settings';
import { createWorkflowStep, type WorkflowBuilderImportState } from '../../lib/workflowBuilder';

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type StatusState = {
  tone: StatusTone;
  message: string;
};

type ExtractImageFile = {
  id: string;
  path: string;
  sizeBytes: number;
  pageCount: number | null;
};

function createDefaultOutputName(): string {
  return renderFilenameTemplate('extracted-images-{date}.zip');
}

function normalizeZipName(name: string): string {
  const clean = name.trim().length > 0 ? name.trim() : createDefaultOutputName();
  return clean.toLowerCase().endsWith('.zip') ? clean : `${clean}.zip`;
}

function formatBytesHuman(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const precision = value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: precision }).format(value)} ${units[exponent]}`;
}

export function ExtractImagesPage() {
  const navigate = useNavigate();
  const [settings] = useDesktopSettings();
  const [files, setFiles] = useState<ExtractImageFile[]>([]);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState(createDefaultOutputName());
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isDropzoneCollapsed, setIsDropzoneCollapsed] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [lastImageCount, setLastImageCount] = useState(0);
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = files[0] ?? null;
  const canRun = useMemo(
    () =>
      !isLoadingFiles &&
      !isProcessing &&
      files.length === 1 &&
      (settings.askDestinationEveryTime || outputDirectory.trim().length > 0) &&
      outputName.trim().length > 0,
    [isLoadingFiles, isProcessing, files.length, settings.askDestinationEveryTime, outputDirectory, outputName]
  );
  const actionLabel = isProcessing ? 'Extracting...' : hasCompleted ? 'Extract again' : 'Extract images';
  const destinationFriendlyLabel = outputDirectory || defaultDownloadDirectory || 'Choose destination';
  const footerMessage =
    status.tone === 'success'
      ? status.message
      : status.tone === 'error'
        ? status.message
        : status.tone === 'info'
          ? status.message
          : 'Ready';
  const cliPreview = useMemo(() => {
    const input = selectedFile ? quoteCliArg(fileNameFromPath(selectedFile.path)) : '"input.pdf"';
    const target = outputName.trim().length > 0 ? normalizeZipName(outputName) : 'extracted-images.zip';
    return `filegap extract-images ${input}\n> ${quoteCliArg(target)}`;
  }, [outputName, selectedFile]);

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
      setLastImageCount(0);
      setIsDropzoneCollapsed(true);
      setStatus({ tone: 'neutral', message: 'Idle' });
      queueMicrotask(() => outputInputRef.current?.focus());
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown file error.');
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
    setLastImageCount(0);
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  async function handleExtract() {
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

    const requestedPath = joinPath(destinationRoot, normalizeZipName(outputName), pathSeparator);
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
    setHasCompleted(false);
    setLastOutputPath('');
    setLastImageCount(0);
    setStatus({ tone: 'info', message: 'Extracting embedded images...' });

    try {
      const result = await extractImages(selectedFile.path, outputPath);
      setLastOutputPath(result.output_path);
      setLastImageCount(result.output_count);
      setHasCompleted(true);
      setStatus({ tone: 'success', message: 'Done: image ZIP exported' });
      if (settings.openFileAfterExport) {
        void openFile(result.output_path);
      } else if (settings.revealInFolderAfterExport) {
        void revealInFolder(result.output_path);
      }
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown image extraction error.');
      setStatus({ tone: 'error', message: `Image extraction failed: ${reason}` });
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

  function startNewExtraction() {
    clearSelectedFile();
    setOutputName(createDefaultOutputName());
  }

  function handleOpenWorkflowBuilder() {
    if (!selectedFile) {
      return;
    }
    const state: WorkflowBuilderImportState = {
      sourceLabel: 'Extract Images',
      inputPaths: [selectedFile.path],
      draft: {
        inputMode: 'single',
        steps: [createWorkflowStep('extract-images')],
      },
    };
    navigate('/workflow-builder', { state });
  }

  return (
    <ToolLayout
      title="Extract Images"
      subtitle="Export embedded PDF image assets into a local ZIP file"
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
            <dl className="compress-file-info-grid">
              <dt>Size</dt>
              <dd>{formatBytesHuman(selectedFile.sizeBytes)}</dd>
              <dt>Pages</dt>
              <dd>{selectedFile.pageCount ?? '-'}</dd>
              <dt>Output</dt>
              <dd>ZIP archive</dd>
            </dl>
          ) : null}
          {isLoadingFiles ? <p className="file-loading-hint">Processing file...</p> : null}
        </div>
      }
      rightPanel={
        <div className="output-panel">
          <SidebarSection title="Export" className="output-panel-top">
            <label className="output-label" htmlFor="extract-images-output-file-name">
              File name
            </label>
            <input
              id="extract-images-output-file-name"
              type="text"
              ref={outputInputRef}
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
              className="output-input"
              disabled={isProcessing}
            />
            <OutputDestinationField
              destinationLabel={destinationFriendlyLabel}
              destinationPath={outputDirectory}
              onChooseDestination={() => void handleChooseOutputDirectory()}
            />
          </SidebarSection>

          <div className="output-panel-divider" />

          <OutputActionSection
            canRun={canRun}
            isProcessing={isProcessing}
            actionLabel={actionLabel}
            loadingLabel="Extracting..."
            progressLabel="Extracting images..."
            onRun={() => void handleExtract()}
            showCompletionState={hasCompleted && !isProcessing}
            completionTitle="Extraction completed"
            completionDetails="Your image ZIP is ready"
            onOpenFile={() => void handleOpenFile()}
            onShowInFolder={() => void handleShowInFolder()}
            onNewAction={startNewExtraction}
            newActionLabel="New extraction"
          />

          {hasCompleted ? (
            <>
              <div className="output-panel-divider" />
              <SidebarSection title="Result" className="output-panel-top">
                <div className="pdf-images-result-summary">
                  <span className="pdf-images-result-icon" aria-hidden="true">
                    <Images />
                  </span>
                  <span>{lastImageCount} images</span>
                </div>
              </SidebarSection>
            </>
          ) : null}

          <div className="output-panel-divider" />

          <SidebarSection title="Processing steps" className="output-panel-section">
            <p className="tool-process-flow-helper">Runs locally on your files.</p>
            <div className="tool-process-flow-row" aria-label="Processing steps">
              {['Input PDF', 'Extract images', 'ZIP output'].map((step, index) => (
                <div key={step} className="tool-process-flow-step-wrap">
                  <span
                    className={`tool-process-flow-step ${index === 1 ? 'tool-process-flow-step-active' : ''}`.trim()}
                  >
                    {step}
                  </span>
                  {index < 2 ? <ArrowRight aria-hidden="true" className="tool-process-flow-arrow" /> : null}
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              className="tool-process-flow-builder-btn"
              onClick={handleOpenWorkflowBuilder}
              disabled={!selectedFile || isProcessing}
            >
              <GitBranch aria-hidden="true" />
              <span>Open in Workflow Builder</span>
            </Button>
          </SidebarSection>

          <div className="output-panel-divider" />

          <ToolCliPreview helperText="Run the same extraction from your terminal." command={cliPreview} />

          <TrustNotice className="output-panel-trust" />
        </div>
      }
    />
  );
}
