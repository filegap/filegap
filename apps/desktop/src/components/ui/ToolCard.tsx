import type { MouseEventHandler, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ToolCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  icon: ReactNode;
  to?: string;
  disabled?: boolean;
};

type ToolCardInnerProps = Omit<ToolCardProps, 'to'> & {
  onActionClick?: MouseEventHandler<HTMLButtonElement>;
};

function ToolCardInner({ title, description, actionLabel, icon, disabled = false, onActionClick }: ToolCardInnerProps) {
  return (
    <article
      className={`tool-card ${disabled ? 'tool-card-disabled' : 'tool-card-enabled'}`.trim()}
      aria-disabled={disabled}
    >
      <span className="tool-card-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="tool-card-content">
        <h2>{title}</h2>
        <p>{description}</p>
        <button
          type="button"
          className="tool-card-cta-btn"
          onClick={onActionClick}
          disabled={disabled}
          aria-label={actionLabel}
        >
          {actionLabel}
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export function ToolCard({ title, description, actionLabel, icon, to, disabled = false }: ToolCardProps) {
  const navigate = useNavigate();

  function handleNavigate() {
    if (!to || disabled) {
      return;
    }
    navigate(to);
  }

  if (!to || disabled) {
    return <ToolCardInner title={title} description={description} actionLabel={actionLabel} icon={icon} disabled={disabled} />;
  }

  return (
    <div
      className="tool-card-link"
      role="link"
      tabIndex={0}
      aria-label={title}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        handleNavigate();
      }}
    >
      <ToolCardInner
        title={title}
        description={description}
        actionLabel={actionLabel}
        icon={icon}
        onActionClick={(event) => {
          event.stopPropagation();
          handleNavigate();
        }}
      />
    </div>
  );
}
