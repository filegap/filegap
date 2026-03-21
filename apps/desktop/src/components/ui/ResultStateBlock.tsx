import { BadgeCheck, File, Folder } from 'lucide-react';

type ResultStateBlockProps = {
  title: string;
  details: string;
  onOpen: () => void;
  onReveal: () => void;
};

export function ResultStateBlock({ title, details, onOpen, onReveal }: ResultStateBlockProps) {
  return (
    <div className="output-result-block">
      <div className="output-complete-state">
        <p className="output-complete-title">
          <span className="output-success-icon" aria-hidden="true">
            <BadgeCheck strokeWidth={2.25} />
          </span>
          <span>{title}</span>
        </p>
        <p className="output-complete-details">{details}</p>

        <div className="output-result-inline-actions">
          <button type="button" className="output-inline-action" onClick={onOpen} title="Open file" aria-label="Open file">
            <File aria-hidden="true" />
            <span>Open</span>
          </button>
          <button
            type="button"
            className="output-inline-action"
            onClick={onReveal}
            title="Reveal in folder"
            aria-label="Reveal in folder"
          >
            <Folder aria-hidden="true" />
            <span>Reveal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
