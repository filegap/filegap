import { AppFooter } from '../../components/layout/AppFooter';
import { AppHeader } from '../../components/layout/AppHeader';
import { PageContainer } from '../../components/layout/PageContainer';
import { SectionBlock } from '../../components/layout/SectionBlock';
import { buttonStyles } from '../../components/ui/Button';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { canonicalUrl } from '../../lib/seo/seoLandingPages';
import { usePageMetadata } from '../../lib/seo/usePageMetadata';

const TOOL_LINKS = [
  {
    href: '/merge-pdf',
    label: 'Merge PDF',
    description: 'Combine PDFs locally in your browser.',
  },
  {
    href: '/split-pdf',
    label: 'Split PDF',
    description: 'Create smaller PDF files from page ranges.',
  },
  {
    href: '/extract-specific-pages-from-pdf',
    label: 'Extract PDF Pages',
    description: 'Keep selected pages in a new PDF.',
  },
  {
    href: '/reorder-pdf-pages',
    label: 'Reorder PDF Pages',
    description: 'Put pages in the order you need.',
  },
  {
    href: '/compress-pdf',
    label: 'Compress PDF',
    description: 'Use local compression presets.',
  },
  {
    href: '/pdf-to-images',
    label: 'PDF to Images',
    description: 'Render each page as JPEG or PNG locally.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Can Filegap process PDFs offline?',
    answer:
      'PDF processing runs locally in the browser, desktop app, or CLI. The web app must be loaded first, but the tools do not upload PDFs for processing.',
  },
  {
    question: 'How does local PDF processing help with privacy?',
    answer: 'Your PDF bytes remain on your device during tool operations, which avoids sending document content to a third-party PDF backend.',
  },
  {
    question: 'Which option is best for heavier files?',
    answer: 'Use Filegap Desktop or CLI for larger files, batch work, or offline-first workflows.',
  },
  {
    question: 'Can local-first tools help with GDPR-sensitive documents?',
    answer:
      'They can reduce exposure by avoiding server-side PDF handling, but your organization still needs to assess its own GDPR and data governance requirements.',
  },
  {
    question: 'Does Filegap track file names or document metadata?',
    answer: 'No. Filegap avoids analytics and logging payloads tied to file operations, filenames, page counts, ranges, or content.',
  },
];

export function OfflinePdfToolsPage() {
  usePageMetadata({
    title: 'Offline PDF Tools - Private Local PDF Processing | Filegap',
    description:
      'Use Filegap for private local PDF tools. Merge, split, extract, reorder, compress, and convert PDFs without uploading files for processing.',
    canonicalPath: canonicalUrl('/offline-pdf-tools'),
  });

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Offline PDF Tools - Filegap',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web browser, macOS, Windows, Linux',
        url: canonicalUrl('/offline-pdf-tools'),
        description:
          'Privacy-first PDF tools for browser, desktop, and CLI workflows without server-side PDF processing.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Filegap',
            item: canonicalUrl('/'),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Offline PDF tools',
            item: canonicalUrl('/offline-pdf-tools'),
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script type='application/ld+json'>{JSON.stringify(faqStructuredData)}</script>
      <AppHeader />
      <PageContainer>
        <header className='mb-8 space-y-4 md:mb-10'>
          <h1 className='font-heading text-3xl font-bold leading-tight text-ui-text md:text-4xl'>
            Offline PDF tools for private local processing
          </h1>
          <p className='max-w-4xl text-sm leading-relaxed text-ui-muted md:text-base'>
            Use Filegap to work with PDFs on your own device. Web tools process files in the browser,
            while the desktop app and CLI support offline-friendly workflows for heavier tasks.
          </p>
          <TrustNotice />
          <div className='flex flex-col gap-3 pt-2 sm:flex-row'>
            <a href='#offline-tool-grid' className={buttonStyles({ variant: 'primary', size: 'lg' })}>
              Browse PDF tools
            </a>
            <a href='/download' className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
              Download desktop app
            </a>
          </div>
        </header>

        <section id='offline-tool-grid' className='grid scroll-mt-28 gap-3 md:grid-cols-3'>
          {TOOL_LINKS.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              className='block rounded-lg border border-ui-border bg-ui-surface p-4 transition hover:border-ui-text/20 hover:bg-ui-bg'
            >
              <h2 className='text-base font-semibold text-ui-text'>{tool.label}</h2>
              <p className='mt-1.5 text-sm leading-relaxed text-ui-muted'>{tool.description}</p>
            </a>
          ))}
        </section>

        <section className='mt-10 grid gap-6 md:grid-cols-2'>
          <SectionBlock title='Local by design' className='md:flex md:h-full md:flex-col' contentClassName='md:flex-1'>
            <p className='text-sm leading-relaxed text-ui-muted'>
              Filegap is built around a no-upload PDF workflow. Browser tools use local files,
              ArrayBuffers, workers, and Blob downloads instead of remote PDF processing.
            </p>
          </SectionBlock>
          <SectionBlock title='Use the right channel' className='md:flex md:h-full md:flex-col' contentClassName='md:flex-1'>
            <p className='text-sm leading-relaxed text-ui-muted'>
              Use the web app for quick browser tasks, desktop for offline-friendly larger files,
              and CLI for repeatable automation in local scripts.
            </p>
          </SectionBlock>
        </section>

        <SectionBlock title='Frequently asked questions' className='mt-10'>
          <ul className='space-y-6'>
            {FAQ_ITEMS.map((item) => (
              <li key={item.question}>
                <h2 className='text-base font-semibold text-ui-text'>{item.question}</h2>
                <p className='mt-2 text-sm leading-relaxed text-ui-muted'>{item.answer}</p>
              </li>
            ))}
          </ul>
        </SectionBlock>
      </PageContainer>
      <AppFooter />
    </>
  );
}
