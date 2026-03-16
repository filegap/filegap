import { useState } from 'react';
import { FileText, GripVertical, Trash2 } from 'lucide-react';

type UploadedFile = {
  id: string;
  filename: string;
  sizeBytes: number;
  pages: number | null;
  pagesStatus?: 'loading' | 'ready' | 'error';
};

type UploadedFilesTableProps = {
  files: UploadedFile[];
  reorderable: boolean;
  onRemove: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
};

function formatSize(sizeBytes: number): string {
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function formatPages(file: UploadedFile): string {
  if (file.pagesStatus === 'loading') {
    return '...';
  }
  if (file.pagesStatus === 'error' || file.pages === null) {
    return '-';
  }
  return `${file.pages}`;
}

export function UploadedFilesTable({ files, reorderable, onRemove, onReorder }: UploadedFilesTableProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='font-heading text-2xl font-semibold text-ui-text'>Uploaded files</h2>
        {reorderable && files.length > 1 ? (
          <p className='text-xs font-medium uppercase tracking-wide text-ui-muted'>Drag rows to reorder</p>
        ) : null}
      </div>

      {files.length === 0 ? (
        <p className='text-sm text-ui-muted'>No files selected yet.</p>
      ) : (
        <div className='overflow-hidden rounded-xl border border-ui-border bg-ui-surface'>
          <div className='grid grid-cols-[minmax(0,1fr)_90px_80px_80px] items-center gap-2 border-b border-ui-border bg-ui-bg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ui-muted'>
            <span>File</span>
            <span className='text-right'>Size</span>
            <span className='text-right'>Pages</span>
            <span className='text-right'>Actions</span>
          </div>
          <ul className='divide-y divide-ui-border'>
            {files.map((file, index) => (
              <li
                key={file.id}
                data-testid='uploaded-file-row'
                draggable={reorderable}
                onDragStart={(event) => {
                  if (!reorderable) {
                    return;
                  }
                  setDraggedIndex(index);
                  setDragOverIndex(null);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  if (!reorderable) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDragOverIndex(index);
                }}
                onDragLeave={() => {
                  if (!reorderable) {
                    return;
                  }
                  setDragOverIndex((current) => (current === index ? null : current));
                }}
                onDrop={(event) => {
                  if (!reorderable || !onReorder) {
                    return;
                  }
                  event.preventDefault();
                  if (draggedIndex === null || draggedIndex === index) {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                    return;
                  }
                  onReorder(draggedIndex, index);
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`grid grid-cols-[minmax(0,1fr)_90px_80px_80px] items-center gap-2 px-3 py-3 transition ${
                  draggedIndex === index
                    ? 'bg-brand-primary/5'
                    : dragOverIndex === index
                      ? 'bg-brand-primary/10'
                      : 'hover:bg-ui-bg'
                }`}
              >
                <div className='flex min-w-0 items-center gap-2'>
                  {reorderable ? (
                    <span className='cursor-grab rounded-md border border-ui-border bg-ui-bg p-1.5 text-brand-primary/80'>
                      <GripVertical className='h-4 w-4' aria-hidden='true' />
                    </span>
                  ) : null}
                  <span className='text-ui-muted' aria-hidden='true'>
                    <FileText className='h-4 w-4' />
                  </span>
                  <p data-testid='uploaded-file-name' className='truncate text-sm font-medium text-ui-text'>
                    {file.filename}
                  </p>
                </div>
                <p className='text-right text-sm text-ui-muted'>{formatSize(file.sizeBytes)}</p>
                <p className='text-right text-sm text-ui-muted'>{formatPages(file)}</p>
                <div className='text-right'>
                  <button
                    type='button'
                    onClick={() => onRemove(file.id)}
                    aria-label={`Remove ${file.filename}`}
                    title='Remove file'
                    className='inline-flex h-8 w-8 items-center justify-center rounded-md border border-ui-border text-ui-text transition hover:bg-ui-bg'
                  >
                    <Trash2 className='h-4 w-4' aria-hidden='true' />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
