const TOOL_NAV_LINKS = [
  { href: '/merge-pdf', label: 'Merge PDF' },
  { href: '/split-pdf', label: 'Split PDF' },
  { href: '/extract-pages', label: 'Extract Pages' },
  { href: '/reorder-pdf', label: 'Reorder PDF' },
];

export function AppHeader() {
  return (
    <header className='sticky top-0 z-40 border-b border-ui-border bg-ui-surface/95 backdrop-blur'>
      <div className='mx-auto flex h-[72px] w-[min(1080px,94vw)] items-center justify-between gap-8'>
        <a href='/' className='inline-flex min-w-[190px] flex-col justify-center leading-tight text-ui-text'>
          <span className='inline-flex items-center gap-2 font-heading text-2xl tracking-tight'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden='true'
              className='h-5 w-5 shrink-0'
            >
              <path
                d='M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M14 2v5a1 1 0 0 0 1 1h5'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='m9 15 2 2 4-4'
                stroke='#ff2e8b'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            Filegap
          </span>
          <span className='pl-6 text-[10px] font-medium tracking-wide text-ui-muted'>
            Private PDF tools that run locally
          </span>
        </a>

        <nav aria-label='PDF tools navigation' className='flex items-center gap-3 overflow-x-auto py-1'>
          {TOOL_NAV_LINKS.map((link) => {
            const isActive = window.location.pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-brand-primary/25 bg-brand-primary/10 text-brand-primary'
                    : 'border-transparent text-ui-muted hover:border-ui-border hover:bg-ui-bg hover:text-ui-text'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
