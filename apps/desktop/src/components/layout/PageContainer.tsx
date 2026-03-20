import type { PropsWithChildren } from 'react';

type PageContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function PageContainer({ children, className }: PageContainerProps) {
  const classes = ['page-container', className].filter(Boolean).join(' ');
  return <main className={classes}>{children}</main>;
}
