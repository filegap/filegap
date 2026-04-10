import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type CopyCodeBlockProps = {
  code: string;
};

export function CopyCodeBlock({ code }: CopyCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => void handleCopy()}
        aria-label={copied ? 'CLI command copied' : 'Copy CLI command'}
        title={copied ? 'Copied' : 'Copy command'}
        className='absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-ui-muted transition hover:bg-ui-bg hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-border/80 focus-visible:ring-offset-2'
      >
        {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
      </button>
      <pre className='overflow-x-auto rounded-lg border border-ui-border bg-ui-surface p-4 pr-16 text-xs text-ui-text'>
        <code>{code}</code>
      </pre>
    </div>
  );
}
