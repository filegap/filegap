import type { RefObject } from 'react';
import { Button } from './Button';
import { OutputActionSection } from './OutputActionSection';
import { OutputDestinationField } from './OutputDestinationField';
import { SidebarSection } from './SidebarSection';
import { TrustNotice } from './TrustNotice';

type SplitOutputPanelProps = {
  splitMode: 'pages' | 'ranges';
  outputBaseName: string;
  outputInputRef?: RefObject<HTMLInputElement>;
  pagesPerFile: number;
  pageRanges: string;
  pageRangesInputRef?: RefObject<HTMLInputElement>;
  destinationLabel: string;
  destinationPath?: string;
  canRun: boolean;
  isProcessing: boolean;
  hasCompleted: boolean;
  completedOutputCount: number | null;
  actionLabel: string;
  onSplitModeChange: (next: 'pages' | 'ranges') => void;
  onOutputBaseNameChange: (next: string) => void;
  onPagesPerFileChange: (next: number) => void;
  onPageRangesChange: (next: string) => void;
  onPageRangesBlur: () => void;
  onPageRangesSubmit: () => void;
  isPageRangesDisabled?: boolean;
  onChooseDestination: () => void;
  onRun: () => void;
  onNewSplit: () => void;
  onOpenFile: () => void;
  onShowInFolder: () => void;
};

export function SplitOutputPanel({
  splitMode,
  outputBaseName,
  outputInputRef,
  pagesPerFile,
  pageRanges,
  pageRangesInputRef,
  destinationLabel,
  destinationPath,
  canRun,
  isProcessing,
  hasCompleted,
  completedOutputCount,
  actionLabel,
  onSplitModeChange,
  onOutputBaseNameChange,
  onPagesPerFileChange,
  onPageRangesChange,
  onPageRangesBlur,
  onPageRangesSubmit,
  isPageRangesDisabled = false,
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
      <SidebarSection title="Split settings" className="output-panel-top">
        <div className="stack-row">
          <Button
            variant={splitMode === 'pages' ? 'secondary' : 'ghost'}
            onClick={() => onSplitModeChange('pages')}
            disabled={isProcessing}
          >
            By size
          </Button>
          <Button
            variant={splitMode === 'ranges' ? 'secondary' : 'ghost'}
            onClick={() => onSplitModeChange('ranges')}
            disabled={isProcessing}
          >
            By ranges
          </Button>
        </div>
        {splitMode === 'pages' ? (
          <>
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
          </>
        ) : (
          <>
            <label className="output-label" htmlFor="split-page-ranges">
              Page ranges
            </label>
            <input
              id="split-page-ranges"
              type="text"
              ref={pageRangesInputRef}
              value={pageRanges}
              placeholder="Example: 1-3,4,5-10"
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
            <p className="output-helper-text">Create one output file per range, for example: 1-3,4,5-10.</p>
          </>
        )}
      </SidebarSection>

      <div className="output-panel-divider" />

      <SidebarSection title="Export" className="output-panel-top">
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
        loadingLabel="Splitting..."
        progressLabel="Splitting..."
        onRun={onRun}
        showCompletionState={showCompletionState}
        completionTitle="Split completed"
        completionDetails={`${completedOutputCount} files created`}
        onOpenFile={onOpenFile}
        onShowInFolder={onShowInFolder}
        onNewAction={onNewSplit}
        newActionLabel="New split"
      />

      <TrustNotice className="output-panel-trust" />
    </div>
  );
}
