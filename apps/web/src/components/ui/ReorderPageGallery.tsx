import { GripVertical } from 'lucide-react';

import type { PageThumbnail } from '../../lib/pdfPreview';

type ReorderPageGalleryProps = {
  thumbnails: PageThumbnail[];
  pageOrder: number[];
  isLoading: boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  previewLimit: number;
  totalPages: number | null;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

export function ReorderPageGallery({
  thumbnails,
  pageOrder,
  isLoading,
  loadingLabel = 'Rendering page previews locally...',
  emptyTitle = 'No page previews available',
  emptyHint = 'Select a PDF to generate local page previews.',
  previewLimit,
  totalPages,
  onReorder,
}: ReorderPageGalleryProps) {
  if (isLoading) {
    return (
      <div className='rounded-2xl bg-ui-bg/40 px-4 py-6'>
        <p className='text-sm text-ui-muted'>{loadingLabel}</p>
      </div>
    );
  }

  if (thumbnails.length === 0 || pageOrder.length === 0) {
    return (
      <div className='rounded-2xl bg-ui-bg/40 px-4 py-6'>
        <p className='text-sm font-medium text-ui-text'>{emptyTitle}</p>
        <p className='mt-1 text-sm text-ui-muted'>{emptyHint}</p>
      </div>
    );
  }

  const thumbnailByPage = new Map(thumbnails.map((thumbnail) => [thumbnail.pageNumber, thumbnail]));
  const orderedItems = pageOrder
    .map((pageNumber) => thumbnailByPage.get(pageNumber))
    .filter((thumbnail): thumbnail is PageThumbnail => Boolean(thumbnail));
  const isTruncated = totalPages !== null && totalPages > previewLimit;
  const denseGridClassName =
    orderedItems.length > 12
      ? 'sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
      : 'sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

  return (
    <div className='space-y-3'>
      {isTruncated ? (
        <p className='text-xs text-ui-muted'>
          Showing the first {previewLimit} pages to keep preview rendering fast on the web.
        </p>
      ) : null}
      <div
        className={`grid max-h-[40rem] grid-cols-2 gap-2 overflow-y-auto rounded-2xl bg-ui-bg/40 p-1.5 ${denseGridClassName}`.trim()}
        aria-label='Reorder page previews'
      >
        {orderedItems.map((thumbnail, index) => (
          <div
            key={`${thumbnail.pageNumber}-${index}`}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', String(index));
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(event) => {
              event.preventDefault();
              const fromIndex = Number.parseInt(event.dataTransfer.getData('text/plain'), 10);
              if (!Number.isInteger(fromIndex) || fromIndex === index) {
                return;
              }
              onReorder(fromIndex, index);
            }}
            className='group relative rounded-2xl bg-ui-surface p-1.5 text-left transition duration-150 hover:bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]'
            aria-label={`Move page ${thumbnail.pageNumber}`}
            title='Drag to reorder'
          >
            <div className='relative overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5 transition group-hover:ring-brand-primary/15'>
              <span className='absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border border-ui-border bg-ui-surface/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ui-muted shadow-sm'>
                <GripVertical className='h-3 w-3' />
                #{index + 1}
              </span>
              <div className='aspect-[3/4] w-full overflow-hidden rounded-lg bg-white'>
                <img
                  src={thumbnail.imageDataUrl}
                  alt={`Page ${thumbnail.pageNumber} preview`}
                  loading='lazy'
                  draggable={false}
                  className='h-full w-full object-contain'
                />
              </div>
            </div>
            <span className='mt-1.5 block text-xs font-medium leading-tight text-ui-muted'>
              Page {thumbnail.pageNumber}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
