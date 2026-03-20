import type { RefObject } from 'react';
import { File, Folder, Lock } from 'lucide-react';
import { Button } from './Button';

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
            <div className="output-result-block">
              <div className="output-complete-state">
                <p className="output-complete-title">✓ Merge completed</p>
                <p className="output-complete-details">{completedMergeCount} files merged</p>

                <div className="output-result-inline-actions">
                  <button
                    type="button"
                    className="output-inline-action"
                    onClick={onOpenFile}
                    title="Open file"
                    aria-label="Open file"
                  >
                    <File aria-hidden="true" />
                    <span>Open</span>
                  </button>
                  <button
                    type="button"
                    className="output-inline-action"
                    onClick={onShowInFolder}
                    title="Show in folder"
                    aria-label="Show in folder"
                  >
                    <Folder aria-hidden="true" />
                    <span>Show</span>
                  </button>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="output-new-merge-btn" onClick={onNewMerge}>
              Start new merge
            </Button>
          </>
        ) : null}
      </section>

      <section className="output-panel-trust">
        <Lock aria-hidden="true" />
        <p>Processed locally on your device — no uploads</p>
      </section>
    </div>
  );
}
