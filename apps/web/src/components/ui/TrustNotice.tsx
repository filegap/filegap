export function TrustNotice() {
  return (
    <div className='inline-flex items-center gap-2 rounded-lg border border-brand-trust-border bg-brand-trust-soft px-3 py-2'>
      <span className='text-brand-trust' aria-hidden='true'>
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-4 w-4'>
          <path d='M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Z' />
        </svg>
      </span>
      <p className='text-xs font-medium text-brand-trust'>
        Local processing only. Your PDF files never leave your device.
      </p>
    </div>
  );
}
