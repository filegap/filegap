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
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

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
      setOverIndex((current) => {
        if (current === nextOverIndex) {
          return current;
        }
        return nextOverIndex;
      });
    }

    function finishDrag() {
      const sourceIndex = draggedIndexRef.current;
      setOverIndex((currentOver) => {
        if (
          sourceIndex !== null &&
          currentOver !== null &&
          sourceIndex !== currentOver &&
          sourceIndex >= 0 &&
          currentOver >= 0
        ) {
          onReorder(sourceIndex, currentOver);
        }
        return null;
      });
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
            setOverIndex(index);
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
            setOverIndex(index);
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
