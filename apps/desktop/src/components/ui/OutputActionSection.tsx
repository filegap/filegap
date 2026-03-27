import { RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { ResultStateBlock } from './ResultStateBlock';

type OutputActionSectionProps = {
  canRun: boolean;
  isProcessing: boolean;
  actionLabel: string;
  loadingLabel: string;
  progressLabel: string;
  onRun: () => void;
  showCompletionState: boolean;
  completionTitle: string;
  completionDetails: string;
  onOpenFile: () => void;
  onShowInFolder: () => void;
  onNewAction: () => void;
  newActionLabel: string;
};

export function OutputActionSection({
  canRun,
  isProcessing,
  actionLabel,
  loadingLabel,
  progressLabel,
  onRun,
  showCompletionState,
  completionTitle,
  completionDetails,
  onOpenFile,
  onShowInFolder,
  onNewAction,
  newActionLabel,
}: OutputActionSectionProps) {
  return (
    <section className="output-actions-block output-panel-section">
      <Button
        onClick={onRun}
        loading={isProcessing}
        loadingLabel={loadingLabel}
        disabled={!canRun}
        className="merge-primary-btn"
        size="lg"
      >
        {actionLabel}
      </Button>
      {isProcessing ? <p className="output-merge-progress">{progressLabel}</p> : null}

      {showCompletionState ? (
        <>
          <ResultStateBlock
            title={completionTitle}
            details={completionDetails}
            onOpen={onOpenFile}
            onReveal={onShowInFolder}
          />
          <Button variant="ghost" className="output-new-merge-btn" onClick={onNewAction}>
            <RotateCcw aria-hidden="true" />
            <span>{newActionLabel}</span>
          </Button>
        </>
      ) : null}
    </section>
  );
}
