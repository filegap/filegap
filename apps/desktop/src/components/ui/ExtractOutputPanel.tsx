import type { RefObject } from 'react';
import { OutputActionSection } from './OutputActionSection';
import { OutputDestinationField } from './OutputDestinationField';
import { SidebarSection } from './SidebarSection';
import { TrustNotice } from './TrustNotice';

type ExtractOutputPanelProps = {
  outputName: string;
  outputInputRef?: RefObject<HTMLInputElement>;
  pageRanges: string;
  pageRangesInputRef?: RefObject<HTMLInputElement>;
  isPageRangesDisabled?: boolean;
  destinationLabel: string;
  destinationPath?: string;
  canRun: boolean;
  isProcessing: boolean;
  hasCompleted: boolean;
  actionLabel: string;
  onOutputNameChange: (next: string) => void;
  onPageRangesChange: (next: string) => void;
  onPageRangesBlur: () => void;
  onPageRangesSubmit: () => void;
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
  isPageRangesDisabled = false,
  destinationLabel,
  destinationPath,
  canRun,
  isProcessing,
  hasCompleted,
  actionLabel,
  onOutputNameChange,
  onPageRangesChange,
  onPageRangesBlur,
  onPageRangesSubmit,
  onChooseDestination,
  onRun,
  onNewExtract,
  onOpenFile,
  onShowInFolder,
}: ExtractOutputPanelProps) {
  const showCompletionState = hasCompleted && !isProcessing;

  return (
    <div className="output-panel">
      <SidebarSection title="Extract settings" className="output-panel-top">
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
          onBlur={onPageRangesBlur}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') {
              return;
            }
            event.preventDefault();
            onPageRangesSubmit();
          }}
          disabled={isPageRangesDisabled}
          className="output-input"
        />
        <p className="output-helper-text">Use commas and ranges, for example: 1,3,5-8.</p>
      </SidebarSection>

      <div className="output-panel-divider" />

      <SidebarSection title="Export" className="output-panel-top">
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
        loadingLabel="Extracting..."
        progressLabel="Extracting..."
        onRun={onRun}
        showCompletionState={showCompletionState}
        completionTitle="Extract completed"
        completionDetails="Your PDF is ready"
        onOpenFile={onOpenFile}
        onShowInFolder={onShowInFolder}
        onNewAction={onNewExtract}
        newActionLabel="New extract"
      />

      <TrustNotice className="output-panel-trust" />
    </div>
  );
}
