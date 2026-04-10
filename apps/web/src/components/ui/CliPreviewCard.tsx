import { CopyCodeBlock } from './CopyCodeBlock';

type CliPreviewCardProps = {
  title?: string;
  command: string;
  helperText: string;
  learnHref: string;
  learnLabel: string;
  showTitle?: boolean;
};

export function CliPreviewCard({
  title = 'CLI preview',
  command,
  helperText,
  learnHref,
  learnLabel,
  showTitle = true,
}: CliPreviewCardProps) {
  return (
    <section className='space-y-3 rounded-xl border border-ui-border bg-ui-bg/55 p-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          {showTitle ? <h2 className='font-heading text-lg font-semibold text-ui-text'>{title}</h2> : null}
          <p className='text-sm text-ui-muted'>{helperText}</p>
        </div>
        <a
          href={learnHref}
          className='inline-flex items-center rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-border/80 focus-visible:ring-offset-2'
        >
          {learnLabel}
        </a>
      </div>
      <CopyCodeBlock code={command} />
    </section>
  );
}
