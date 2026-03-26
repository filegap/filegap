import type { HTMLAttributes, PropsWithChildren } from 'react';

type CardVariant = 'default' | 'interactive' | 'interactive-subtle';

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

type CardStyleOptions = {
  variant?: CardVariant;
  className?: string;
};

const BASE_STYLES = 'rounded-2xl border bg-ui-surface';

const VARIANT_STYLES: Record<CardVariant, string> = {
  default: 'border-ui-border',
  interactive:
    'border-ui-border shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-[3px] hover:border-brand-primary/35 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]',
  'interactive-subtle':
    'border-ui-border shadow-[0_2px_8px_rgba(15,23,42,0.025)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-ui-text/10 hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)]',
};

export function cardStyles({ variant = 'default', className }: CardStyleOptions = {}) {
  return [BASE_STYLES, VARIANT_STYLES[variant], className].filter(Boolean).join(' ');
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cardStyles({ className: `p-6 md:p-8 ${className ?? ''}`.trim() })}
    >
      {children}
    </div>
  );
}
