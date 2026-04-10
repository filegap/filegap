export type WorkflowInputMode = 'single' | 'multiple';
export type WorkflowOperation = 'merge' | 'extract' | 'reorder' | 'optimize' | 'compress' | 'split';
export type CompressionPreset = 'low' | 'balanced' | 'strong';

export type WorkflowStep = {
  id: string;
  operation: WorkflowOperation;
  pageRanges: string;
  pageOrder: string;
  splitRanges: string;
  compressionPreset: CompressionPreset;
};

export type WorkflowDraft = {
  inputMode: WorkflowInputMode;
  steps: WorkflowStep[];
};

export type WorkflowBuilderTemplate =
  | 'merge'
  | 'extract'
  | 'reorder'
  | 'optimize'
  | 'compress'
  | 'split';

export type WorkflowBuilderNavigationState = {
  template?: WorkflowBuilderTemplate;
  draft?: WorkflowDraft;
  sourceFiles?: File[];
};

export function createWorkflowStep(operation: WorkflowOperation): WorkflowStep {
  return {
    id: `${operation}-${Math.random().toString(16).slice(2)}`,
    operation,
    pageRanges: '1-3',
    pageOrder: '3,2,1',
    splitRanges: '1-2,3-4',
    compressionPreset: 'balanced',
  };
}

export function validateWorkflowDraft(draft: WorkflowDraft): string[] {
  const errors: string[] = [];
  if (draft.steps.length === 0) {
    errors.push('Add at least one operation step.');
    return errors;
  }

  const first = draft.steps[0];
  const last = draft.steps[draft.steps.length - 1];

  if (draft.inputMode === 'multiple' && first.operation !== 'merge') {
    errors.push('With multiple input mode, the first step must be Merge.');
  }

  for (let index = 0; index < draft.steps.length; index += 1) {
    const step = draft.steps[index];
    if (step.operation === 'merge' && index !== 0) {
      errors.push('Merge can only be used as the first step in Workflow V1.');
    }
    if (step.operation === 'split' && step !== last) {
      errors.push('Split must be the last step because it produces multiple outputs.');
    }
  }

  return errors;
}

function stepToCli(step: WorkflowStep): string {
  if (step.operation === 'merge') {
    return 'filegap merge input-1.pdf input-2.pdf';
  }
  if (step.operation === 'extract') {
    return `filegap extract --pages "${step.pageRanges.trim() || '1-3'}"`;
  }
  if (step.operation === 'reorder') {
    return `filegap reorder --pages "${step.pageOrder.trim() || '3,2,1'}"`;
  }
  if (step.operation === 'optimize') {
    return 'filegap optimize';
  }
  if (step.operation === 'compress') {
    return `filegap compress --preset ${step.compressionPreset}`;
  }
  return `filegap split --pages "${step.splitRanges.trim() || '1-2,3-4'}" --format zip`;
}

export function buildWorkflowCliPreview(draft: WorkflowDraft): string {
  if (draft.steps.length === 0) {
    return '# Add one or more steps to generate a pipeline preview.';
  }

  let command = draft.inputMode === 'multiple' ? 'filegap merge input-1.pdf input-2.pdf' : 'cat input.pdf';

  draft.steps.forEach((step, index) => {
    const stepCommand = stepToCli(step);
    if (index === 0 && step.operation === 'merge' && draft.inputMode === 'multiple') {
      command = stepCommand;
      return;
    }

    command = `${command} |\n  ${stepCommand}`;
  });

  const isSplitOutput = draft.steps[draft.steps.length - 1]?.operation === 'split';
  return `${command}\n> ${isSplitOutput ? 'output.zip' : 'output.pdf'}`;
}
