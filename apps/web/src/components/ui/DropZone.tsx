import { useRef, useState } from 'react';

type DropZoneProps = {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  loadedFileName?: string | null;
};

export function DropZone({
  onFilesSelected,
  multiple = true,
  disabled = false,
  loadedFileName = null,
}: DropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasLoadedFile = Boolean(loadedFileName);

  const headingText = dragActive ? 'Release to add files' : 'Drag & drop PDF files';
  const supportText = dragActive
    ? 'Drop now to add files directly in your browser.'
    : 'Or select files from your device. Files stay in your browser.';
  const ctaText = hasLoadedFile
    ? multiple
      ? 'Add more PDF files'
      : 'Replace PDF file'
    : 'Select PDF files';
  const ctaClassName = disabled
    ? 'mt-5 rounded-lg border border-ui-border bg-ui-bg px-4 py-2.5 text-xs font-semibold text-ui-muted'
    : 'mt-5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 px-4 py-2.5 text-xs font-semibold text-brand-primary transition-colors duration-150 group-hover:border-brand-primary-dark group-hover:bg-brand-primary-dark group-hover:text-white';

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
      onClick={() => {
        if (!disabled) {
          fileInputRef.current?.click();
        }
      }}
      onKeyDown={(event) => {
        if (disabled) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        if (disabled) {
          return;
        }
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(event) => {
        if (disabled) {
          return;
        }
        event.preventDefault();
        setDragActive(false);
      }}
      onDrop={(event) => {
        if (disabled) {
          return;
        }
        event.preventDefault();
        setDragActive(false);
        applyFiles(event.dataTransfer.files);
      }}
      className={`group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-7 py-11 text-center transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed border-ui-border bg-ui-bg opacity-70'
          : dragActive
          ? 'border-brand-primary bg-brand-primary/8 shadow-[0_0_0_3px_rgba(255,46,139,0.10)]'
          : 'border-ui-border bg-ui-surface hover:border-brand-primary/70 hover:bg-brand-primary/10'
      }`}
    >
      <p className='font-heading text-2xl font-semibold text-ui-text md:text-3xl'>{headingText}</p>
      <p className='mt-2 max-w-xl text-sm text-ui-muted'>{supportText}</p>
      <p className={ctaClassName}>{ctaText}</p>

      <input
        ref={fileInputRef}
        type='file'
        className='hidden'
        accept='application/pdf'
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          applyFiles(event.target.files);
          // Allow selecting the same file again in a subsequent pick.
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
