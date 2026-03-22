import type { RefObject } from 'react';
import { Folder, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { ResultStateBlock } from './ResultStateBlock';
import { TrustNotice } from './TrustNotice';

type OutputPanelProps = {
  outputName: string;
  outputInputRef?: RefObject<HTMLInputElement>;
  destinationLabel: string;
  destinationPath?: string;
  canRun: boolean;
  isProcessing: boolean;
  hasCompleted: boolean;
  completedMergeCount: number | null;
  mergeActionLabel: string;
  onOutputNameChange: (next: string) => void;
  onChooseDestination: () => void;
  onRun: () => void;
  onNewMerge: () => void;
  onOpenFile: () => void;
  onShowInFolder: () => void;
};

export function OutputPanel({
  outputName,
  outputInputRef,
  destinationLabel,
  destinationPath,
  canRun,
  isProcessing,
  hasCompleted,
  completedMergeCount,
  mergeActionLabel,
  onOutputNameChange,
  onChooseDestination,
  onRun,
  onNewMerge,
  onOpenFile,
  onShowInFolder,
}: OutputPanelProps) {
  const showCompletionState = hasCompleted && !isProcessing && completedMergeCount !== null;
  const showResultActions = showCompletionState;

  return (
    <div className="output-panel">
      <section className="output-panel-top output-panel-section">
        <h2>Export</h2>
        <label className="output-label" htmlFor="output-file-name">
          File name
        </label>
        <input
          id="output-file-name"
          type="text"
          ref={outputInputRef}
          value={outputName}
          onChange={(event) => onOutputNameChange(event.target.value)}
          className="output-input"
        />
        <div className="output-location-row">
          <p className="output-location-label">Location</p>
          <div className="output-destination-wrap">
            <p className="output-destination" title={destinationPath ?? destinationLabel}>
              <Folder aria-hidden="true" />
              <span>{destinationLabel}</span>
            </p>
            <Button variant="ghost" className="output-change-btn" onClick={onChooseDestination}>
              Change
            </Button>
          </div>
        </div>
      </section>

      <div className="output-panel-divider" />

      <section className="output-actions-block output-panel-section">
        <Button
          onClick={onRun}
          loading={isProcessing}
          loadingLabel="Merging..."
          disabled={!canRun}
          className="merge-primary-btn"
        >
          {mergeActionLabel}
        </Button>
        {isProcessing ? <p className="output-merge-progress">Merging...</p> : null}

        {showCompletionState ? (
          <>
            <ResultStateBlock
              title="Merge completed"
              details={`${completedMergeCount} files merged`}
              onOpen={onOpenFile}
              onReveal={onShowInFolder}
            />
            <Button variant="ghost" className="output-new-merge-btn" onClick={onNewMerge}>
              <RotateCcw aria-hidden="true" />
              <span>New merge</span>
            </Button>
          </>
        ) : null}
      </section>

      <TrustNotice className="output-panel-trust" />
    </div>
  );
}
