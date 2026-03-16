import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Button } from './Button';

type PreDownloadModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function PreDownloadModal({
  title,
  description,
  confirmLabel,
  open,
  onClose,
  onConfirm,
}: PreDownloadModalProps) {
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
      <div className='w-full max-w-md rounded-2xl border border-ui-border bg-ui-surface p-6 shadow-lg'>
        <p className='font-heading text-2xl font-semibold text-ui-text'>{title}</p>
        <p className='mt-2 text-sm leading-relaxed text-ui-muted'>{description}</p>
        <div className='mt-5 flex flex-wrap gap-3'>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
          <button
            type='button'
            onClick={onClose}
            className='rounded-xl border border-ui-border px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
