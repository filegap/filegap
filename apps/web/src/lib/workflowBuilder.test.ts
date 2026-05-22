import { describe, expect, it } from 'vitest';
import { buildWorkflowCliPreview, createWorkflowStep, validateWorkflowDraft, type WorkflowDraft } from './workflowBuilder';

describe('workflowBuilder', () => {
  it('requires Extract Images to be a terminal step', () => {
    const draft: WorkflowDraft = {
      inputMode: 'single',
      steps: [createWorkflowStep('extract-images'), createWorkflowStep('compress')],
    };

    expect(validateWorkflowDraft(draft)).toContain('Extract Images must be the last step because it produces image files.');
  });

  it('builds executable CLI preview for terminal Extract Images workflows', () => {
    const extract = createWorkflowStep('extract');
    extract.pageRanges = '1-2';

    const draft: WorkflowDraft = {
      inputMode: 'single',
      steps: [extract, createWorkflowStep('extract-images')],
    };

    expect(buildWorkflowCliPreview(draft)).toBe(
      'cat input.pdf |\n  filegap extract --pages "1-2" |\n  filegap extract-images\n> output.zip'
    );
  });
});
