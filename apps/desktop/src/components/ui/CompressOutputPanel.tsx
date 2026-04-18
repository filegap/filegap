import type { ReactNode, RefObject } from 'react';
import { OutputActionSection } from './OutputActionSection';
import { OutputDestinationField } from './OutputDestinationField';
import { SidebarSection } from './SidebarSection';
import { TrustNotice } from './TrustNotice';

type CompressPreset = 'low' | 'balanced' | 'strong';

type CompressOutputPanelProps = {
  outputName: string;
  outputInputRef?: RefObject<HTMLInputElement>;
  preset: CompressPreset;
  destinationLabel: string;
  destinationPath?: string;
  canRun: boolean;
  isProcessing: boolean;
  hasCompleted: boolean;
  actionLabel: string;
  onOutputNameChange: (next: string) => void;
  onPresetChange: (next: CompressPreset) => void;
  onChooseDestination: () => void;
  onRun: () => void;
  onNewCompress: () => void;
  onOpenFile: () => void;
  onShowInFolder: () => void;
  afterActionContent?: ReactNode;
};

export function CompressOutputPanel({
  outputName,
  outputInputRef,
  preset,
  destinationLabel,
  destinationPath,
  canRun,
  isProcessing,
  hasCompleted,
  actionLabel,
  onOutputNameChange,
  onPresetChange,
  onChooseDestination,
  onRun,
  onNewCompress,
  onOpenFile,
  onShowInFolder,
  afterActionContent,
}: CompressOutputPanelProps) {
  const showCompletionState = hasCompleted && !isProcessing;

  return (
    <div className="output-panel">
      <SidebarSection title="Compress settings" className="output-panel-top">
        <label className="output-label" htmlFor="compress-preset">
          Preset
        </label>
        <select
          id="compress-preset"
          value={preset}
          onChange={(event) => onPresetChange(event.target.value as CompressPreset)}
          className="output-input"
        >
          <option value="low">Low (better quality)</option>
          <option value="balanced">Balanced</option>
          <option value="strong">Strong (smaller file)</option>
        </select>
        <p className="output-helper-text">
          Compression runs locally and may reduce visual quality depending on the selected preset.
        </p>
      </SidebarSection>

      <div className="output-panel-divider" />

      <SidebarSection title="Export" className="output-panel-top">
        <label className="output-label" htmlFor="compress-output-file-name">
          File name
        </label>
        <input
          id="compress-output-file-name"
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
        loadingLabel="Compressing..."
        progressLabel="Compressing..."
        onRun={onRun}
        showCompletionState={showCompletionState}
        completionTitle="Compress completed"
        completionDetails="Your PDF is ready"
        onOpenFile={onOpenFile}
        onShowInFolder={onShowInFolder}
        onNewAction={onNewCompress}
        newActionLabel="New compress"
      />

      {afterActionContent ? (
        <>
          <div className="output-panel-divider" />
          {afterActionContent}
        </>
      ) : null}

      <TrustNotice className="output-panel-trust" />
    </div>
  );
}
