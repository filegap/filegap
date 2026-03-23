export function AppFooter() {
  return (
    <footer className='mt-10 border-t border-ui-border bg-ui-surface'>
      <div className='mx-auto w-[min(1080px,94vw)] py-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div className='space-y-1'>
            <p className='font-heading text-base text-ui-text'>Filegap</p>
            <p className='text-xs tracking-wide text-ui-muted'>Private PDF tools that run locally</p>
            <p className='text-xs text-ui-muted'>Local processing only. Your files never leave your device.</p>
          </div>

          <nav className='flex flex-wrap items-center gap-4 text-xs font-medium text-ui-muted'>
            <a href='/cli' className='hover:text-ui-text'>
              CLI
            </a>
            <a href='/download' className='hover:text-ui-text'>
              App Download
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
      </div>
    </footer>
  );
}
