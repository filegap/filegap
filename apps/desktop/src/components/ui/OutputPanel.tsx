import type { RefObject } from 'react';
import { Button } from './Button';
import { OutputActionSection } from './OutputActionSection';
import { OutputDestinationField } from './OutputDestinationField';
import { SidebarSection } from './SidebarSection';
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

  return (
    <div className="output-panel">
      <SidebarSection title="Export" className="output-panel-top">
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
        actionLabel={mergeActionLabel}
        loadingLabel="Merging..."
        progressLabel="Merging..."
        onRun={onRun}
        showCompletionState={showCompletionState}
        completionTitle="Merge completed"
        completionDetails={`${completedMergeCount} files merged`}
        onOpenFile={onOpenFile}
        onShowInFolder={onShowInFolder}
        onNewAction={onNewMerge}
        newActionLabel="New merge"
      />

      <TrustNotice className="output-panel-trust" />
    </div>
  );
}
