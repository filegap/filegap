import type { HTMLAttributes, PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div {...props} className={`card ${className ?? ''}`.trim()}>
      {children}
    </div>
  );
}
