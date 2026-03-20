import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ToolCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  to?: string;
  disabled?: boolean;
};

function ToolCardInner({ title, description, icon, disabled = false }: Omit<ToolCardProps, 'to'>) {
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
      </div>
    </article>
  );
}

export function ToolCard({ title, description, icon, to, disabled = false }: ToolCardProps) {
  if (!to || disabled) {
    return <ToolCardInner title={title} description={description} icon={icon} disabled={disabled} />;
  }

  return (
    <Link to={to} className="tool-card-link" aria-label={title}>
      <ToolCardInner title={title} description={description} icon={icon} />
    </Link>
  );
}
