import { forwardRef, type PropsWithChildren } from 'react';

type PageContainerProps = PropsWithChildren<{
  className?: string;
}>;

export const PageContainer = forwardRef<HTMLElement, PageContainerProps>(function PageContainer(
  { children, className },
  ref,
) {
  const classes = ['page-container', className].filter(Boolean).join(' ');
  return (
    <main ref={ref} className={classes}>
      {children}
    </main>
  );
});
