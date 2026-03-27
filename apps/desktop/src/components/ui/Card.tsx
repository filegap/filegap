import type { HTMLAttributes, PropsWithChildren } from 'react';

type CardVariant = 'default' | 'subtle' | 'result';

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

type CardClassOptions = {
  variant?: CardVariant;
  className?: string;
};

export function cardClassName({ variant = 'default', className }: CardClassOptions = {}) {
  return ['card', `card-${variant}`, className ?? ''].filter(Boolean).join(' ');
}

export function Card({
  children,
  className,
  variant = 'default',
  ...props
}: CardProps & { variant?: CardVariant }) {
  return (
    <div {...props} className={cardClassName({ variant, className })}>
      {children}
    </div>
  );
}
