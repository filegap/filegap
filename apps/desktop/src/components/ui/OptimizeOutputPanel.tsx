import type { RefObject } from 'react';
import { OutputActionSection } from './OutputActionSection';
import { OutputDestinationField } from './OutputDestinationField';
import { SidebarSection } from './SidebarSection';
import { TrustNotice } from './TrustNotice';

type OptimizeOutputPanelProps = {
  outputName: string;
  outputInputRef?: RefObject<HTMLInputElement>;
  destinationLabel: string;
  destinationPath?: string;
  canRun: boolean;
  isProcessing: boolean;
  hasCompleted: boolean;
  actionLabel: string;
  onOutputNameChange: (next: string) => void;
  onChooseDestination: () => void;
  onRun: () => void;
  onNewOptimize: () => void;
  onOpenFile: () => void;
  onShowInFolder: () => void;
};

export function OptimizeOutputPanel({
  outputName,
  outputInputRef,
  destinationLabel,
  destinationPath,
  canRun,
  isProcessing,
  hasCompleted,
  actionLabel,
  onOutputNameChange,
  onChooseDestination,
  onRun,
  onNewOptimize,
  onOpenFile,
  onShowInFolder,
}: OptimizeOutputPanelProps) {
  const showCompletionState = hasCompleted && !isProcessing;

  return (
    <div className="output-panel">
      <SidebarSection title="Optimize settings" className="output-panel-top">
        <p className="output-helper-text">
          Optimizes PDF structure locally without intentional visual quality reduction.
        </p>
      </SidebarSection>

      <div className="output-panel-divider" />

      <SidebarSection title="Export" className="output-panel-top">
        <label className="output-label" htmlFor="optimize-output-file-name">
          File name
        </label>
        <input
          id="optimize-output-file-name"
          type="text"
          ref={outputInputRef}
          value={outputName}
          onChange={(event) => onOutputNameChange(event.target.value)}
          className="output-input"
        />
        <OutputDestinationField
          destinationLabel={destinationLabel}
          destinationPath={destinationPath}
          onChooseDestination={onChooseDestination}
        />
      </SidebarSection>

      <div className="output-panel-divider" />

      <OutputActionSection
        canRun={canRun}
        isProcessing={isProcessing}
        actionLabel={actionLabel}
        loadingLabel="Optimizing..."
        progressLabel="Optimizing..."
        onRun={onRun}
        showCompletionState={showCompletionState}
        completionTitle="Optimize completed"
        completionDetails="Your PDF is ready"
        onOpenFile={onOpenFile}
        onShowInFolder={onShowInFolder}
        onNewAction={onNewOptimize}
        newActionLabel="New optimize"
      />

      <TrustNotice className="output-panel-trust" />
    </div>
  );
}
