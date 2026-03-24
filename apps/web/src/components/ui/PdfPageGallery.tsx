import { Check } from 'lucide-react';

import type { PageThumbnail } from '../../lib/pdfPreview';

type PdfPageGalleryProps = {
  thumbnails: PageThumbnail[];
  selectedPages: Set<number>;
  isLoading: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  loadingLabel?: string;
  previewLimit: number;
  totalPages: number | null;
  onTogglePage: (pageNumber: number) => void;
};

export function PdfPageGallery({
  thumbnails,
  selectedPages,
  isLoading,
  emptyTitle = 'No page previews available',
  emptyHint = 'Select a PDF to generate local page previews.',
  loadingLabel = 'Rendering page previews locally...',
  previewLimit,
  totalPages,
  onTogglePage,
}: PdfPageGalleryProps) {
  if (isLoading) {
    return (
      <div className='rounded-2xl bg-ui-bg/40 px-4 py-6'>
        <p className='text-sm text-ui-muted'>{loadingLabel}</p>
      </div>
    );
  }

  if (thumbnails.length === 0) {
    return (
      <div className='rounded-2xl bg-ui-bg/40 px-4 py-6'>
        <p className='text-sm font-medium text-ui-text'>{emptyTitle}</p>
        <p className='mt-1 text-sm text-ui-muted'>{emptyHint}</p>
      </div>
    );
  }

  const isTruncated = totalPages !== null && totalPages > previewLimit;
  const denseGridClassName =
    thumbnails.length > 12
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
        aria-label='PDF page previews'
      >
        {thumbnails.map((thumbnail) => {
          const isSelected = selectedPages.has(thumbnail.pageNumber);
          return (
            <button
              key={thumbnail.pageNumber}
              type='button'
              onClick={() => onTogglePage(thumbnail.pageNumber)}
              aria-label={`Select page ${thumbnail.pageNumber}`}
              aria-pressed={isSelected}
              className={`group relative rounded-2xl p-1.5 text-left transition duration-150 ${
                isSelected
                  ? 'bg-brand-primary/8 shadow-[0_10px_30px_rgba(255,46,139,0.10)] ring-1 ring-brand-primary/35'
                  : 'bg-ui-surface hover:bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]'
              }`}
            >
              <div
                className={`relative overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 transition ${
                  isSelected ? 'ring-transparent' : 'ring-black/5 group-hover:ring-brand-primary/15'
                }`}
              >
                <span
                  className={`absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-white shadow-sm transition ${
                    isSelected
                      ? 'border-brand-primary-dark bg-brand-primary opacity-100'
                      : 'border-white/80 bg-black/20 opacity-0'
                  }`}
                  aria-hidden='true'
                >
                  <Check className='h-3.5 w-3.5' />
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
              <span className={`mt-1.5 block text-xs leading-tight ${isSelected ? 'font-semibold text-ui-text' : 'font-medium text-ui-muted'}`}>
                Page {thumbnail.pageNumber}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
