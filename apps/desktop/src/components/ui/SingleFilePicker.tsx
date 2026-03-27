import { ChevronLeft, ChevronsDownUp, Upload } from 'lucide-react';
import { Dropzone } from './Dropzone';

type SingleFilePickerProps = {
  hasFile: boolean;
  isCollapsed: boolean;
  disabled?: boolean;
  fileCount: number;
  onSelectFiles: () => void;
  onShowPicker: () => void;
  onHidePicker: () => void;
};

export function SingleFilePicker({
  hasFile,
  isCollapsed,
  disabled = false,
  fileCount,
  onSelectFiles,
  onShowPicker,
  onHidePicker,
}: SingleFilePickerProps) {
  if (!hasFile) {
    return <Dropzone disabled={disabled} fileCount={fileCount} onSelectFiles={onSelectFiles} />;
  }

  if (isCollapsed) {
    return (
      <button
        type="button"
        className="extract-picker-collapsed-bar"
        onClick={onShowPicker}
        aria-label="Show file picker"
        title="Show file picker"
      >
        <span className="extract-picker-collapsed-left" aria-hidden="true">
          <Upload />
        </span>
        <span className="extract-picker-collapsed-right" aria-hidden="true">
          <ChevronLeft />
        </span>
      </button>
    );
  }

  return (
    <div className="extract-dropzone-shell">
      <button
        type="button"
        className="extract-dropzone-collapse-btn"
        onClick={onHidePicker}
        aria-label="Hide file picker"
        title="Hide file picker"
      >
        <ChevronsDownUp />
      </button>
      <Dropzone disabled={disabled} fileCount={fileCount} onSelectFiles={onSelectFiles} />
    </div>
  );
}
