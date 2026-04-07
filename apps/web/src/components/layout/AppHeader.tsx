import { useState } from 'react';

type ToolIcon = 'merge' | 'split' | 'extract' | 'reorder' | 'optimize' | 'compress';

const TOOL_NAV_LINKS: Array<{ href: string; label: string; icon: ToolIcon }> = [
  { href: '/merge-pdf', label: 'Merge PDF', icon: 'merge' },
  { href: '/split-pdf', label: 'Split PDF', icon: 'split' },
  { href: '/extract-pages', label: 'Extract Pages', icon: 'extract' },
  { href: '/reorder-pdf', label: 'Reorder PDF', icon: 'reorder' },
  { href: '/optimize-pdf', label: 'Optimize PDF', icon: 'optimize' },
  { href: '/compress-pdf', label: 'Compress PDF', icon: 'compress' },
];

function ToolMenuIcon({ icon }: { icon: ToolIcon }) {
  if (icon === 'merge') {
    return (
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' aria-hidden='true' className='h-4 w-4'>
        <path d='M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    );
  }

  if (icon === 'split') {
    return (
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' aria-hidden='true' className='h-4 w-4'>
        <path d='M16 3h5v5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M8 3H3v5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='m15 9 6-6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    );
  }

  if (icon === 'extract') {
    return (
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' aria-hidden='true' className='h-4 w-4'>
        <circle cx='6' cy='6' r='3' stroke='currentColor' strokeWidth='2' />
        <path d='M8.12 8.12 12 12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M20 4 8.12 15.88' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <circle cx='6' cy='18' r='3' stroke='currentColor' strokeWidth='2' />
        <path d='M14.8 14.8 20 20' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    );
  }

  if (icon === 'optimize') {
    return (
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' aria-hidden='true' className='h-4 w-4'>
        <path d='m15 3 6 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='m9 21-6-6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M21 3h-6v6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M3 21h6v-6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    );
  }

  if (icon === 'compress') {
    return (
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' aria-hidden='true' className='h-4 w-4'>
        <path d='M4 8h16' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M7 12h10' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M10 16h4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    );
  }

  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' aria-hidden='true' className='h-4 w-4'>
      <path d='m21 16-4 4-4-4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      <path d='M17 20V4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      <path d='m3 8 4-4 4 4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      <path d='M7 4v16' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

export function AppHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activePath = window.location.pathname;

  function closeMobileMenu(): void {
    setIsMobileMenuOpen(false);
  }

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

        <nav aria-label='PDF tools navigation' className='hidden items-center gap-3 overflow-x-auto py-1 md:flex'>
          {TOOL_NAV_LINKS.map((link) => {
            const isActive = activePath === link.href;
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

        <div className='relative md:hidden'>
          <button
            type='button'
            aria-label='Open tools menu'
            aria-controls='mobile-tools-menu'
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ui-border bg-ui-surface text-ui-text transition hover:bg-ui-bg ${
              isMobileMenuOpen ? 'bg-ui-bg' : ''
            }`}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden='true'
              className='h-5 w-5'
            >
              <path
                d='M4 7h16'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M4 12h16'
                stroke='#ff2e8b'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M4 17h16'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>

          {isMobileMenuOpen ? (
            <nav
              id='mobile-tools-menu'
              aria-label='Mobile PDF tools navigation'
              className='absolute right-0 top-[calc(100%+10px)] z-50 w-[220px] rounded-xl border border-ui-border bg-ui-surface p-2 shadow-lg'
            >
              {TOOL_NAV_LINKS.map((link) => {
                const isActive = activePath === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-ui-muted hover:bg-ui-bg hover:text-ui-text'
                    }`}
                  >
                    <ToolMenuIcon icon={link.icon} />
                    {link.label}
                  </a>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
