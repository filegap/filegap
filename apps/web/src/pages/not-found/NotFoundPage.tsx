import { AppFooter } from '../../components/layout/AppFooter';
import { AppHeader } from '../../components/layout/AppHeader';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/ui/Card';
import { usePageMetadata } from '../../lib/seo/usePageMetadata';

export function NotFoundPage() {
  usePageMetadata({
    title: 'Page not found | Filegap',
    description: 'This page does not exist. Use Filegap private PDF tools that run locally.',
  });

  return (
    <>
      <AppHeader />
      <PageContainer>
        <Card>
          <div className='space-y-4 text-center'>
            <p className='text-xs font-semibold uppercase tracking-[0.12em] text-ui-muted'>Error 404</p>
            <h1 className='font-heading text-3xl font-bold text-ui-text md:text-4xl'>Page not found</h1>
            <p className='mx-auto max-w-2xl text-sm leading-relaxed text-ui-muted md:text-base'>
              The page you are looking for does not exist or has been moved. You can continue with
              one of the core PDF tools.
            </p>
            <div className='pt-2'>
              <a
                href='/merge-pdf'
                className='inline-flex items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark'
              >
                Go to Merge PDF
              </a>
            </div>
          </div>
        </Card>
      </PageContainer>
      <AppFooter />
    </>
  );
}
