import { ArrowDown, ArrowUp, GitBranch, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';

import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { DropZone } from '../../components/ui/DropZone';
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
  type WorkflowDraft,
  type WorkflowBuilderNavigationState,
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

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type WorkflowOutput = {
  id: string;
  filename: string;
  bytes: Uint8Array;
  pageCount: number;
};

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

async function getPageCountFromBytes(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(toArrayBuffer(bytes));
  return doc.getPageCount();
}

function buildOutputName(baseName: string, index: number, total: number): string {
  const stem = baseName.toLowerCase().endsWith('.pdf') ? baseName.slice(0, -4) : baseName;
  if (total === 1) {
    return `${stem}-workflow.pdf`;
  }
  return `${stem}-workflow-part-${index + 1}.pdf`;
}

export function WorkflowBuilderPage() {
  const location = useLocation();
  const navigationState = (location.state ?? null) as WorkflowBuilderNavigationState | null;
  const initialDraft = navigationState?.draft ?? {
    inputMode: 'single',
    steps: [createWorkflowStep('optimize')],
  };
  const initialSourceFiles = navigationState?.sourceFiles ?? [];
  const [draft, setDraft] = useState<WorkflowDraft>(initialDraft);
  const [sourceFiles, setSourceFiles] = useState<File[]>(initialSourceFiles);
  const [outputs, setOutputs] = useState<WorkflowOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<{ tone: StatusTone; message: string }>({
    tone: initialSourceFiles.length > 0 ? 'info' : 'neutral',
    message:
      initialSourceFiles.length > 0
        ? 'Workflow imported locally. Review the flow and run it when ready.'
        : 'Select input PDF files and run your workflow.',
  });
  const [copyFeedback, setCopyFeedback] = useState('');
  const errors = useMemo(() => validateWorkflowDraft(draft), [draft]);
  const cliPreview = useMemo(() => buildWorkflowCliPreview(draft), [draft]);
  const requiredInputCount = draft.inputMode === 'multiple' ? 2 : 1;
  const hasEnoughInputs = sourceFiles.length >= requiredInputCount;
  const canRun = !isRunning && hasEnoughInputs && errors.length === 0;

  function addStep() {
    setDraft((current) => ({
      ...current,
      steps: [...current.steps, createWorkflowStep('compress')],
    }));
  }

  function removeStep(stepId: string) {
    setDraft((current) => ({
      ...current,
      steps: current.steps.filter((step) => step.id !== stepId),
    }));
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
  }

  function updateStep(stepId: string, patch: Partial<WorkflowDraft['steps'][number]>) {
    setDraft((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
    }));
  }

  function handleSourceSelected(files: File[]) {
    if (files.length === 0) {
      return;
    }
    setOutputs([]);
    if (draft.inputMode === 'single') {
      setSourceFiles([files[0]]);
      return;
    }
    setSourceFiles((current) => [...current, ...files]);
  }

  function removeSourceFile(index: number) {
    setSourceFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function clearSourceFiles() {
    setSourceFiles([]);
    setOutputs([]);
    setStatus({ tone: 'neutral', message: 'Select input PDF files and run your workflow.' });
  }

  async function runWorkflow() {
    if (!canRun) {
      setStatus({
        tone: 'error',
        message: hasEnoughInputs
          ? 'Fix validation issues before running.'
          : `Select at least ${requiredInputCount} input PDF file${requiredInputCount > 1 ? 's' : ''}.`,
      });
      return;
    }

    setIsRunning(true);
    setOutputs([]);
    setStatus({ tone: 'info', message: 'Running workflow locally in your browser...' });

    try {
      let currentDocs: Uint8Array[] = await Promise.all(
        sourceFiles.map(async (file) => new Uint8Array(await file.arrayBuffer()))
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

      const baseName = sourceFiles[0]?.name ?? 'workflow-output.pdf';
      const finalOutputs = await Promise.all(
        currentDocs.map(async (bytes, index) => ({
          id: `output-${index}`,
          filename: buildOutputName(baseName, index, currentDocs.length),
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

  async function copyCliPreview() {
    try {
      await navigator.clipboard.writeText(cliPreview);
      setCopyFeedback('CLI preview copied.');
      setTimeout(() => setCopyFeedback(''), 1600);
    } catch {
      setCopyFeedback('Copy failed.');
      setTimeout(() => setCopyFeedback(''), 1600);
    }
  }

  return (
    <ToolLayout
      title='Workflow Builder (Preview)'
      description='Compose local PDF pipelines with visual blocks. Workflow V1 supports linear chains.'
      trustLine='Local processing only · No uploads'
      metaTitle='Workflow Builder Preview | Filegap'
      metaDescription='Build visual local PDF workflows in Filegap with a linear pipeline preview.'
    >
      <section className='space-y-3 rounded-2xl border border-ui-border bg-ui-surface p-4 sm:p-5 lg:p-6'>
        <div className='flex items-center gap-2'>
          <GitBranch className='h-4 w-4 text-brand-primary' aria-hidden='true' />
          <h2 className='font-heading text-xl font-semibold text-ui-text'>Pipeline blocks</h2>
        </div>
        <p className='text-sm text-ui-muted'>
          Desktop view uses a visual pipeline canvas. On mobile, controls stay linear for faster interaction.
        </p>

        <div className='grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] lg:gap-5'>
          <div className='rounded-2xl border border-ui-border bg-ui-bg/70 p-3 sm:p-4'>
            <h3 className='text-sm font-semibold uppercase tracking-[0.08em] text-ui-muted'>Flow canvas</h3>
            <div className='mt-4 space-y-3'>
              <div className='relative rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-3 sm:p-4'>
                <span className='rounded-md border border-brand-primary/30 bg-ui-surface px-2 py-1 text-xs font-semibold text-ui-text'>
                  Input
                </span>
                <p className='mt-2 text-sm text-ui-text'>
                  {sourceFiles.length > 0 ? `${sourceFiles.length} file${sourceFiles.length > 1 ? 's' : ''} loaded` : 'No files selected'}
                </p>
              </div>

              {draft.steps.map((step, index) => (
                <div key={step.id} className='relative'>
                  <div className='mx-auto h-4 w-px bg-ui-border' aria-hidden='true' />
                  <div className='rounded-xl border border-ui-border bg-ui-surface p-3 sm:p-4'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='rounded-md border border-ui-border bg-ui-bg px-2 py-1 text-xs font-semibold text-ui-muted'>
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
                            updateStep(
                              step.id,
                              { compressionPreset: event.target.value as WorkflowDraft['steps'][number]['compressionPreset'] }
                            )
                          }
                          className='mt-1 w-full rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                        >
                          <option value='low'>Low</option>
                          <option value='balanced'>Balanced</option>
                          <option value='strong'>Strong</option>
                        </select>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              <div className='mx-auto h-4 w-px bg-ui-border' aria-hidden='true' />
              <button
                type='button'
                onClick={addStep}
                className='flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ui-border bg-ui-surface px-3 py-3 text-sm font-semibold text-ui-muted transition hover:border-brand-primary/40 hover:text-ui-text'
              >
                <Plus className='h-4 w-4' aria-hidden='true' />
                Add step
              </button>
            </div>
          </div>

          <aside className='space-y-4 rounded-2xl border border-ui-border bg-ui-surface p-3 sm:p-4'>
            <div className='space-y-1.5'>
              <label htmlFor='workflow-input-mode' className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>
                Input mode
              </label>
              <select
                id='workflow-input-mode'
                value={draft.inputMode}
                onChange={(event) => {
                  const mode = event.target.value as WorkflowDraft['inputMode'];
                  setDraft((current) => ({ ...current, inputMode: mode }));
                  setSourceFiles((current) => (mode === 'single' ? current.slice(0, 1) : current));
                  setOutputs([]);
                }}
                className='w-full rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
              >
                <option value='single'>Single PDF</option>
                <option value='multiple'>Multiple PDFs</option>
              </select>
            </div>

            <div className='space-y-2'>
              <h3 className='text-sm font-semibold text-ui-text'>Input files</h3>
              <DropZone onFilesSelected={handleSourceSelected} multiple={draft.inputMode === 'multiple'} disabled={isRunning} />
              {sourceFiles.length > 0 ? (
                <ul className='space-y-2'>
                  {sourceFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`} className='flex items-center justify-between gap-3 rounded-lg border border-ui-border bg-ui-bg/70 px-3 py-2'>
                      <span className='truncate text-sm text-ui-text'>{file.name}</span>
                      <button
                        type='button'
                        onClick={() => removeSourceFile(index)}
                        className='rounded-md border border-ui-border px-2 py-1 text-xs font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {sourceFiles.length > 0 ? (
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <p className='text-xs text-ui-muted'>
                    {sourceFiles.length} selected · requires {requiredInputCount}+
                  </p>
                  <button
                    type='button'
                    onClick={clearSourceFiles}
                    className='rounded-md border border-ui-border px-2.5 py-1 text-xs font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>

            <section className='space-y-3 rounded-xl border border-ui-border bg-ui-bg/70 p-3'>
              <h2 className='font-heading text-lg font-semibold text-ui-text'>Validation</h2>
              {errors.length > 0 ? (
                <ul className='space-y-2 rounded-xl border border-amber-400/45 bg-amber-50 p-3 text-sm text-ui-text/90'>
                  {errors.map((error) => (
                    <li key={error}>• {error}</li>
                  ))}
                </ul>
              ) : (
                <p className='rounded-xl border border-emerald-300/45 bg-emerald-50 p-3 text-sm text-ui-text/90'>
                  Workflow shape is valid for V1.
                </p>
              )}
            </section>

            <section className='space-y-2 rounded-xl border border-ui-border bg-ui-bg/70 p-3'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <h2 className='font-heading text-lg font-semibold text-ui-text'>Run workflow</h2>
                <Button onClick={() => void runWorkflow()} loading={isRunning} disabled={!canRun}>
                  Run locally
                </Button>
              </div>
              <p
                className={`text-sm ${
                  status.tone === 'error'
                    ? 'text-red-600'
                    : status.tone === 'success'
                    ? 'text-emerald-700'
                    : 'text-ui-muted'
                }`}
              >
                {status.message}
              </p>
            </section>
          </aside>
        </div>
      </section>

      {outputs.length > 0 ? (
        <section className='space-y-3 rounded-2xl border border-ui-border bg-ui-surface p-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <h2 className='font-heading text-xl font-semibold text-ui-text'>Outputs</h2>
            {outputs.length > 1 ? (
              <Button variant='secondary' onClick={downloadAllOutputs}>
                Download all
              </Button>
            ) : null}
          </div>
          <ul className='space-y-2'>
            {outputs.map((output) => (
              <li key={output.id} className='flex items-center justify-between gap-3 rounded-lg border border-ui-border bg-ui-bg/70 px-3 py-2'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-ui-text'>{output.filename}</p>
                  <p className='text-xs text-ui-muted'>{output.pageCount} pages</p>
                </div>
                <Button variant='secondary' onClick={() => downloadOutput(output)}>
                  Download
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className='space-y-3 rounded-2xl border border-ui-border bg-ui-surface p-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2 className='font-heading text-xl font-semibold text-ui-text'>CLI preview</h2>
          <Button variant='secondary' onClick={() => void copyCliPreview()}>Copy CLI</Button>
        </div>
        <pre className='overflow-x-auto rounded-xl border border-ui-border bg-ui-bg p-3 text-xs text-ui-text'>
          <code>{cliPreview}</code>
        </pre>
        {copyFeedback ? <p className='text-xs text-ui-muted'>{copyFeedback}</p> : null}
      </section>
    </ToolLayout>
  );
}
