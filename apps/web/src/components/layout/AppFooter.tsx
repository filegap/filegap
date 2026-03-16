export function AppFooter() {
  return (
    <footer className='mt-10 border-t border-ui-border bg-ui-surface'>
      <div className='mx-auto w-[min(1080px,94vw)] py-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div className='space-y-1'>
            <p className='font-heading text-base text-ui-text'>PDFlo</p>
            <p className='text-xs uppercase tracking-wide text-ui-muted'>Privacy-first PDF tools</p>
            <p className='text-xs text-ui-muted'>Local processing. No file uploads.</p>
          </div>

          <nav className='flex items-center gap-4 text-xs font-medium text-ui-muted'>
            <a href='#' className='hover:text-ui-text'>
              Privacy
            </a>
            <a href='#' className='hover:text-ui-text'>
              Terms
            </a>
            <a href='https://github.com/' target='_blank' rel='noreferrer' className='hover:text-ui-text'>
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
