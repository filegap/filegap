import type { RefObject } from 'react';
import { Folder, Lock, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { ResultStateBlock } from './ResultStateBlock';

type ReorderOutputPanelProps = {
  outputName: string;
  outputInputRef?: RefObject<HTMLInputElement>;
  pageOrderLabel: string;
  destinationLabel: string;
  destinationPath?: string;
  canRun: boolean;
  isProcessing: boolean;
  hasCompleted: boolean;
  actionLabel: string;
  onOutputNameChange: (next: string) => void;
  onChooseDestination: () => void;
  onRun: () => void;
  onNewReorder: () => void;
  onOpenFile: () => void;
  onShowInFolder: () => void;
};

export function ReorderOutputPanel({
  outputName,
  outputInputRef,
  pageOrderLabel,
  destinationLabel,
  destinationPath,
  canRun,
  isProcessing,
  hasCompleted,
  actionLabel,
  onOutputNameChange,
  onChooseDestination,
  onRun,
  onNewReorder,
  onOpenFile,
  onShowInFolder,
}: ReorderOutputPanelProps) {
  const showCompletionState = hasCompleted && !isProcessing;

  return (
    <div className="output-panel">
      <section className="output-panel-top output-panel-section">
        <h2>Reorder settings</h2>
        <p className="output-helper-text">Drag page cards in the grid to set the new order.</p>
        <p className="output-helper-text output-helper-order">Current order: {pageOrderLabel || '-'}</p>
      </section>

      <div className="output-panel-divider" />

      <section className="output-panel-top output-panel-section">
        <h2>Export</h2>
        <label className="output-label" htmlFor="reorder-output-file-name">
          File name
        </label>
        <input
          id="reorder-output-file-name"
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
          loadingLabel="Reordering..."
          disabled={!canRun}
          className="merge-primary-btn"
        >
          {actionLabel}
        </Button>
        {isProcessing ? <p className="output-merge-progress">Reordering...</p> : null}

        {showCompletionState ? (
          <>
            <ResultStateBlock
              title="✓ Reorder completed"
              details="Your PDF is ready"
              onOpen={onOpenFile}
              onReveal={onShowInFolder}
            />
            <Button variant="ghost" className="output-new-merge-btn" onClick={onNewReorder}>
              <RotateCcw aria-hidden="true" />
              <span>New reorder</span>
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
