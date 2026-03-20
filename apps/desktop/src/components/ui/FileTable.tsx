import { ArrowBigDown, ArrowBigUp, FileText, Trash2 } from 'lucide-react';

type FileRow = {
  id: string;
  filename: string;
  sizeLabel: string;
  pagesLabel: string;
};

type FileTableProps = {
  rows: FileRow[];
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

export function FileTable({ rows, onRemove, onReorder }: FileTableProps) {
  if (rows.length === 0) {
    return (
      <div className="file-table-empty">
        <p>No files selected</p>
        <p>Drag &amp; drop PDFs or click to browse</p>
      </div>
    );
  }

  return (
    <div className="file-table-wrap">
      <div className="file-table-head">
        <span>File</span>
        <span className="align-right">Size</span>
        <span className="align-right">Pages</span>
        <span className="align-right">Actions</span>
      </div>
      <ul className="file-table-body">
        {rows.map((row, index) => (
          <li key={row.id} className="file-table-row">
            <div className="file-table-file">
              <span className="file-order-index">{index + 1}.</span>
              <span className="file-icon" aria-hidden="true">
                <FileText />
              </span>
              <p>{row.filename}</p>
            </div>
            <p className="align-right">{row.sizeLabel}</p>
            <p className="align-right">{row.pagesLabel}</p>
            <div className="align-right file-row-actions">
              {index > 0 ? (
                <button
                  type="button"
                  className="file-move-btn"
                  onClick={() => onReorder(index, index - 1)}
                  aria-label={`Move ${row.filename} up`}
                  title="Move up"
                >
                  <ArrowBigUp />
                </button>
              ) : null}
              {index < rows.length - 1 ? (
                <button
                  type="button"
                  className="file-move-btn"
                  onClick={() => onReorder(index, index + 1)}
                  aria-label={`Move ${row.filename} down`}
                  title="Move down"
                >
                  <ArrowBigDown />
                </button>
              ) : null}
              <button
                type="button"
                className="file-remove-btn"
                onClick={() => onRemove(row.id)}
                aria-label={`Remove ${row.filename}`}
              >
                <Trash2 />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
