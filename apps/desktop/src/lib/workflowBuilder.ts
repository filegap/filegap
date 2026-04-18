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

export type WorkflowBuilderImportState = {
  sourceLabel: string;
  inputPaths: string[];
  draft: WorkflowDraft;
};

export function getWorkflowInputMode(draft: WorkflowDraft): WorkflowInputMode {
  return draft.steps[0]?.operation === 'merge' ? 'multiple' : 'single';
}

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

export function validateWorkflowDraft(draft: WorkflowDraft, inputCount = 0): string[] {
  const errors: string[] = [];
  if (draft.steps.length === 0) {
    errors.push('Add at least one operation step.');
    return errors;
  }

  const first = draft.steps[0];
  const last = draft.steps[draft.steps.length - 1];
  const inputMode = getWorkflowInputMode(draft);

  if (inputMode === 'multiple' && first.operation !== 'merge') {
    errors.push('With multiple input mode, the first step must be Merge.');
  }

  if (inputMode === 'multiple' && inputCount === 1) {
    errors.push('Merge requires at least two input PDFs.');
  }

  if (inputMode === 'single' && inputCount > 1) {
    errors.push('Use Merge as the first step to work with multiple input PDFs.');
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

function normalizeWorkflowCliOutputName(draft: WorkflowDraft, outputName?: string): string {
  const trimmed = outputName?.trim() ?? '';
  const isSplitOutput = draft.steps[draft.steps.length - 1]?.operation === 'split';

  if (trimmed.length > 0) {
    if (isSplitOutput) {
      return trimmed.replace(/\.pdf$/i, '') || 'workflow-output';
    }
    return trimmed.toLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;
  }

  return isSplitOutput ? 'workflow-output' : 'workflow-output.pdf';
}

export function buildWorkflowCliPreview(draft: WorkflowDraft, inputNames?: string[], outputName?: string): string {
  if (draft.steps.length === 0) {
    return '# Add one or more steps to generate a pipeline preview.';
  }

  const inputMode = getWorkflowInputMode(draft);
  const normalizedInputs = (inputNames ?? []).filter((item) => item.trim().length > 0);
  const multipleInputs =
    normalizedInputs.length > 0 ? normalizedInputs.map((item) => `"${item}"`).join(' ') : 'input-1.pdf input-2.pdf';
  const singleInput = normalizedInputs[0] ? `"${normalizedInputs[0]}"` : 'input.pdf';

  let command = inputMode === 'multiple' ? `filegap merge ${multipleInputs}` : `cat ${singleInput}`;

  draft.steps.forEach((step, index) => {
    const stepCommand = stepToCli(step);
    if (index === 0 && step.operation === 'merge' && inputMode === 'multiple') {
      command = stepCommand;
      return;
    }

    command = `${command} |\n  ${stepCommand}`;
  });

  const isSplitOutput = draft.steps[draft.steps.length - 1]?.operation === 'split';
  const normalizedOutput = normalizeWorkflowCliOutputName(draft, outputName);
  return `${command}\n> ${isSplitOutput ? `${normalizedOutput}.zip` : normalizedOutput}`;
}

export function isWorkflowBuilderImportState(value: unknown): value is WorkflowBuilderImportState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<WorkflowBuilderImportState>;
  return (
    typeof candidate.sourceLabel === 'string' &&
    Array.isArray(candidate.inputPaths) &&
    candidate.inputPaths.every((item) => typeof item === 'string') &&
    Boolean(candidate.draft) &&
    typeof candidate.draft === 'object' &&
    Array.isArray(candidate.draft.steps) &&
    (candidate.draft.inputMode === 'single' || candidate.draft.inputMode === 'multiple')
  );
}
