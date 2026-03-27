import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from './Button';

type DropzoneProps = {
  disabled?: boolean;
  fileCount: number;
  onSelectFiles: () => void;
};

export function Dropzone({ disabled = false, fileCount, onSelectFiles }: DropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileCountLabel = fileCount === 1 ? '1 file' : `${fileCount} files`;

  return (
    <section
      className={`dropzone ${dragActive ? 'dropzone-drag-active' : ''} ${disabled ? 'dropzone-disabled' : ''}`.trim()}
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(event) => {
        if (disabled) return;
        event.preventDefault();
        setDragActive(false);
      }}
      onDrop={(event) => {
        if (disabled) return;
        event.preventDefault();
        setDragActive(false);
        onSelectFiles();
      }}
    >
      <Upload aria-hidden="true" />
      <h2>Drag &amp; drop PDF files</h2>
      <p>Or select files from your device</p>
      <Button onClick={onSelectFiles} variant="secondary" size="lg" disabled={disabled}>
        Select PDF files
      </Button>
      <p className="dropzone-hint">Shortcut: Cmd/Ctrl + O</p>
      <p className="dropzone-count">{fileCountLabel}</p>
    </section>
  );
}
