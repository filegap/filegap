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
  statusTone: 'neutral' | 'info' | 'error' | 'success';
  statusMessage: string;
  mergeActionLabel: string;
  onOutputNameChange: (next: string) => void;
  onChooseDestination: () => void;
  onRun: () => void;
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
  statusTone,
  statusMessage,
  mergeActionLabel,
  onOutputNameChange,
  onChooseDestination,
  onRun,
  onOpenFile,
  onShowInFolder,
}: OutputPanelProps) {
  const showResultActions = hasCompleted && statusTone === 'success' && !isProcessing;

  return (
    <div className="output-panel">
      <section className="output-panel-section">
        <h2>Output settings</h2>
        <label className="output-label" htmlFor="output-file-name">
          Output file name
        </label>
        <input
          id="output-file-name"
          type="text"
          ref={outputInputRef}
          value={outputName}
          onChange={(event) => onOutputNameChange(event.target.value)}
          className="output-input"
        />
        <Button variant="secondary" onClick={onChooseDestination}>
          Choose destination
        </Button>
        <p className="output-destination" title={destinationPath ?? destinationLabel}>
          <Folder aria-hidden="true" />
          <span>{destinationLabel}</span>
        </p>
      </section>

      <section className="output-panel-section">
        <Button
          onClick={onRun}
          loading={isProcessing}
          loadingLabel="Merging…"
          disabled={!canRun}
          className="merge-primary-btn"
        >
          {mergeActionLabel}
        </Button>
      </section>

      <section className="output-panel-section">
        <div className="status-inline-row">
          <p className={`status status-${statusTone}`}>{statusMessage}</p>
          {showResultActions ? (
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
          ) : null}
        </div>
        {isProcessing ? <p className="output-processing">Processing...</p> : null}
      </section>

      <section className="output-panel-trust">
        <Lock aria-hidden="true" />
        <p>Files are processed locally — never uploaded</p>
      </section>
    </div>
  );
}
