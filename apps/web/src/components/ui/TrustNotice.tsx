import { ShieldCheck } from 'lucide-react';

type TrustNoticeProps = {
  message?: string;
  className?: string;
  textClassName?: string;
};

export function TrustNotice({
  message = 'Processed locally on your device — no uploads',
  className = '',
  textClassName = '',
}: TrustNoticeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-brand-trust-border bg-brand-trust-soft px-3 py-2 ${className}`.trim()}
    >
      <span className='text-brand-trust' aria-hidden='true'>
        <ShieldCheck className='h-4 w-4' />
      </span>
      <p className={`text-xs font-medium text-brand-trust ${textClassName}`.trim()}>{message}</p>
    </div>
  );
}
