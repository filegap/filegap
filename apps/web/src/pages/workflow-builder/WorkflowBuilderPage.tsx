import { ArrowDown, ArrowUp, FileText, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';

import { ToolLayout } from '../../components/layout/ToolLayout';
import { ToolActionCard } from '../../components/layout/ToolActionCard';
import { SectionBlock } from '../../components/layout/SectionBlock';
import { Button } from '../../components/ui/Button';
import { CliPreviewCard } from '../../components/ui/CliPreviewCard';
import { DropZone } from '../../components/ui/DropZone';
import { PreDownloadModal } from '../../components/ui/PreDownloadModal';
import { SimpleProcessFlow } from '../../components/ui/SimpleProcessFlow';
import { UploadedFilesTable } from '../../components/ui/UploadedFilesTable';
import {
  compressPdfBuffer,
  extractPdfByRanges,
  mergePdfBuffers,
  optimizePdfBuffer,
  parsePageOrder,
  parseSplitRanges,
  reorderPdfPages,
  splitPdfByRanges,
} from '../../adapters/pdfEngine';
import {
  buildWorkflowCliPreview,
  createWorkflowStep,
  getWorkflowStepDefaults,
  type WorkflowBuilderNavigationState,
  type WorkflowDraft,
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

const WORKFLOW_PAGE_CONTENT = {
  howTitle: 'How to build a PDF workflow',
  howSteps: [
    'Add one or more PDF files.',
    'Choose your processing steps in order.',
    'Run the workflow locally and download the result.',
  ],
  whyTitle: 'Why use this tool',
  whyItems: [
    {
      title: 'Simple linear flow',
      text: 'Build predictable V1 workflows with clear step-by-step processing.',
    },
    {
      title: 'Private by design',
      text: 'Everything runs on your device with no file uploads.',
    },
    {
      title: 'Reusable from CLI',
      text: 'Copy the equivalent command and run the same flow in scripts.',
    },
  ],
};

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type WorkflowOutput = {
  id: string;
  filename: string;
  bytes: Uint8Array;
  pageCount: number;
};

type WorkflowOutputSummary = {
  fileCount: number;
  pageCount: number | null;
  sizeBytes: number;
};

type SourceFileMetadata = {
  pageCount: number | null;
  status: 'loading' | 'ready' | 'error';
};

function normalizeDraftInputMode(draft: WorkflowDraft): WorkflowDraft {
  const inputMode = draft.steps[0]?.operation === 'merge' ? 'multiple' : 'single';
  if (draft.inputMode === inputMode) {
    return draft;
  }
  return { ...draft, inputMode };
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function saveBlob(filename: string, bytes: Uint8Array): void {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }

  return new Response(file).arrayBuffer();
}

async function getPageCountFromBytes(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(toArrayBuffer(bytes));
  return doc.getPageCount();
}

async function getPdfPageCount(file: File): Promise<number | null> {
  try {
    const bytes = await fileToArrayBuffer(file);
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  } catch {
    return null;
  }
}

function sourceFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function isPlaceholderStepValue(step: WorkflowDraft['steps'][number]): boolean {
  const genericDefaults = getWorkflowStepDefaults(step.operation);
  if (step.operation === 'extract') {
    return step.pageRanges === genericDefaults.pageRanges;
  }
  if (step.operation === 'reorder') {
    return step.pageOrder === genericDefaults.pageOrder;
  }
  if (step.operation === 'split') {
    return step.splitRanges === genericDefaults.splitRanges;
  }
  return false;
}

function outputSlug(operation: WorkflowOperation): string {
  if (operation === 'merge') {
    return 'merge-pdf';
  }
  if (operation === 'extract') {
    return 'extract-pages';
  }
  if (operation === 'reorder') {
    return 'reorder-pdf';
  }
  if (operation === 'optimize') {
    return 'optimize-pdf';
  }
  if (operation === 'compress') {
    return 'compress-pdf';
  }
  return 'split-pdf';
}

function buildOutputName(operation: WorkflowOperation, index: number, total: number): string {
  const stem = `filegap-${outputSlug(operation)}-output`;
  if (total === 1) {
    return `${stem}.pdf`;
  }
  return `${stem}-part-${index + 1}.pdf`;
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(sizeBytes) / Math.log(1024)), units.length - 1);
  const value = sizeBytes / 1024 ** exponent;
  const precision = value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: precision }).format(value)} ${units[exponent]}`;
}

function stepLabel(operation: WorkflowOperation): string {
  return STEP_OPTIONS.find((option) => option.value === operation)?.label ?? 'Step';
}

export function WorkflowBuilderPage() {
  const location = useLocation();
  const navigationState = (location.state ?? null) as WorkflowBuilderNavigationState | null;
  const initialDraft = normalizeDraftInputMode(
    navigationState?.draft ?? {
      inputMode: 'single',
      steps: [createWorkflowStep('optimize')],
    }
  );
  const initialSourceFiles = navigationState?.sourceFiles ?? [];

  const [draft, setDraft] = useState<WorkflowDraft>(initialDraft);
  const [sourceFiles, setSourceFiles] = useState<File[]>(initialSourceFiles);
  const [sourceFileMetadata, setSourceFileMetadata] = useState<Record<string, SourceFileMetadata>>({});
  const [outputs, setOutputs] = useState<WorkflowOutput[]>([]);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isDropZoneCollapsed, setIsDropZoneCollapsed] = useState(initialSourceFiles.length > 0);
  const [status, setStatus] = useState<{ tone: StatusTone; message: string }>({
    tone: initialSourceFiles.length > 0 ? 'info' : 'neutral',
    message:
      initialSourceFiles.length > 0
        ? 'Workflow imported locally. Review steps and run when ready.'
        : 'Select input PDF files and run your workflow.',
  });

  const errors = useMemo(() => validateWorkflowDraft(draft), [draft]);
  const cliPreview = useMemo(() => buildWorkflowCliPreview(draft), [draft]);
  const requiredInputCount = draft.inputMode === 'multiple' ? 2 : 1;
  const hasAnyInputs = sourceFiles.length > 0;
  const hasEnoughInputs = sourceFiles.length >= requiredInputCount;
  const canRun = !isRunning && hasAnyInputs && hasEnoughInputs && errors.length === 0;
  const runStepsLabel = `${draft.steps.length} ${draft.steps.length === 1 ? 'step' : 'steps'} ready`;
  const chainSteps = ['Input', ...draft.steps.map((step) => stepLabel(step.operation)), 'Output'];
  const finalOperation = draft.steps[draft.steps.length - 1]?.operation ?? 'optimize';
  const singleSourcePageCount =
    sourceFiles.length === 1 ? sourceFileMetadata[sourceFileKey(sourceFiles[0])]?.pageCount ?? null : null;
  const inputError =
    draft.inputMode === 'multiple' && sourceFiles.length === 1
      ? 'Merge requires at least two input PDFs.'
      : draft.inputMode === 'single' && sourceFiles.length > 1
        ? 'Use Merge as the first step to process multiple input PDFs.'
        : null;

  const stepErrors = useMemo(() => {
    const byStep = new Map<string, string[]>();
    draft.steps.forEach((step, index) => {
      const messages: string[] = [];
      if (step.operation === 'merge' && index !== 0) {
        messages.push('Merge can only be used as the first step in Workflow V1.');
      }
      if (step.operation === 'split' && index !== draft.steps.length - 1) {
        messages.push('Split must be the last step because it produces multiple outputs.');
      }
      byStep.set(step.id, messages);
    });
    return byStep;
  }, [draft.steps]);

  const uploadedFiles = sourceFiles.map((file, index) => {
    const metadata = sourceFileMetadata[sourceFileKey(file)];
    return {
      id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    filename: file.name,
    sizeBytes: file.size,
      pages: metadata?.pageCount ?? null,
      pagesStatus: metadata?.status ?? 'loading',
    };
  });
  const dropZoneLoadedName =
    sourceFiles.length === 0
      ? null
      : sourceFiles.length === 1
        ? sourceFiles[0].name
        : `${sourceFiles[0].name} + ${sourceFiles.length - 1} more`;
  const totalSizeBytes = sourceFiles.reduce((sum, file) => sum + file.size, 0);
  const inputSummaryMeta = `${sourceFiles.length} file${sourceFiles.length === 1 ? '' : 's'} • ${formatFileSize(totalSizeBytes)}`;
  const actionMessageClassName = status.tone === 'error' ? 'text-sm text-red-600' : 'text-sm text-ui-muted';
  const outputSummary = useMemo<WorkflowOutputSummary | null>(() => {
    if (outputs.length === 0) {
      return null;
    }

    return {
      fileCount: outputs.length,
      pageCount: outputs.length === 1 ? outputs[0].pageCount : null,
      sizeBytes: outputs.reduce((sum, output) => sum + output.bytes.byteLength, 0),
    };
  }, [outputs]);

  useEffect(() => {
    sourceFiles.forEach((file) => {
      const key = sourceFileKey(file);
      if (sourceFileMetadata[key]) {
        return;
      }

      setSourceFileMetadata((current) => ({
        ...current,
        [key]: { pageCount: null, status: 'loading' },
      }));

      void getPdfPageCount(file).then((pageCount) => {
        setSourceFileMetadata((current) => ({
          ...current,
          [key]: {
            pageCount,
            status: pageCount === null ? 'error' : 'ready',
          },
        }));
      });
    });
  }, [sourceFileMetadata, sourceFiles]);

  useEffect(() => {
    if (sourceFiles.length !== 1 || !singleSourcePageCount) {
      return;
    }

    setDraft((current) => {
      let changed = false;
      const steps = current.steps.map((step) => {
        if (!isPlaceholderStepValue(step)) {
          return step;
        }

        const nextDefaults = getWorkflowStepDefaults(step.operation, singleSourcePageCount);
        if (
          (step.operation === 'extract' && step.pageRanges === nextDefaults.pageRanges) ||
          (step.operation === 'reorder' && step.pageOrder === nextDefaults.pageOrder) ||
          (step.operation === 'split' && step.splitRanges === nextDefaults.splitRanges)
        ) {
          return step;
        }

        changed = true;
        return {
          ...step,
          ...nextDefaults,
          compressionPreset: step.compressionPreset,
        };
      });

      return changed ? { ...current, steps } : current;
    });
  }, [singleSourcePageCount, sourceFiles.length]);

  function addStep() {
    setDraft((current) =>
      normalizeDraftInputMode({
        ...current,
        steps: [...current.steps, createWorkflowStep('compress', singleSourcePageCount ?? undefined)],
      })
    );
  }

  function removeStep(stepId: string) {
    setDraft((current) =>
      normalizeDraftInputMode({
        ...current,
        steps: current.steps.filter((step) => step.id !== stepId),
      })
    );
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
      return normalizeDraftInputMode({ ...current, steps: next });
    });
  }

  function updateStep(stepId: string, patch: Partial<WorkflowDraft['steps'][number]>) {
    setDraft((current) =>
      normalizeDraftInputMode({
        ...current,
        steps: current.steps.map((step) => {
          if (step.id !== stepId) {
            return step;
          }

          if (patch.operation && patch.operation !== step.operation) {
            return {
              ...step,
              ...getWorkflowStepDefaults(patch.operation, singleSourcePageCount ?? undefined),
              ...patch,
            };
          }

          return { ...step, ...patch };
        }),
      })
    );
  }

  function handleSourceSelected(files: File[]) {
    if (files.length === 0) {
      return;
    }
    setOutputs([]);
    setShowDownloadGate(false);
    setSourceFiles((current) => [...current, ...files]);
    setIsDropZoneCollapsed(true);
  }

  function removeSourceFile(index: number) {
    setSourceFiles((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      if (next.length === 0) {
        setIsDropZoneCollapsed(false);
      }
      return next;
    });
  }

  function clearSourceFiles() {
    setSourceFiles([]);
    setSourceFileMetadata({});
    setOutputs([]);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(false);
    setStatus({ tone: 'neutral', message: 'Select input PDF files and run your workflow.' });
  }

  function startNewWorkflow() {
    setSourceFiles([]);
    setSourceFileMetadata({});
    setOutputs([]);
    setShowDownloadGate(false);
    setIsDropZoneCollapsed(false);
    setStatus({ tone: 'neutral', message: 'Select input PDF files and run your workflow.' });
  }

  async function runWorkflow() {
    if (!canRun) {
      setStatus({
        tone: 'error',
        message: hasEnoughInputs
          ? 'Fix inline errors before running.'
          : `Select at least ${requiredInputCount} input PDF file${requiredInputCount > 1 ? 's' : ''}.`,
      });
      return;
    }

    setIsRunning(true);
    setOutputs([]);
    setStatus({ tone: 'info', message: 'Running workflow locally in your browser...' });

    try {
      let currentDocs: Uint8Array[] = await Promise.all(
        sourceFiles.map(async (file) => new Uint8Array(await fileToArrayBuffer(file)))
      );

      for (const step of draft.steps) {
        if (step.operation === 'merge') {
          if (currentDocs.length < 2) {
            throw new Error('Merge step requires at least 2 input PDFs.');
          }
          const merged = await mergePdfBuffers(currentDocs.map((bytes) => toArrayBuffer(bytes)));
          currentDocs = [new Uint8Array(merged)];
          continue;
        }

        if (currentDocs.length !== 1) {
          throw new Error('This step requires a single PDF input. Add Merge before this step.');
        }

        const source = currentDocs[0];
        if (step.operation === 'extract') {
          const pages = await getPageCountFromBytes(source);
          const ranges = parseSplitRanges(step.pageRanges, pages);
          const extracted = await extractPdfByRanges(toArrayBuffer(source), ranges);
          currentDocs = [new Uint8Array(extracted)];
          continue;
        }

        if (step.operation === 'reorder') {
          const pages = await getPageCountFromBytes(source);
          const order = parsePageOrder(step.pageOrder, pages);
          const reordered = await reorderPdfPages(toArrayBuffer(source), order);
          currentDocs = [new Uint8Array(reordered)];
          continue;
        }

        if (step.operation === 'optimize') {
          const optimized = await optimizePdfBuffer(toArrayBuffer(source));
          currentDocs = [new Uint8Array(optimized)];
          continue;
        }

        if (step.operation === 'compress') {
          const compressed = await compressPdfBuffer(toArrayBuffer(source), step.compressionPreset);
          currentDocs = [new Uint8Array(compressed)];
          continue;
        }

        const pages = await getPageCountFromBytes(source);
        const ranges = parseSplitRanges(step.splitRanges, pages);
        const splitOutputs = await splitPdfByRanges(toArrayBuffer(source), ranges);
        currentDocs = splitOutputs.map((bytes) => new Uint8Array(bytes));
      }

      const finalOutputs = await Promise.all(
        currentDocs.map(async (bytes, index) => ({
          id: `output-${index}`,
          filename: buildOutputName(finalOperation, index, currentDocs.length),
          bytes,
          pageCount: await getPageCountFromBytes(bytes),
        }))
      );

      setOutputs(finalOutputs);
      setStatus({
        tone: 'success',
        message: `Workflow completed. Generated ${finalOutputs.length} output file${finalOutputs.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Workflow failed.',
      });
    } finally {
      setIsRunning(false);
    }
  }

  function downloadOutput(output: WorkflowOutput) {
    saveBlob(output.filename, output.bytes);
  }

  function downloadAllOutputs() {
    outputs.forEach((output) => downloadOutput(output));
  }

  function handleDownloadCta() {
    setShowDownloadGate(true);
  }

  function handleConfirmDownload() {
    if (outputs.length === 1) {
      downloadOutput(outputs[0]);
    } else {
      downloadAllOutputs();
    }
    setShowDownloadGate(false);
  }

  return (
    <ToolLayout
      title='Build PDF workflow — fast, private, and local'
      description='Create a simple linear chain of local PDF steps and run it directly in your browser.'
      trustLine='Processed locally on your device — no uploads'
      metaTitle='Workflow Builder | Filegap'
      metaDescription='Build linear local PDF workflows in Filegap with a simple, task-focused flow.'
    >
      <ToolActionCard className='space-y-6'>
        {navigationState?.template ? (
          <section className='rounded-2xl border border-ui-border bg-ui-bg/55 px-4 py-3'>
            <p className='text-sm font-medium text-ui-text'>Imported from {navigationState.template}</p>
            <p className='mt-1 text-xs text-ui-muted'>Existing files and step draft were loaded into this workflow.</p>
          </section>
        ) : null}

        <section className='space-y-3'>
          {hasAnyInputs ? <h2 className='font-heading text-xl font-semibold text-ui-text'>Input files</h2> : null}
          {sourceFiles.length === 0 ? (
            <DropZone onFilesSelected={handleSourceSelected} multiple disabled={isRunning} />
          ) : isDropZoneCollapsed ? (
            <div className='animate-[fade-in_180ms_ease-out] space-y-2'>
              <div className='flex w-full items-center gap-3 rounded-xl border border-ui-border/70 bg-ui-surface px-3 py-2.5 text-left transition-all duration-200 hover:border-brand-primary/35 hover:bg-ui-bg'>
                <span className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ui-bg text-ui-muted'>
                  <FileText className='h-4.5 w-4.5' />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block text-sm font-semibold text-ui-text'>
                    {sourceFiles.length === 1 ? sourceFiles[0].name : `${sourceFiles.length} PDFs ready`}
                  </span>
                  <span className='block text-xs text-ui-muted'>{inputSummaryMeta}</span>
                </span>
                <button
                  type='button'
                  onClick={() => setIsDropZoneCollapsed(false)}
                  className='inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
                >
                  <span className='hidden sm:inline'>Add more</span>
                  <Plus className='h-4 w-4' />
                </button>
                <button
                  type='button'
                  onClick={clearSourceFiles}
                  aria-label='Clear files'
                  title='Clear files'
                  className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            </div>
          ) : (
            <div className='relative animate-[fade-in_180ms_ease-out]'>
              <button
                type='button'
                onClick={() => setIsDropZoneCollapsed(true)}
                aria-label='Hide file picker'
                title='Hide file picker'
                className='absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ui-border bg-ui-surface text-ui-text transition hover:bg-ui-bg'
              >
                <X className='h-4 w-4' />
              </button>
              <DropZone onFilesSelected={handleSourceSelected} multiple disabled={isRunning} loadedFileName={dropZoneLoadedName} />
            </div>
          )}
          {uploadedFiles.length > 0 ? (
            <div className='flex items-center justify-end gap-3'>
              <button
                type='button'
                onClick={clearSourceFiles}
                className='rounded-md border border-ui-border px-2.5 py-1 text-xs font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
              >
                Clear all
              </button>
            </div>
          ) : null}
          {uploadedFiles.length > 0 ? (
            <section className='space-y-2'>
              <h2 className='font-heading text-xl font-semibold text-ui-text'>Uploaded files</h2>
              <UploadedFilesTable
                files={uploadedFiles}
                reorderable
                showTitle={false}
                showHeaderRow={false}
                onRemove={(id) => {
                  const index = uploadedFiles.findIndex((file) => file.id === id);
                  if (index < 0) {
                    return;
                  }
                  removeSourceFile(index);
                }}
                onReorder={(fromIndex, toIndex) => {
                  setSourceFiles((current) => {
                    if (toIndex < 0 || toIndex >= current.length) {
                      return current;
                    }
                    const next = [...current];
                    const [item] = next.splice(fromIndex, 1);
                    next.splice(toIndex, 0, item);
                    return next;
                  });
                }}
              />
            </section>
          ) : null}
          {inputError ? <p className='text-sm text-red-600'>{inputError}</p> : null}
        </section>

        {hasAnyInputs ? (
          <section className='space-y-3'>
            <h2 className='font-heading text-xl font-semibold text-ui-text'>Processing steps</h2>
            <SimpleProcessFlow
              showTitle={false}
              description='Input and output are fixed; steps run in order between them.'
              steps={chainSteps}
              activeStepIndex={Math.min(1, chainSteps.length - 1)}
            />

            <div className='space-y-3'>
              {draft.steps.map((step, index) => (
                <article key={step.id} className='rounded-xl border border-ui-border bg-ui-bg/55 p-3 sm:p-4'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='rounded-md border border-ui-border bg-ui-surface px-2 py-1 text-xs font-semibold text-ui-muted'>
                      Step {index + 1}
                    </span>
                    <select
                      value={step.operation}
                      onChange={(event) => updateStep(step.id, { operation: event.target.value as WorkflowOperation })}
                      className='min-w-[180px] flex-1 rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                    >
                      {STEP_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className='ml-auto flex items-center gap-2'>
                      <Button variant='secondary' size='md' onClick={() => moveStep(step.id, 'up')} disabled={index === 0}>
                        <ArrowUp className='h-4 w-4' aria-hidden='true' />
                      </Button>
                      <Button variant='secondary' size='md' onClick={() => moveStep(step.id, 'down')} disabled={index === draft.steps.length - 1}>
                        <ArrowDown className='h-4 w-4' aria-hidden='true' />
                      </Button>
                      <Button variant='secondary' size='md' onClick={() => removeStep(step.id)} disabled={draft.steps.length === 1}>
                        <Trash2 className='h-4 w-4' aria-hidden='true' />
                      </Button>
                    </div>
                  </div>

                  {step.operation === 'extract' ? (
                    <div className='mt-3'>
                      <label className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Page ranges</label>
                      <input
                        value={step.pageRanges}
                        onChange={(event) => updateStep(step.id, { pageRanges: event.target.value })}
                        className='mt-1 w-full rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                        placeholder='1-3, 5'
                      />
                    </div>
                  ) : null}

                  {step.operation === 'reorder' ? (
                    <div className='mt-3'>
                      <label className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Page order</label>
                      <input
                        value={step.pageOrder}
                        onChange={(event) => updateStep(step.id, { pageOrder: event.target.value })}
                        className='mt-1 w-full rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                        placeholder='3,2,1'
                      />
                    </div>
                  ) : null}

                  {step.operation === 'split' ? (
                    <div className='mt-3'>
                      <label className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Split ranges</label>
                      <input
                        value={step.splitRanges}
                        onChange={(event) => updateStep(step.id, { splitRanges: event.target.value })}
                        className='mt-1 w-full rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                        placeholder='1-2,3-4'
                      />
                    </div>
                  ) : null}

                  {step.operation === 'compress' ? (
                    <div className='mt-3 max-w-[220px]'>
                      <label className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Preset</label>
                      <select
                        value={step.compressionPreset}
                        onChange={(event) =>
                          updateStep(step.id, {
                            compressionPreset: event.target.value as WorkflowDraft['steps'][number]['compressionPreset'],
                          })
                        }
                        className='mt-1 w-full rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                      >
                        <option value='low'>Low</option>
                        <option value='balanced'>Balanced</option>
                        <option value='strong'>Strong</option>
                      </select>
                    </div>
                  ) : null}

                  {stepErrors.get(step.id)?.map((message) => (
                    <p key={`${step.id}-${message}`} className='mt-2 text-sm text-red-600'>
                      {message}
                    </p>
                  ))}
                </article>
              ))}
            </div>

            <Button variant='secondary' onClick={addStep} disabled={isRunning}>
              <Plus className='h-4 w-4' aria-hidden='true' />
              Add step
            </Button>
          </section>
        ) : null}

        {hasAnyInputs && outputs.length === 0 ? (
          <div className='sticky bottom-4 z-10 pt-2'>
            <div className='flex flex-col gap-3 rounded-2xl border border-ui-border/80 bg-ui-surface/95 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
              <div className='min-w-0'>
                <p className='text-sm font-semibold text-ui-text'>{runStepsLabel}</p>
                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  <p className={actionMessageClassName}>
                    {canRun ? 'Ready to run locally.' : status.tone === 'error' ? status.message : 'Complete required inputs to continue.'}
                  </p>
                </div>
              </div>
              <Button onClick={() => void runWorkflow()} loading={isRunning} disabled={!canRun}>
                Run workflow
              </Button>
            </div>
          </div>
        ) : null}

        {outputs.length > 0 ? (
          <div className='rounded-2xl border border-brand-primary/40 bg-brand-primary/10 p-5'>
            <p className='font-heading text-lg font-semibold text-ui-text'>Workflow completed</p>
            <p className='mt-1 text-sm text-ui-text/85'>
              Your PDF is ready. The local process finished on this device.
            </p>
            {outputSummary ? (
              <p className='mt-2 text-sm text-ui-muted'>
                {outputSummary.pageCount ? `${outputSummary.pageCount} pages` : `${outputSummary.fileCount} PDF files`} •{' '}
                {formatFileSize(outputSummary.sizeBytes)}
              </p>
            ) : null}
            <div className='mt-4 flex flex-wrap gap-3'>
              <Button onClick={handleDownloadCta}>Download PDF</Button>
              <button
                type='button'
                onClick={startNewWorkflow}
                className='rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
              >
                New workflow
              </button>
            </div>
          </div>
        ) : null}

        {hasAnyInputs ? (
          <section className='space-y-3'>
            <h2 className='font-heading text-xl font-semibold text-ui-text'>CLI preview</h2>
            <CliPreviewCard
              command={cliPreview}
              helperText='Run this workflow in your terminal or scripts.'
              learnHref='/cli'
              learnLabel='Try the CLI →'
              showTitle={false}
            />
          </section>
        ) : null}
      </ToolActionCard>

      <section className='mt-10 grid gap-6 md:grid-cols-2'>
        <SectionBlock title={WORKFLOW_PAGE_CONTENT.howTitle} className='md:flex md:h-full md:flex-col' contentClassName='md:flex-1'>
          <ol className='list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-ui-muted'>
            {WORKFLOW_PAGE_CONTENT.howSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </SectionBlock>

        <SectionBlock title={WORKFLOW_PAGE_CONTENT.whyTitle} className='md:flex md:h-full md:flex-col' contentClassName='md:flex-1'>
          <ul className='space-y-5'>
            {WORKFLOW_PAGE_CONTENT.whyItems.map((item) => (
              <li key={item.title}>
                <h3 className='text-base font-semibold text-ui-text'>{item.title}</h3>
                <p className='mt-1.5 text-sm leading-relaxed text-ui-muted'>{item.text}</p>
              </li>
            ))}
          </ul>
        </SectionBlock>
      </section>

      <PreDownloadModal
        open={showDownloadGate && outputs.length > 0}
        onConfirm={handleConfirmDownload}
        onClose={() => setShowDownloadGate(false)}
      />
    </ToolLayout>
  );
}
