import { Card } from '../../components/ui/Card';
import { ToolLayout } from '../../components/layout/ToolLayout';

export function DownloadPage() {
  return (
    <ToolLayout
      title='Download Filegap Desktop App'
      description='Install the Desktop community build via Homebrew. Local processing only, no uploads.'
      metaTitle='Download Filegap Desktop App | Private PDF tools'
      metaDescription='Install the Filegap Desktop community build with Homebrew. Private PDF tools with local processing only and no uploads.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-5 text-sm leading-relaxed text-ui-muted'>
          <p className='inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900'>
            Desktop community channel · Developer Preview
          </p>
          <p>
            You can install Filegap Desktop on macOS with Homebrew from the official tap.
            This is the community distribution channel.
          </p>

          <div className='space-y-2 rounded-xl border border-ui-border bg-ui-bg p-4'>
            <h2 className='font-heading text-base font-semibold text-ui-text'>
              Install with Homebrew
            </h2>
            <p className='text-xs'>Run these commands in your terminal:</p>
            <pre className='overflow-x-auto rounded-lg border border-ui-border bg-ui-bg-subtle p-3 text-xs text-ui-text'>
              <code>{`brew tap filegap/filegap\nbrew install --cask filegap-desktop`}</code>
            </pre>
            <p className='text-xs'>
              Already installed? Update with <code>brew upgrade --cask filegap-desktop</code>.
            </p>
          </div>

          <div className='space-y-2 rounded-xl border border-ui-border bg-ui-bg-subtle p-4'>
            <h2 className='font-heading text-base font-semibold text-ui-text'>
              Community channel notes
            </h2>
            <ul className='list-disc space-y-1 pl-5 text-xs'>
              <li>This build is currently distributed as a Developer Preview.</li>
              <li>macOS may show security prompts because signing/notarization is in progress.</li>
              <li>App updates may require network access, depending on distribution channel.</li>
            </ul>
          </div>

          <p>
            Privacy-first remains unchanged: PDF processing stays local on your device, with no
            upload and no server-side file handling.
          </p>
          <p className='text-xs'>
            For automation workflows, use the{' '}
            <a href='/cli' className='underline hover:text-ui-text'>
              CLI version
            </a>
            . For release notes and desktop assets, see{' '}
            <a
              href='https://github.com/filegap/filegap/releases'
              target='_blank'
              rel='noreferrer'
              className='underline hover:text-ui-text'
            >
              GitHub Releases
            </a>
            .
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
