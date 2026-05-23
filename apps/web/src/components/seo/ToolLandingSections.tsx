import { useMemo, type ReactNode } from 'react';

import { SectionBlock } from '../layout/SectionBlock';
import { buttonStyles } from '../ui/Button';

export type WhyItem = {
  title: string;
  text: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type RelatedTool = {
  href: string;
  label: string;
  description: string;
};

export type ToolLandingSectionsProps = {
  howItWorksTitle: string;
  howItWorksSteps: string[];
  whyTitle: string;
  whyItems: WhyItem[];
  faqTitle: string;
  faqItems: FaqItem[];
  seoTitle: string;
  seoParagraphs: string[];
  seoSupplement?: ReactNode;
  finalCtaTitle: string;
  finalCtaText: string;
  finalCtaLabel: string;
  finalCtaHref: string;
  relatedTools?: RelatedTool[];
};

type StructuredDataProps = {
  pageTitle: string;
  pageDescription: string;
  pageUrl: string;
  breadcrumbLabel?: string;
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
  seoSupplement,
  finalCtaTitle,
  finalCtaText,
  finalCtaLabel,
  finalCtaHref,
  relatedTools = [],
  structuredData,
}: ToolLandingSectionsProps & { structuredData?: StructuredDataProps }) {
  const structuredDataGraph = useMemo(
    () => {
      const graph: Array<Record<string, unknown>> = [
        {
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ];

      if (structuredData) {
        graph.unshift(
          {
            '@type': 'SoftwareApplication',
            name: structuredData.pageTitle,
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Web browser',
            url: structuredData.pageUrl,
            description: structuredData.pageDescription,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            featureList: [
              'Local PDF processing',
              'No server-side PDF upload',
              'Browser-based PDF tools',
            ],
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Filegap',
                item: 'https://www.filegap.app/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: structuredData.breadcrumbLabel ?? structuredData.pageTitle,
                item: structuredData.pageUrl,
              },
            ],
          }
        );
      }

      return {
      '@context': 'https://schema.org',
      '@graph': graph,
      };
    },
    [faqItems, structuredData]
  );

  return (
    <>
      <script type='application/ld+json'>
        {JSON.stringify(structuredDataGraph)}
      </script>

      <section className='mt-10 grid gap-6 md:grid-cols-2'>
        <SectionBlock title={howItWorksTitle} className='md:flex md:h-full md:flex-col' contentClassName='md:flex-1'>
          <ol className='list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-ui-muted'>
            {howItWorksSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </SectionBlock>

        <SectionBlock title={whyTitle} className='md:flex md:h-full md:flex-col' contentClassName='md:flex-1'>
          <ul className='space-y-5'>
            {whyItems.map((item) => (
              <li key={item.title}>
                <h3 className='text-base font-semibold text-ui-text'>{item.title}</h3>
                <p className='mt-1.5 text-sm leading-relaxed text-ui-muted'>{item.text}</p>
              </li>
            ))}
          </ul>
        </SectionBlock>
      </section>

      <SectionBlock title={faqTitle} className='mt-10'>
        <ul className='space-y-6'>
          {faqItems.map((item) => (
            <li key={item.question}>
              <h3 className='text-base font-semibold text-ui-text'>{item.question}</h3>
              <p className='mt-2 text-sm leading-relaxed text-ui-muted'>{item.answer}</p>
            </li>
          ))}
        </ul>
      </SectionBlock>

      <SectionBlock title={seoTitle} className='mt-10'>
        <div className='max-w-3xl space-y-4 text-sm leading-relaxed text-ui-muted'>
          {seoParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {seoSupplement}
        </div>
      </SectionBlock>

      {relatedTools.length > 0 ? (
        <SectionBlock title='Related PDF tools' className='mt-10'>
          <div className='grid gap-3 md:grid-cols-3'>
            {relatedTools.map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                className='block rounded-lg border border-ui-border bg-ui-surface p-4 transition hover:border-ui-text/20 hover:bg-ui-bg'
              >
                <h3 className='text-base font-semibold text-ui-text'>{tool.label}</h3>
                <p className='mt-1.5 text-sm leading-relaxed text-ui-muted'>{tool.description}</p>
              </a>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      <section className='mt-12 space-y-4 pb-2 text-center md:space-y-5'>
        <h2 className='font-heading text-3xl font-semibold leading-tight text-ui-text md:text-4xl'>
          {finalCtaTitle}
        </h2>
        <p className='mx-auto max-w-2xl text-base leading-relaxed text-ui-muted'>{finalCtaText}</p>
        <a
          href={finalCtaHref}
          className={buttonStyles({ variant: 'primary', size: 'lg' })}
        >
          {finalCtaLabel}
        </a>
      </section>
    </>
  );
}
