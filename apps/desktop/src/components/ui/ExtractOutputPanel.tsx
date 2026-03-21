import type { RefObject } from 'react';
import { Folder, Lock, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { ResultStateBlock } from './ResultStateBlock';

type ExtractOutputPanelProps = {
  outputName: string;
  outputInputRef?: RefObject<HTMLInputElement>;
  pageRanges: string;
  pageRangesInputRef?: RefObject<HTMLInputElement>;
  destinationLabel: string;
  destinationPath?: string;
  canRun: boolean;
  isProcessing: boolean;
  hasCompleted: boolean;
  actionLabel: string;
  onOutputNameChange: (next: string) => void;
  onPageRangesChange: (next: string) => void;
  onChooseDestination: () => void;
  onRun: () => void;
  onNewExtract: () => void;
  onOpenFile: () => void;
  onShowInFolder: () => void;
};

export function ExtractOutputPanel({
  outputName,
  outputInputRef,
  pageRanges,
  pageRangesInputRef,
  destinationLabel,
  destinationPath,
  canRun,
  isProcessing,
  hasCompleted,
  actionLabel,
  onOutputNameChange,
  onPageRangesChange,
  onChooseDestination,
  onRun,
  onNewExtract,
  onOpenFile,
  onShowInFolder,
}: ExtractOutputPanelProps) {
  const showCompletionState = hasCompleted && !isProcessing;

  return (
    <div className="output-panel">
      <section className="output-panel-top output-panel-section">
        <h2>Export</h2>
        <label className="output-label" htmlFor="extract-output-file-name">
          File name
        </label>
        <input
          id="extract-output-file-name"
          type="text"
          ref={outputInputRef}
          value={outputName}
          onChange={(event) => onOutputNameChange(event.target.value)}
          className="output-input"
        />
        <label className="output-label" htmlFor="extract-page-ranges">
          Page ranges
        </label>
        <input
          id="extract-page-ranges"
          type="text"
          ref={pageRangesInputRef}
          value={pageRanges}
          placeholder="Example: 1,3,5-8"
          onChange={(event) => onPageRangesChange(event.target.value)}
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
          loadingLabel="Extracting..."
          disabled={!canRun}
          className="merge-primary-btn"
        >
          {actionLabel}
        </Button>
        {isProcessing ? <p className="output-merge-progress">Extracting...</p> : null}

        {showCompletionState ? (
          <>
            <ResultStateBlock title="Extract completed" details="Your PDF is ready" onOpen={onOpenFile} onReveal={onShowInFolder} />
            <Button variant="ghost" className="output-new-merge-btn" onClick={onNewExtract}>
              <RotateCcw aria-hidden="true" />
              <span>New extract</span>
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
