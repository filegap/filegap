const TOOL_NAV_LINKS = [
  { href: '/merge-pdf', label: 'Merge PDF' },
  { href: '/split-pdf', label: 'Split PDF' },
  { href: '/extract-pages', label: 'Extract Pages' },
  { href: '/reorder-pdf', label: 'Reorder PDF' },
];

export function AppHeader() {
  return (
    <header className='sticky top-0 z-40 border-b border-ui-border bg-ui-surface/95 backdrop-blur'>
      <div className='mx-auto flex h-14 w-[min(1080px,94vw)] items-center justify-between gap-4'>
        <a href='/merge-pdf' className='inline-flex flex-col leading-tight text-ui-text'>
          <span className='inline-flex items-center gap-2 font-heading text-base'>
            <span className='inline-block h-2.5 w-2.5 rounded-full bg-brand-primary' />
            PDFlo
          </span>
          <span className='text-[10px] font-medium uppercase tracking-wide text-ui-muted'>
            privacy-first PDF tools
          </span>
        </a>

        <nav aria-label='PDF tools navigation' className='flex items-center gap-1 overflow-x-auto'>
          {TOOL_NAV_LINKS.map((link) => {
            const isActive = window.location.pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-brand-primary text-white'
                    : 'text-ui-muted hover:bg-ui-bg hover:text-ui-text'
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
