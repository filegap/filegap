import { ChevronLeft, FileText, Trash2 } from 'lucide-react';

type FileSelectionSummaryProps = {
  label?: string;
  filename: string;
  meta: string;
  onReplace: () => void;
  onRemove: () => void;
};

export function FileSelectionSummary({
  label,
  filename,
  meta,
  onReplace,
  onRemove,
}: FileSelectionSummaryProps) {
  return (
    <div className='space-y-2'>
      {label ? (
        <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>{label}</p>
      ) : null}
      <div className='flex w-full items-center gap-3 rounded-xl border border-ui-border/70 bg-ui-surface px-3 py-2.5 text-left transition-all duration-200 hover:border-brand-primary/35 hover:bg-ui-bg'>
        <span className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ui-bg text-ui-muted'>
          <FileText className='h-4.5 w-4.5' />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-sm font-semibold text-ui-text'>{filename}</span>
          <span className='block text-xs text-ui-muted'>{meta}</span>
        </span>
        <button
          type='button'
          onClick={onReplace}
          aria-label='Show file picker'
          title='Show file picker'
          className='inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
        >
          <span className='hidden sm:inline'>Replace</span>
          <ChevronLeft className='h-4 w-4' />
        </button>
        <button
          type='button'
          onClick={onRemove}
          aria-label='Remove file'
          title='Remove file'
          className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
        >
          <Trash2 className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
}
