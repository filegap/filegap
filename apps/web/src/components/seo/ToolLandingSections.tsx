type WhyItem = {
  title: string;
  text: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type ToolLandingSectionsProps = {
  howItWorksTitle: string;
  howItWorksSteps: string[];
  whyTitle: string;
  whyItems: WhyItem[];
  faqTitle: string;
  faqItems: FaqItem[];
  seoTitle: string;
  seoParagraphs: string[];
  finalCtaTitle: string;
  finalCtaText: string;
  finalCtaLabel: string;
  finalCtaHref: string;
};

export function ToolLandingSections({
  howItWorksTitle,
  howItWorksSteps,
  whyTitle,
  whyItems,
  faqTitle,
  faqItems,
  seoTitle,
  seoParagraphs,
  finalCtaTitle,
  finalCtaText,
  finalCtaLabel,
  finalCtaHref,
}: ToolLandingSectionsProps) {
  return (
    <>
      <section className='mt-10 grid gap-6 md:grid-cols-2'>
        <div className='rounded-xl border border-ui-border bg-ui-surface p-6'>
          <h2 className='font-heading text-2xl font-semibold text-ui-text'>{howItWorksTitle}</h2>
          <ol className='mt-5 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-ui-muted'>
            {howItWorksSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className='rounded-xl border border-ui-border bg-ui-surface p-6'>
          <h2 className='font-heading text-2xl font-semibold text-ui-text'>{whyTitle}</h2>
          <ul className='mt-5 space-y-5'>
            {whyItems.map((item) => (
              <li key={item.title}>
                <h3 className='text-base font-semibold text-ui-text'>{item.title}</h3>
                <p className='mt-1.5 text-sm leading-relaxed text-ui-muted'>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className='mt-10 rounded-xl border border-ui-border bg-ui-surface p-6'>
        <h2 className='font-heading text-2xl font-semibold text-ui-text'>{faqTitle}</h2>
        <ul className='mt-5 space-y-6'>
          {faqItems.map((item) => (
            <li key={item.question}>
              <h3 className='text-base font-semibold text-ui-text'>{item.question}</h3>
              <p className='mt-2 text-sm leading-relaxed text-ui-muted'>{item.answer}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className='mt-10 rounded-xl border border-ui-border bg-ui-surface p-6'>
        <h2 className='font-heading text-2xl font-semibold text-ui-text'>{seoTitle}</h2>
        <div className='mt-5 max-w-3xl space-y-4 text-sm leading-relaxed text-ui-muted'>
          {seoParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className='mt-12 space-y-4 pb-2 text-center md:space-y-5'>
        <h2 className='font-heading text-3xl font-semibold leading-tight text-ui-text md:text-4xl'>
          {finalCtaTitle}
        </h2>
        <p className='mx-auto max-w-2xl text-base leading-relaxed text-ui-muted'>{finalCtaText}</p>
        <a
          href={finalCtaHref}
          className='inline-flex items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2'
        >
          {finalCtaLabel}
        </a>
      </section>
    </>
  );
}
