import type { PropsWithChildren } from 'react';

import { Card } from '../ui/Card';

type ToolActionCardProps = PropsWithChildren<{
  id?: string;
  className?: string;
}>;

export function ToolActionCard({ id, className, children }: ToolActionCardProps) {
  return (
    <Card id={id}>
      <div className={['space-y-7', className].filter(Boolean).join(' ')}>{children}</div>
    </Card>
  );
}
