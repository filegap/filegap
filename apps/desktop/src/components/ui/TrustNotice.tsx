import { ShieldCheck } from 'lucide-react';

type TrustNoticeProps = {
  className?: string;
  text?: string;
  variant?: 'default' | 'badge';
};

export function TrustNotice({
  className,
  text = 'Processed locally on your device — no uploads',
  variant = 'default',
}: TrustNoticeProps) {
  const classes = ['trust-notice', variant === 'badge' ? 'trust-notice-badge' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="note" aria-label="Privacy trust statement">
      <ShieldCheck aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}
