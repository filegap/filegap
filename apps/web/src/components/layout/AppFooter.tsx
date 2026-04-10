export function AppFooter() {
  return (
    <footer className='mt-10 border-t border-ui-border bg-ui-surface'>
      <div className='mx-auto w-[min(1080px,94vw)] py-6'>
        <div className='grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]'>
          <div className='space-y-2'>
            <p className='font-heading text-base text-ui-text'>Filegap</p>
            <p className='text-xs tracking-wide text-ui-muted'>Private PDF tools that run locally</p>
            <p className='max-w-md text-xs text-ui-muted'>
              Local processing only. Your files never leave your device.
            </p>
          </div>

          <div className='space-y-3'>
            <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>Filegap</p>
            <nav className='flex flex-col gap-2 text-sm text-ui-muted'>
              <a href='/' className='hover:text-ui-text'>
                Home
              </a>
              <a href='/workflow-builder' className='hover:text-ui-text'>
                Workflow Builder
              </a>
              <a href='/cli' className='hover:text-ui-text'>
                CLI
              </a>
              <a href='/download' className='hover:text-ui-text'>
                Download
              </a>
              <a href='/privacy' className='hover:text-ui-text'>
                Privacy
              </a>
              <a href='/terms' className='hover:text-ui-text'>
                Terms
              </a>
              <a
                href='https://github.com/filegap/filegap'
                target='_blank'
                rel='noreferrer'
                className='hover:text-ui-text'
              >
                GitHub
              </a>
            </nav>
          </div>

          <div className='space-y-3'>
            <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ui-muted'>PDF tools</p>
            <nav className='flex flex-col gap-2 text-sm text-ui-muted'>
              <a href='/merge-pdf' className='hover:text-ui-text'>
                Merge PDF
              </a>
              <a href='/split-pdf' className='hover:text-ui-text'>
                Split PDF
              </a>
              <a href='/extract-pages' className='hover:text-ui-text'>
                Extract Pages
              </a>
              <a href='/reorder-pdf' className='hover:text-ui-text'>
                Reorder PDF
              </a>
              <a href='/optimize-pdf' className='hover:text-ui-text'>
                Optimize PDF
              </a>
              <a href='/compress-pdf' className='hover:text-ui-text'>
                Compress PDF
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
