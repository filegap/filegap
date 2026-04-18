import { ArrowDown, ArrowUp, GitBranch, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { Dropzone } from '../../components/ui/Dropzone';
import { FileTable } from '../../components/ui/FileTable';
import { OutputDestinationField } from '../../components/ui/OutputDestinationField';
import { ResultStateBlock } from '../../components/ui/ResultStateBlock';
import { SidebarSection } from '../../components/ui/SidebarSection';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { WorkingFileHeader } from '../../components/ui/WorkingFileHeader';
import {
  chooseOutputDirectory,
  choosePdfInputs,
  executeWorkflow,
  getDownloadDirectory,
  inspectPdfFiles,
  openFile,
  pathExists,
  revealInFolder,
  type PdfFileInfo,
  type WorkflowRunResult,
} from '../../lib/desktop';
import { renderFilenameTemplate, resolveOutputPathByOverwrite } from '../../lib/outputSettings';
import { formatKilobytes, joinPath, parsePath, readErrorMessage } from '../../lib/pageHelpers';
import { fileNameFromPath } from '../../lib/pathUtils';
import { useDesktopSettings } from '../../lib/settings';
import {
  buildWorkflowCliPreview,
  createWorkflowStep,
  getWorkflowInputMode,
  isWorkflowBuilderImportState,
  type WorkflowDraft,
  type WorkflowBuilderImportState,
  type WorkflowOperation,
  validateWorkflowDraft,
} from '../../lib/workflowBuilder';

const STEP_OPTIONS: Array<{ value: WorkflowOperation; label: string }> = [
  { value: 'merge', label: 'Merge' },
  { value: 'extract', label: 'Extract pages' },
  { value: 'reorder', label: 'Reorder pages' },
  { value: 'optimize', label: 'Optimize' },
  { value: 'compress', label: 'Compress' },
  { value: 'split', label: 'Split' },
];

type WorkflowInputFile = {
  id: string;
  path: string;
  sizeBytes: number;
  pageCount: number | null;
};

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type StatusState = {
  tone: StatusTone;
  message: string;
};

function toInputFiles(paths: string[], infos: PdfFileInfo[]): WorkflowInputFile[] {
  const infoMap = new Map(infos.map((item) => [item.path, item]));
  return paths.map((path) => {
    const info = infoMap.get(path);
    return {
      id: `${path}-${Math.random().toString(16).slice(2)}`,
      path,
      sizeBytes: info?.size_bytes ?? 0,
      pageCount: info?.page_count ?? null,
    };
  });
}

function createDefaultWorkflowOutputName() {
  return renderFilenameTemplate('workflow-{date}.pdf');
}

export function WorkflowBuilderPage() {
  const location = useLocation();
  const [settings] = useDesktopSettings();
  const importedState = isWorkflowBuilderImportState(location.state) ? (location.state as WorkflowBuilderImportState) : null;
  const [inputFiles, setInputFiles] = useState<WorkflowInputFile[]>([]);
  const [isLoadingInputs, setIsLoadingInputs] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [defaultDownloadDirectory, setDefaultDownloadDirectory] = useState('');
  const [outputName, setOutputName] = useState(createDefaultWorkflowOutputName());
  const [pathSeparator, setPathSeparator] = useState<'/' | '\\'>('/');
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastOutputPath, setLastOutputPath] = useState('');
  const [lastRunResult, setLastRunResult] = useState<WorkflowRunResult | null>(null);
  const [status, setStatus] = useState<StatusState>({ tone: 'neutral', message: 'Idle' });
  const outputInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<WorkflowDraft>(
    importedState?.draft ?? {
      inputMode: 'single',
      steps: [createWorkflowStep('optimize')],
    }
  );

  useEffect(() => {
    if (!importedState) {
      return;
    }
    setDraft(importedState.draft);
    if (importedState.inputPaths.length === 0) {
      setInputFiles([]);
      return;
    }

    let cancelled = false;
    setIsLoadingInputs(true);
    void (async () => {
      try {
        const infos = await inspectPdfFiles(importedState.inputPaths);
        if (cancelled) {
          return;
        }
        setInputFiles(toInputFiles(importedState.inputPaths, infos));
      } catch {
        if (!cancelled) {
          setInputFiles(
            importedState.inputPaths.map((path) => ({
              id: `${path}-${Math.random().toString(16).slice(2)}`,
              path,
              sizeBytes: 0,
              pageCount: null,
            }))
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingInputs(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [importedState]);

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

  const errors = useMemo(() => validateWorkflowDraft(draft, inputFiles.length), [draft, inputFiles.length]);
  const inputMode = useMemo(() => getWorkflowInputMode(draft), [draft]);
  const cliPreview = useMemo(
    () => buildWorkflowCliPreview(draft, inputFiles.map((file) => fileNameFromPath(file.path)), outputName),
    [draft, inputFiles, outputName]
  );
  const hasInputs = inputFiles.length > 0;
  const canRun =
    hasInputs &&
    errors.length === 0 &&
    !isLoadingInputs &&
    !isProcessing &&
    (settings.askDestinationEveryTime || outputDirectory.trim().length > 0) &&
    outputName.trim().length > 0;

  const inputRows = inputFiles.map((file) => ({
    id: file.id,
    filename: fileNameFromPath(file.path),
    sizeLabel: formatKilobytes(file.sizeBytes),
    pagesLabel: file.pageCount ? String(file.pageCount) : '-',
  }));

  async function handleSelectInputs() {
    setIsLoadingInputs(true);
    setStatus({ tone: 'info', message: 'Processing files...' });
    try {
      const selected = await choosePdfInputs();
      if (selected.length === 0) {
        setStatus({ tone: 'neutral', message: 'Idle' });
        return;
      }
      const infos = await inspectPdfFiles(selected);
      setInputFiles((current) => [...current, ...toInputFiles(selected, infos)]);
      setHasCompleted(false);
      setLastOutputPath('');
      setLastRunResult(null);
      setStatus({ tone: 'neutral', message: 'Idle' });
      queueMicrotask(() => outputInputRef.current?.focus());
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown workflow error.');
      setStatus({ tone: 'error', message: `Failed to inspect files: ${reason}` });
    } finally {
      setIsLoadingInputs(false);
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

  function clearInputs() {
    setInputFiles([]);
    setHasCompleted(false);
    setLastOutputPath('');
    setLastRunResult(null);
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  function removeInputFile(id: string) {
    setInputFiles((current) => current.filter((file) => file.id !== id));
    setHasCompleted(false);
    setLastOutputPath('');
    setLastRunResult(null);
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  function reorderInputFiles(fromIndex: number, toIndex: number) {
    setInputFiles((current) => {
      if (toIndex < 0 || toIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
    setHasCompleted(false);
    setLastOutputPath('');
    setLastRunResult(null);
    setStatus({ tone: 'neutral', message: 'Idle' });
  }

  function addStep() {
    setDraft((current) => ({
      ...current,
      steps: [...current.steps, createWorkflowStep('compress')],
    }));
    setHasCompleted(false);
    setLastOutputPath('');
    setLastRunResult(null);
  }

  function removeStep(stepId: string) {
    setDraft((current) => ({
      ...current,
      steps: current.steps.filter((step) => step.id !== stepId),
    }));
    setHasCompleted(false);
    setLastOutputPath('');
    setLastRunResult(null);
  }

  function moveStep(stepId: string, direction: 'up' | 'down') {
    setDraft((current) => {
      const index = current.steps.findIndex((step) => step.id === stepId);
      if (index < 0) {
        return current;
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.steps.length) {
        return current;
      }
      const next = [...current.steps];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return { ...current, steps: next };
    });
    setHasCompleted(false);
    setLastOutputPath('');
    setLastRunResult(null);
  }

  function updateStep(stepId: string, patch: Partial<WorkflowDraft['steps'][number]>) {
    setDraft((current) => {
      const nextSteps = current.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step));
      return { ...current, steps: nextSteps };
    });
    setHasCompleted(false);
    setLastOutputPath('');
    setLastRunResult(null);
  }

  async function handleRunWorkflow() {
    if (!canRun) {
      return;
    }

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

    const lastStep = draft.steps[draft.steps.length - 1];
    const cleanName = outputName.trim().length > 0 ? outputName.trim() : createDefaultWorkflowOutputName();

    let resolvedOutputName = cleanName;
    if (lastStep?.operation === 'split') {
      const sanitizedBaseName = cleanName.trim().replace(/\.pdf$/i, '');
      const separator = runDirectory.includes('\\') ? '\\' : '/';
      const firstOutputCandidate = `${runDirectory}${separator}${sanitizedBaseName}-part-1.pdf`;
      const resolvedFirstOutputPath = await resolveOutputPathByOverwrite(
        firstOutputCandidate,
        settings.overwriteBehavior,
        pathExists,
        async (message) => window.confirm(message)
      );
      if (!resolvedFirstOutputPath) {
        setStatus({ tone: 'info', message: 'Workflow cancelled.' });
        return;
      }
      resolvedOutputName = fileNameFromPath(resolvedFirstOutputPath).replace(/-part-1\.pdf$/i, '');
    } else {
      const normalizedName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
      const requestedPath = joinPath(runDirectory, normalizedName, pathSeparator);
      const resolvedOutputPath = await resolveOutputPathByOverwrite(
        requestedPath,
        settings.overwriteBehavior,
        pathExists,
        async (message) => window.confirm(message)
      );
      if (!resolvedOutputPath) {
        setStatus({ tone: 'info', message: 'Workflow cancelled.' });
        return;
      }
      resolvedOutputName = fileNameFromPath(resolvedOutputPath);
    }

    setIsProcessing(true);
    setHasCompleted(false);
    setLastOutputPath('');
    setLastRunResult(null);
    setStatus({ tone: 'info', message: 'Running workflow...' });

    try {
      const result = await executeWorkflow(
        inputFiles.map((file) => file.path),
        runDirectory,
        resolvedOutputName,
        draft
      );
      setHasCompleted(true);
      setLastOutputPath(result.output_path);
      setLastRunResult(result);
      setStatus({
        tone: 'success',
        message: result.is_split_output ? `Done: ${result.output_count} files created` : 'Done: workflow completed',
      });
      if (settings.openFileAfterExport) {
        try {
          await openFile(result.output_path);
        } catch {
          // Non-blocking post action.
        }
      } else if (settings.revealInFolderAfterExport) {
        try {
          await revealInFolder(result.output_path);
        } catch {
          // Non-blocking post action.
        }
      }
    } catch (error) {
      const reason = readErrorMessage(error, 'Unknown workflow error.');
      setStatus({ tone: 'error', message: `Workflow failed: ${reason}` });
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

  const leftPanel = (
    <section className="workflow-builder-main">
      <div className="output-panel-section workflow-builder-input-section">
        <Dropzone disabled={isLoadingInputs} fileCount={inputFiles.length} onSelectFiles={() => void handleSelectInputs()} />
        {inputFiles.length > 0 ? (
          <WorkingFileHeader title={`Selected files (${inputFiles.length})`}>
            <button
              type="button"
              className="file-remove-btn"
              onClick={clearInputs}
              disabled={isLoadingInputs}
              aria-label="Clear selected files"
              title="Clear selected files"
            >
              <Trash2 aria-hidden="true" />
            </button>
          </WorkingFileHeader>
        ) : null}
        <FileTable rows={inputRows} onRemove={removeInputFile} onReorder={reorderInputFiles} isLoading={isLoadingInputs} />
      </div>

      {hasInputs ? (
        <div className="card">
          <div className="workflow-builder-title">
            <GitBranch aria-hidden="true" />
            <h2>Pipeline blocks</h2>
          </div>

          <div className="workflow-steps-list">
            {draft.steps.map((step, index) => (
              <article key={step.id} className="workflow-step-card">
                <div className="workflow-step-head">
                  <span className="workflow-step-badge">Step {index + 1}</span>
                  <select
                    value={step.operation}
                    onChange={(event) => updateStep(step.id, { operation: event.target.value as WorkflowOperation })}
                    className="output-input workflow-step-select"
                  >
                    {STEP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="workflow-step-actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => moveStep(step.id, 'up')}
                      disabled={index === 0}
                      aria-label="Move step up"
                    >
                      <ArrowUp aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => moveStep(step.id, 'down')}
                      disabled={index === draft.steps.length - 1}
                      aria-label="Move step down"
                    >
                      <ArrowDown aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removeStep(step.id)}
                      disabled={draft.steps.length === 1}
                      aria-label="Remove step"
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {step.operation === 'extract' ? (
                  <div className="workflow-step-field">
                    <label htmlFor={`${step.id}-ranges`}>Page ranges</label>
                    <input
                      id={`${step.id}-ranges`}
                      className="output-input"
                      value={step.pageRanges}
                      onChange={(event) => updateStep(step.id, { pageRanges: event.target.value })}
                      placeholder="1-3, 5"
                    />
                  </div>
                ) : null}

                {step.operation === 'reorder' ? (
                  <div className="workflow-step-field">
                    <label htmlFor={`${step.id}-order`}>Page order</label>
                    <input
                      id={`${step.id}-order`}
                      className="output-input"
                      value={step.pageOrder}
                      onChange={(event) => updateStep(step.id, { pageOrder: event.target.value })}
                      placeholder="3,2,1"
                    />
                  </div>
                ) : null}

                {step.operation === 'split' ? (
                  <div className="workflow-step-field">
                    <label htmlFor={`${step.id}-split`}>Split ranges</label>
                    <input
                      id={`${step.id}-split`}
                      className="output-input"
                      value={step.splitRanges}
                      onChange={(event) => updateStep(step.id, { splitRanges: event.target.value })}
                      placeholder="1-2,3-4"
                    />
                  </div>
                ) : null}

                {step.operation === 'compress' ? (
                  <div className="workflow-step-field">
                    <label htmlFor={`${step.id}-preset`}>Preset</label>
                    <select
                      id={`${step.id}-preset`}
                      className="output-input"
                      value={step.compressionPreset}
                      onChange={(event) =>
                        updateStep(step.id, {
                          compressionPreset: event.target.value as WorkflowDraft['steps'][number]['compressionPreset'],
                        })
                      }
                    >
                      <option value="low">Low</option>
                      <option value="balanced">Balanced</option>
                      <option value="strong">Strong</option>
                    </select>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <div className="workflow-builder-actions">
            <Button variant="secondary" onClick={addStep} className="workflow-builder-add-step">
              <Plus aria-hidden="true" />
              <span>Add step</span>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );

  const rightPanel = (
    <section className="output-panel">
      {importedState ? (
        <>
          <div className="output-panel-top output-panel-section">
            <div className="workflow-imported-state">
              <p className="workflow-imported-label">Imported from {importedState.sourceLabel}</p>
              <p className="workflow-imported-files">
                {inputFiles.length === 1
                  ? '1 local file is attached to this workflow draft.'
                  : `${inputFiles.length} local files are attached to this workflow draft.`}
              </p>
            </div>
          </div>

          <div className="output-panel-divider" />
        </>
      ) : null}

      <SidebarSection title="Export" className="output-panel-top">
        <label className="output-label" htmlFor="workflow-output-file-name">
          File name
        </label>
        <input
          id="workflow-output-file-name"
          type="text"
          ref={outputInputRef}
          value={outputName}
          onChange={(event) => setOutputName(event.target.value)}
          className="output-input"
        />
        <OutputDestinationField
          destinationLabel={outputDirectory || defaultDownloadDirectory || 'Choose destination'}
          destinationPath={outputDirectory || defaultDownloadDirectory || undefined}
          onChooseDestination={() => void handleChooseOutputDirectory()}
        />
      </SidebarSection>

      <div className="output-panel-divider" />

      {hasInputs ? (
        <>
          <div className="output-panel-top output-panel-section">
            <h2>Validation</h2>
            {errors.length > 0 ? (
              <div className="workflow-warning-state">
                {errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            ) : (
              <p className="workflow-valid-state">Workflow shape is valid for V1.</p>
            )}
          </div>

          <div className="output-panel-divider" />

          <div className="output-panel-top output-panel-section">
            <h2>CLI preview</h2>
            <pre className="workflow-cli-preview">
              <code>{cliPreview}</code>
            </pre>
          </div>

          <div className="output-panel-divider" />
        </>
      ) : null}

      <div className="output-panel-bottom output-panel-section">
        <Button
          variant="primary"
          size="lg"
          className="output-action-btn"
          disabled={!canRun}
          loading={isProcessing}
          loadingLabel="Running workflow..."
          onClick={() => void handleRunWorkflow()}
        >
          Run workflow
        </Button>

        {hasCompleted && lastRunResult ? (
          <ResultStateBlock
            title="Workflow completed"
            details={lastRunResult.is_split_output ? `${lastRunResult.output_count} files created` : 'Your PDF is ready'}
            onOpen={() => void handleOpenFile()}
            onReveal={() => void handleShowInFolder()}
          />
        ) : null}
      </div>

      <TrustNotice className="output-panel-trust" />
    </section>
  );

  const footerMessage =
    status.tone === 'success'
      ? status.message
      : status.tone === 'error'
        ? status.message
        : status.tone === 'info'
          ? status.message
          : 'Ready';

  return (
    <ToolLayout
      title="Workflow Builder (Preview)"
      subtitle="Build local PDF pipelines with visual blocks"
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      footerMessage={footerMessage}
    />
  );
}
