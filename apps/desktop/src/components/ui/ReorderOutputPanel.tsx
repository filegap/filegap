import type { ReactNode, RefObject } from 'react';
import { OutputActionSection } from './OutputActionSection';
import { OutputDestinationField } from './OutputDestinationField';
import { SidebarSection } from './SidebarSection';
import { TrustNotice } from './TrustNotice';

type ReorderOutputPanelProps = {
  outputName: string;
  outputInputRef?: RefObject<HTMLInputElement>;
  pageOrderValue: string;
  pageOrderInputRef?: RefObject<HTMLInputElement>;
  destinationLabel: string;
  destinationPath?: string;
  canRun: boolean;
  isProcessing: boolean;
  hasCompleted: boolean;
  actionLabel: string;
  onOutputNameChange: (next: string) => void;
  onPageOrderChange: (next: string) => void;
  onPageOrderBlur: () => void;
  onPageOrderSubmit: () => void;
  isPageOrderDisabled?: boolean;
  onChooseDestination: () => void;
  onRun: () => void;
  onNewReorder: () => void;
  onOpenFile: () => void;
  onShowInFolder: () => void;
  afterActionContent?: ReactNode;
};

export function ReorderOutputPanel({
  outputName,
  outputInputRef,
  pageOrderValue,
  pageOrderInputRef,
  destinationLabel,
  destinationPath,
  canRun,
  isProcessing,
  hasCompleted,
  actionLabel,
  onOutputNameChange,
  onPageOrderChange,
  onPageOrderBlur,
  onPageOrderSubmit,
  isPageOrderDisabled = false,
  onChooseDestination,
  onRun,
  onNewReorder,
  onOpenFile,
  onShowInFolder,
  afterActionContent,
}: ReorderOutputPanelProps) {
  const showCompletionState = hasCompleted && !isProcessing;

  return (
    <div className="output-panel">
      <SidebarSection title="Reorder settings" className="output-panel-top">
        <label className="output-label" htmlFor="reorder-page-order">
          Current order
        </label>
        <input
          id="reorder-page-order"
          type="text"
          ref={pageOrderInputRef}
          value={pageOrderValue}
          placeholder="Example: 1,2,3,4"
          onChange={(event) => onPageOrderChange(event.target.value)}
          onBlur={onPageOrderBlur}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') {
              return;
            }
            event.preventDefault();
            onPageOrderSubmit();
          }}
          disabled={isPageOrderDisabled}
          className="output-input"
        />
        <p className="output-helper-text">Drag page cards in the grid to set the new order.</p>
      </SidebarSection>

      <div className="output-panel-divider" />

      <SidebarSection title="Export" className="output-panel-top">
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
        loadingLabel="Reordering..."
        progressLabel="Reordering..."
        onRun={onRun}
        showCompletionState={showCompletionState}
        completionTitle="Reorder completed"
        completionDetails="Your PDF is ready"
        onOpenFile={onOpenFile}
        onShowInFolder={onShowInFolder}
        onNewAction={onNewReorder}
        newActionLabel="New reorder"
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
