import { ArrowRight } from 'lucide-react';

type SimpleProcessFlowProps = {
  title?: string;
  description?: string;
  steps: string[];
  activeStepIndex?: number;
  showTitle?: boolean;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionOnClick?: () => void;
  onSecondaryActionClick?: () => void;
};

export function SimpleProcessFlow({
  title = 'Processing steps',
  description,
  steps,
  activeStepIndex,
  showTitle = true,
  secondaryActionLabel,
  secondaryActionHref,
  secondaryActionOnClick,
  onSecondaryActionClick,
}: SimpleProcessFlowProps) {
  return (
    <section className='space-y-3 rounded-xl border border-ui-border bg-ui-bg/55 p-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0'>
          {showTitle ? <h2 className='font-heading text-lg font-semibold text-ui-text'>{title}</h2> : null}
          {description ? <p className='mt-1 text-sm text-ui-muted'>{description}</p> : null}
        </div>
        {secondaryActionLabel && (secondaryActionHref || secondaryActionOnClick) ? (
          secondaryActionHref ? (
            <a
              href={secondaryActionHref}
              onClick={onSecondaryActionClick}
              className='inline-flex items-center rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-border/80 focus-visible:ring-offset-2'
            >
              {secondaryActionLabel}
            </a>
          ) : (
            <button
              type='button'
              onClick={() => {
                onSecondaryActionClick?.();
                secondaryActionOnClick?.();
              }}
              className='inline-flex items-center rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm font-medium text-ui-muted transition hover:bg-ui-bg hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-border/80 focus-visible:ring-offset-2'
            >
              {secondaryActionLabel}
            </button>
          )
        ) : null}
      </div>

      <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center'>
        {steps.map((step, index) => (
          <div key={`${step}-${index}`} className='flex items-center gap-2'>
            <div
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeStepIndex === index
                  ? 'border border-brand-primary/35 bg-brand-primary/10 text-brand-primary shadow-[0_6px_18px_rgba(255,46,139,0.12)]'
                  : 'border border-ui-border bg-ui-surface text-ui-text'
              }`}
            >
              {step}
            </div>
            {index < steps.length - 1 ? (
              <span className='text-ui-muted' aria-hidden='true'>
                <ArrowRight className='h-4 w-4' />
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
