import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X } from 'lucide-react';
import { trackEvent } from '../../lib/analytics/trackEvent';

type PreDownloadModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function PreDownloadModal({ open, onClose, onConfirm }: PreDownloadModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className='fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-black/45 p-4'>
      <div className='relative w-full max-w-md rounded-2xl border border-ui-border bg-ui-surface p-6 shadow-lg'>
        <button
          type='button'
          onClick={onClose}
          aria-label='Close'
          className='absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-ui-muted transition hover:bg-ui-bg hover:text-ui-text'
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </button>

        <div className='pr-10'>
          <p className='inline-flex items-center gap-2 font-heading text-2xl font-semibold text-ui-text'>
            <CheckCircle2 className='h-5 w-5 text-brand-primary' aria-hidden='true' />
            <span>Your PDF is ready</span>
          </p>
        </div>

        <button
          type='button'
          onClick={onConfirm}
          className='mt-7 inline-flex w-full items-center justify-center rounded-xl bg-brand-primary px-5 py-3.5 text-base font-semibold text-white transition hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2'
        >
          Download PDF
        </button>

        <div className='mt-7'>
          <div className='rounded-lg border border-ui-border/45 bg-ui-bg/45 p-3.5'>
            <p className='text-sm font-semibold text-ui-text'>Share this file privately</p>
            <p className='mt-1 text-sm text-ui-muted'>
              Create a privacy-first short link with Lynko
            </p>
            <a
              href='https://lynko.it'
              target='_blank'
              rel='noreferrer'
              onClick={() => trackEvent('support_lynko_click')}
              className='mt-2.5 inline-flex rounded-md border border-ui-border bg-ui-surface px-2.5 py-1.5 text-sm font-medium text-ui-text transition hover:bg-ui-bg'
            >
              Create link
            </a>
          </div>
        </div>

        <p className='mt-5 text-xs text-ui-muted'>
          If this saved you time, consider{' '}
          <a
            href='https://buymeacoffee.com/filegap'
            target='_blank'
            rel='noreferrer'
            onClick={() => trackEvent('support_click')}
            className='underline decoration-ui-border underline-offset-4 transition hover:text-brand-primary-dark'
          >
            supporting the project
          </a>{' '}
          ☕
        </p>
      </div>
    </div>,
    document.body
  );
}
