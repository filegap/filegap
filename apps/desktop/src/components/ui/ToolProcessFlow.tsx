import { ArrowRight, GitBranch } from 'lucide-react';
import { Button } from './Button';
import { SidebarSection } from './SidebarSection';

type ToolProcessFlowProps = {
  steps: [string, string, string];
  activeStep: 0 | 1 | 2;
  onOpenWorkflowBuilder: () => void;
  disabled?: boolean;
};

export function ToolProcessFlow({ steps, activeStep, onOpenWorkflowBuilder, disabled = false }: ToolProcessFlowProps) {
  return (
    <SidebarSection title="Processing steps" className="output-panel-section">
      <p className="tool-process-flow-helper">Runs locally on your files.</p>
      <div className="tool-process-flow-row" aria-label="Processing steps">
        {steps.map((step, index) => (
          <div key={step} className="tool-process-flow-step-wrap">
            <span
              className={`tool-process-flow-step ${index === activeStep ? 'tool-process-flow-step-active' : ''}`.trim()}
            >
              {step}
            </span>
            {index < steps.length - 1 ? <ArrowRight aria-hidden="true" className="tool-process-flow-arrow" /> : null}
          </div>
        ))}
      </div>
      <Button variant="secondary" className="tool-process-flow-builder-btn" onClick={onOpenWorkflowBuilder} disabled={disabled}>
        <GitBranch aria-hidden="true" />
        <span>Open in Workflow Builder</span>
      </Button>
    </SidebarSection>
  );
}
