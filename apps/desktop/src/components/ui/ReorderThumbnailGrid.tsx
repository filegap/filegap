import { useEffect, useRef, useState } from 'react';

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
  const draggedIndexRef = useRef<number | null>(null);
  const dragActiveRef = useRef(false);
  const overIndexRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  function updateOverIndex(next: number | null) {
    if (overIndexRef.current === next) {
      return;
    }
    overIndexRef.current = next;
    setOverIndex(next);
  }

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    function handleMouseMove(event: MouseEvent) {
      setDragPointer({ x: event.clientX, y: event.clientY });
      const hovered = document.elementFromPoint(event.clientX, event.clientY);
      const card = hovered?.closest<HTMLElement>('[data-reorder-index]');
      if (!card) {
        return;
      }
      const nextOverIndex = Number.parseInt(card.dataset.reorderIndex ?? '', 10);
      if (!Number.isInteger(nextOverIndex)) {
        return;
      }
      updateOverIndex(nextOverIndex);
    }

    function finishDrag() {
      const sourceIndex = draggedIndexRef.current;
      const targetIndex = overIndexRef.current;
      if (
        sourceIndex !== null &&
        targetIndex !== null &&
        sourceIndex !== targetIndex &&
        sourceIndex >= 0 &&
        targetIndex >= 0
      ) {
        onReorder(sourceIndex, targetIndex);
      }
      updateOverIndex(null);
      dragActiveRef.current = false;
      setIsDragging(false);
      draggedIndexRef.current = null;
      setDraggedIndex(null);
      setDragPointer(null);
      setDragOffset(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', finishDrag);
      window.removeEventListener('mouseleave', finishDrag);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', finishDrag);
    window.addEventListener('mouseleave', finishDrag);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', finishDrag);
      window.removeEventListener('mouseleave', finishDrag);
    };
  }, [isDragging, onReorder]);

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
        <div
          key={`${item.pageNumber}-${index}`}
          role="button"
          tabIndex={0}
          data-reorder-index={index}
          className={`thumbnail-card reorder-thumbnail-card ${overIndex === index ? 'reorder-thumbnail-card-over' : ''} ${
            draggedIndex === index ? 'reorder-thumbnail-card-dragging' : ''
          }`.trim()}
          onMouseDown={(event) => {
            if (event.button !== 0) {
              return;
            }
            event.preventDefault();
            const cardRect = event.currentTarget.getBoundingClientRect();
            draggedIndexRef.current = index;
            setDraggedIndex(index);
            updateOverIndex(index);
            setDragPointer({ x: event.clientX, y: event.clientY });
            setDragOffset({
              x: event.clientX - cardRect.left,
              y: event.clientY - cardRect.top,
            });
            dragActiveRef.current = true;
            setIsDragging(true);
          }}
          onMouseEnter={() => {
            if (!dragActiveRef.current) {
              return;
            }
            updateOverIndex(index);
          }}
          aria-label={`Move page ${item.pageNumber}`}
          title="Drag to reorder"
        >
          <span className="reorder-position-badge">#{index + 1}</span>
          <img src={item.imageDataUrl} alt={`Page ${item.pageNumber} preview`} loading="lazy" draggable={false} />
          <span className="thumbnail-page-label">Page {item.pageNumber}</span>
        </div>
      ))}
      {isDragging && draggedIndex !== null && dragPointer ? (
        <div
          className="reorder-drag-preview"
          style={{
            left: dragPointer.x - (dragOffset?.x ?? 0),
            top: dragPointer.y - (dragOffset?.y ?? 0),
          }}
          aria-hidden="true"
        >
          <img src={items[draggedIndex]?.imageDataUrl ?? ''} alt="" draggable={false} />
          <span>Page {items[draggedIndex]?.pageNumber ?? '-'}</span>
        </div>
      ) : null}
    </div>
  );
}
