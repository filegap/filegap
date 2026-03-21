import type { RefObject } from 'react';
import { Folder, Lock, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { ResultStateBlock } from './ResultStateBlock';

type SplitOutputPanelProps = {
  outputBaseName: string;
  outputInputRef?: RefObject<HTMLInputElement>;
  pagesPerFile: number;
  destinationLabel: string;
  destinationPath?: string;
  canRun: boolean;
  isProcessing: boolean;
  hasCompleted: boolean;
  completedOutputCount: number | null;
  actionLabel: string;
  onOutputBaseNameChange: (next: string) => void;
  onPagesPerFileChange: (next: number) => void;
  onChooseDestination: () => void;
  onRun: () => void;
  onNewSplit: () => void;
  onOpenFile: () => void;
  onShowInFolder: () => void;
};

export function SplitOutputPanel({
  outputBaseName,
  outputInputRef,
  pagesPerFile,
  destinationLabel,
  destinationPath,
  canRun,
  isProcessing,
  hasCompleted,
  completedOutputCount,
  actionLabel,
  onOutputBaseNameChange,
  onPagesPerFileChange,
  onChooseDestination,
  onRun,
  onNewSplit,
  onOpenFile,
  onShowInFolder,
}: SplitOutputPanelProps) {
  const showCompletionState = hasCompleted && !isProcessing && completedOutputCount !== null;
  const pageWord = pagesPerFile === 1 ? 'page' : 'pages';

  return (
    <div className="output-panel">
      <section className="output-panel-top output-panel-section">
        <h2>Split settings</h2>
        <label className="output-label" htmlFor="split-pages-per-file">
          Pages per file
        </label>
        <input
          id="split-pages-per-file"
          type="number"
          min={1}
          step={1}
          value={pagesPerFile}
          onChange={(event) => onPagesPerFileChange(Number(event.target.value) || 1)}
          className="output-input"
        />
        <p className="output-helper-text">Each output file will contain {pagesPerFile} {pageWord}.</p>
      </section>

      <div className="output-panel-divider" />

      <section className="output-panel-top output-panel-section">
        <h2>Export</h2>
        <label className="output-label" htmlFor="output-base-name">
          File name
        </label>
        <input
          id="output-base-name"
          type="text"
          ref={outputInputRef}
          value={outputBaseName}
          onChange={(event) => onOutputBaseNameChange(event.target.value)}
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
        <Button onClick={onRun} loading={isProcessing} loadingLabel="Splitting..." disabled={!canRun} className="merge-primary-btn">
          {actionLabel}
        </Button>
        {isProcessing ? <p className="output-merge-progress">Splitting...</p> : null}

        {showCompletionState ? (
          <>
            <ResultStateBlock
              title="✓ Split completed"
              details={`${completedOutputCount} files created`}
              onOpen={onOpenFile}
              onReveal={onShowInFolder}
            />
            <Button variant="ghost" className="output-new-merge-btn" onClick={onNewSplit}>
              <RotateCcw aria-hidden="true" />
              <span>New split</span>
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
