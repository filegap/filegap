import { Lock } from 'lucide-react';

type TrustNoticeProps = {
  message?: string;
  className?: string;
  textClassName?: string;
};

export function TrustNotice({
  message = 'Local processing only — your files never leave your device',
  className = '',
  textClassName = '',
}: TrustNoticeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-brand-trust-border bg-brand-trust-soft px-3 py-2 ${className}`.trim()}
    >
      <span className='text-brand-trust' aria-hidden='true'>
        <Lock className='h-4 w-4' />
      </span>
      <p className={`text-xs font-medium text-brand-trust ${textClassName}`.trim()}>{message}</p>
    </div>
  );
}
