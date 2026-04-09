import { ArrowDown, ArrowUp, GitBranch, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import {
  buildWorkflowCliPreview,
  createWorkflowStep,
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

export function WorkflowBuilderPage() {
  const [draft, setDraft] = useState<WorkflowDraft>({
    inputMode: 'single',
    steps: [createWorkflowStep('optimize')],
  });
  const errors = useMemo(() => validateWorkflowDraft(draft), [draft]);
  const cliPreview = useMemo(() => buildWorkflowCliPreview(draft), [draft]);

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

  const leftPanel = (
    <section className="workflow-builder-main">
      <div className="card">
        <div className="workflow-builder-title">
          <GitBranch aria-hidden="true" />
          <h2>Pipeline blocks</h2>
        </div>
        <p>Compose a linear local workflow. Branching mode will come in a future iteration.</p>

        <div className="workflow-builder-input-mode">
          <label htmlFor="workflow-input-mode">Input mode</label>
          <select
            id="workflow-input-mode"
            value={draft.inputMode}
            onChange={(event) =>
              setDraft((current) => ({ ...current, inputMode: event.target.value as WorkflowDraft['inputMode'] }))
            }
            className="output-input"
          >
            <option value="single">Single PDF</option>
            <option value="multiple">Multiple PDFs</option>
          </select>
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

        <div className="stack-row">
          <Button variant="secondary" onClick={addStep}>
            <Plus aria-hidden="true" />
            <span>Add step</span>
          </Button>
        </div>
      </div>
    </section>
  );

  const rightPanel = (
    <section className="output-panel">
      <div className="output-panel-top output-panel-section">
        <h2>Validation</h2>
        {errors.length > 0 ? (
          <ul className="workflow-errors-list">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
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
    </section>
  );

  return (
    <ToolLayout
      title="Workflow Builder (Preview)"
      subtitle="Build local PDF pipelines with visual blocks"
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      footerMessage="Preview: linear workflow mode"
    />
  );
}
