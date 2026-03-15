import { useRef, useState } from 'react';

type DropZoneProps = {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
};

export function DropZone({ onFilesSelected, multiple = true }: DropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function applyFiles(fileList: FileList | null): void {
    if (!fileList) {
      return;
    }
    const files = Array.from(fileList).filter((file) => file.type === 'application/pdf');
    onFilesSelected(files);
  }

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        applyFiles(event.dataTransfer.files);
      }}
      className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
        dragActive
          ? 'border-brand-primary bg-brand-primary/10'
          : 'border-ui-border bg-ui-bg hover:border-brand-primary/60 hover:bg-brand-primary/5'
      }`}
    >
      <p className='font-heading text-2xl font-semibold text-ui-text md:text-3xl'>
        Drag & Drop PDF Files
      </p>
      <p className='mt-2 max-w-xl text-sm text-ui-muted'>
        Files are processed locally in your browser. No uploads.
      </p>
      <p className='mt-4 rounded-lg bg-brand-accent px-3 py-1 text-xs font-semibold text-ui-text'>
        Click to browse files
      </p>

      <input
        ref={fileInputRef}
        type='file'
        className='hidden'
        accept='application/pdf'
        multiple={multiple}
        onChange={(event) => applyFiles(event.target.files)}
      />
    </div>
  );
}
