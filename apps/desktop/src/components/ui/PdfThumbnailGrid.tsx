type PdfThumbnail = {
  pageNumber: number;
  imageDataUrl: string;
};

type PdfThumbnailGridProps = {
  thumbnails: PdfThumbnail[];
  selectedPages: Set<number>;
  isLoading: boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  onTogglePage: (pageNumber: number) => void;
};

export function PdfThumbnailGrid({
  thumbnails,
  selectedPages,
  isLoading,
  loadingLabel = 'Rendering previews...',
  emptyTitle = 'No page previews available',
  emptyHint = 'Select a PDF file to generate page thumbnails',
  onTogglePage,
}: PdfThumbnailGridProps) {
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
    <div className="thumbnail-grid-wrap" aria-label="PDF page previews">
      {thumbnails.map((thumbnail) => {
        const isSelected = selectedPages.has(thumbnail.pageNumber);
        return (
          <button
            key={thumbnail.pageNumber}
            type="button"
            className={`thumbnail-card ${isSelected ? 'thumbnail-card-selected' : ''}`.trim()}
            onClick={() => onTogglePage(thumbnail.pageNumber)}
            aria-label={`Select page ${thumbnail.pageNumber}`}
            aria-pressed={isSelected}
          >
            <img src={thumbnail.imageDataUrl} alt={`Page ${thumbnail.pageNumber} preview`} loading="lazy" />
            <span className="thumbnail-page-label">Page {thumbnail.pageNumber}</span>
          </button>
        );
      })}
    </div>
  );
}
