import { Card } from '../../components/ui/Card';
import { ToolLayout } from '../../components/layout/ToolLayout';

export function DownloadPage() {
  return (
    <ToolLayout
      title='Download Filegap Desktop App'
      description='Desktop app coming soon.'
      metaTitle='Download Filegap Desktop App | Private PDF tools'
      metaDescription='Filegap desktop app is coming soon. Keep your workflow local with no uploads and no server processing.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-5 text-sm leading-relaxed text-ui-muted'>
          <p className='inline-flex items-center rounded-full border border-ui-border bg-ui-bg px-3 py-1 text-xs font-medium text-ui-text'>
            Desktop download available soon
          </p>
          <p>
            We are finalizing packaging and distribution for the desktop app. Download links will
            be available shortly.
          </p>
          <p>
            Privacy-first stays the same: local processing only, no uploads, no server-side file
            handling.
          </p>
          <p>
            Need it now? Use the{' '}
            <a href='/cli' className='underline hover:text-ui-text'>
              CLI version
            </a>{' '}
            for the same local workflow.
          </p>

          <div className='space-y-2'>
            <h2 className='font-heading text-base font-semibold text-ui-text'>App preview</h2>
            <p className='text-xs'>
              Early UI previews while desktop distribution is being prepared.
            </p>
            <div className='grid gap-3 md:grid-cols-2'>
              <img
                src='/images/desktop-merge.png'
                alt='Filegap desktop preview showing the merge tool layout'
                className='h-auto w-full rounded-lg border border-ui-border bg-ui-bg'
                loading='lazy'
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/images/desktop-preview-merge.svg';
                }}
              />
              <img
                src='/images/desktop-extract.png'
                alt='Filegap desktop preview showing the extract pages tool layout'
                className='h-auto w-full rounded-lg border border-ui-border bg-ui-bg'
                loading='lazy'
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/images/desktop-preview-split.svg';
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </ToolLayout>
  );
}
