import { useState } from 'react';

export type ReorderThumbnailItem = {
  pageNumber: number;
  imageDataUrl: string;
};

type ReorderThumbnailGridProps = {
  items: ReorderThumbnailItem[];
  isLoading: boolean;
  loadingLabel?: string;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

export function ReorderThumbnailGrid({
  items,
  isLoading,
  loadingLabel = 'Rendering previews...',
  onReorder,
}: ReorderThumbnailGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (isLoading) {
    return <p className="file-loading-hint">{loadingLabel}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="file-table-empty">
        <p>No files selected</p>
        <p>Drag & drop PDFs or click to browse</p>
      </div>
    );
  }

  return (
    <div className="thumbnail-grid-wrap" aria-label="Reorder page previews">
      {items.map((item, index) => (
        <button
          key={`${item.pageNumber}-${index}`}
          type="button"
          draggable
          className={`thumbnail-card reorder-thumbnail-card ${overIndex === index ? 'reorder-thumbnail-card-over' : ''}`.trim()}
          onDragStart={(event) => {
            setDraggedIndex(index);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', String(index));
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setOverIndex(index);
          }}
          onDragLeave={() => {
            setOverIndex((current) => (current === index ? null : current));
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedIndex === null || draggedIndex === index) {
              setDraggedIndex(null);
              setOverIndex(null);
              return;
            }
            onReorder(draggedIndex, index);
            setDraggedIndex(null);
            setOverIndex(null);
          }}
          onDragEnd={() => {
            setDraggedIndex(null);
            setOverIndex(null);
          }}
          aria-label={`Move page ${item.pageNumber}`}
          title="Drag to reorder"
        >
          <span className="reorder-position-badge">#{index + 1}</span>
          <img src={item.imageDataUrl} alt={`Page ${item.pageNumber} preview`} loading="lazy" draggable={false} />
          <span className="thumbnail-page-label">Page {item.pageNumber}</span>
        </button>
      ))}
    </div>
  );
}
