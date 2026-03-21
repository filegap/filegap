import { Check } from 'lucide-react';

type SplitThumbnail = {
  pageNumber: number;
  imageDataUrl: string;
};

type SplitThumbnailGridProps = {
  thumbnails: SplitThumbnail[];
  selectedPages: Set<number>;
  rangeStartPages: Set<number>;
  isLoading: boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  onTogglePage: (pageNumber: number) => void;
};

export function SplitThumbnailGrid({
  thumbnails,
  selectedPages,
  rangeStartPages,
  isLoading,
  loadingLabel = 'Rendering previews...',
  emptyTitle = 'No files selected',
  emptyHint = 'Drag & drop PDFs or click to browse',
  onTogglePage,
}: SplitThumbnailGridProps) {
  if (isLoading) {
    return <p className="file-loading-hint">{loadingLabel}</p>;
  }

  if (thumbnails.length === 0) {
    return (
      <div className="file-table-empty">
        <p>{emptyTitle}</p>
        <p>{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="thumbnail-grid-wrap" aria-label="Split page previews">
      {thumbnails.map((thumbnail) => {
        const isSelected = selectedPages.has(thumbnail.pageNumber);
        const isRangeStart = rangeStartPages.has(thumbnail.pageNumber);
        return (
          <button
            key={thumbnail.pageNumber}
            type="button"
            className={`thumbnail-card split-thumbnail-card ${isSelected ? 'thumbnail-card-selected' : ''} ${
              isRangeStart ? 'split-thumbnail-card-start' : ''
            }`.trim()}
            onClick={() => onTogglePage(thumbnail.pageNumber)}
            aria-label={`Toggle page ${thumbnail.pageNumber}`}
            aria-pressed={isSelected}
          >
            <span className={`thumbnail-selected-flag ${isSelected ? 'thumbnail-selected-flag-visible' : ''}`.trim()} aria-hidden="true">
              <Check />
            </span>
            {isRangeStart ? <span className="split-start-badge">Start</span> : null}
            <img src={thumbnail.imageDataUrl} alt={`Page ${thumbnail.pageNumber} preview`} loading="lazy" draggable={false} />
            <span className="thumbnail-page-label">Page {thumbnail.pageNumber}</span>
          </button>
        );
      })}
    </div>
  );
}
