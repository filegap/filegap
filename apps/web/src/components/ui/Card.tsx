import type { HTMLAttributes, PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-2xl border border-ui-border bg-ui-surface p-6 md:p-8 ${className ?? ''}`.trim()}
    >
      {children}
    </div>
  );
}
