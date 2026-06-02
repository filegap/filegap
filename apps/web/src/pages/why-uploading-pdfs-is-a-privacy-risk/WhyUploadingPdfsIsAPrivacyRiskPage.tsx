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
    href: '/merge-pdf-without-uploading',
    label: 'Merge without uploading',
    description: 'Combine PDF files with Filegap no-upload positioning.',
  },
  {
    href: '/compress-pdf-without-uploading',
    label: 'Compress without uploading',
    description: 'Reduce PDF overhead while keeping processing local.',
  },
  {
    href: '/merge-pdf',
    label: 'Merge PDF',
    description: 'Use the main local merge workflow.',
  },
  {
    href: '/split-pdf',
    label: 'Split PDF',
    description: 'Separate a document into smaller PDFs in the browser.',
  },
  {
    href: '/compress-pdf',
    label: 'Compress PDF',
    description: 'Try local compression presets before sharing a document.',
  },
  {
    href: '/pdf-to-jpg',
    label: 'PDF to JPG',
    description: 'Export PDF pages as JPG images without sending the file away.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is it always unsafe to upload a PDF online?',
    answer:
      'Not always. Some services have strong security controls and clear policies. The privacy risk is that upload-based tools add a third-party processing step that may be unnecessary for simple PDF edits.',
  },
  {
    question: 'What kinds of PDFs are more sensitive?',
    answer:
      'Contracts, invoices, tax documents, medical documents, CVs, resumes, bank records, insurance documents, and internal forms can all contain information that should be handled carefully.',
  },
  {
    question: 'How do no-upload PDF tools reduce exposure?',
    answer:
      'No-upload tools process the selected file locally in the browser or app, so the document does not need to be sent to a remote PDF backend for the operation.',
  },
  {
    question: 'Do I need an account to use Filegap tools?',
    answer:
      'No. Filegap core browser tools are available without account creation, which avoids adding an identity layer to routine PDF tasks.',
  },
];

export function WhyUploadingPdfsIsAPrivacyRiskPage() {
  usePageMetadata({
    title: 'Why Uploading PDFs Can Be a Privacy Risk | Filegap',
    description:
      'PDFs often contain private information. Learn why uploading files to online PDF tools can be risky and how local browser-based tools can help.',
    canonicalPath: canonicalUrl('/why-uploading-pdfs-is-a-privacy-risk'),
  });

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: 'Why uploading PDFs online can be a privacy risk',
        description:
          'A practical guide to PDF upload privacy risks and local browser-based PDF tools.',
        mainEntityOfPage: canonicalUrl('/why-uploading-pdfs-is-a-privacy-risk'),
        publisher: {
          '@type': 'Organization',
          name: 'Filegap',
          url: canonicalUrl('/'),
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
            name: 'PDF upload privacy risk',
            item: canonicalUrl('/why-uploading-pdfs-is-a-privacy-risk'),
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
      <script type='application/ld+json'>{JSON.stringify(structuredData)}</script>
      <AppHeader />
      <PageContainer>
        <header className='mb-8 space-y-4 md:mb-10'>
          <p className='text-sm font-semibold uppercase tracking-[0.08em] text-brand-primary'>
            No-upload PDF privacy guide
          </p>
          <h1 className='max-w-4xl font-heading text-3xl font-bold leading-tight text-ui-text md:text-4xl'>
            Why uploading PDFs online can be a privacy risk
          </h1>
          <p className='max-w-4xl text-sm leading-relaxed text-ui-muted md:text-base'>
            Uploading a PDF is often a small step in the interface, but it can be a meaningful data
            transfer. For simple tasks, local browser-based tools can reduce exposure by keeping the
            document on your device.
          </p>
          <TrustNotice />
          <div className='flex flex-col gap-3 pt-2 sm:flex-row'>
            <a href='/local-first-pdf-tools' className={buttonStyles({ variant: 'primary', size: 'lg' })}>
              Explore local-first tools
            </a>
            <a href='#no-upload-tools' className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
              Try no-upload PDF tools
            </a>
          </div>
        </header>

        <SectionBlock title='PDFs often contain sensitive information'>
          <div className='max-w-3xl space-y-4 text-sm leading-relaxed text-ui-muted'>
            <p>
              PDFs are commonly used when information needs to look final, portable, or easy to
              share. That is useful, but it also means PDFs often carry details that deserve careful
              handling. A file might include names, addresses, pricing, signatures, dates,
              reference numbers, internal notes, or supporting images.
            </p>
            <p>
              Common examples include contracts, invoices, tax documents, medical documents,
              CVs and resumes, bank documents, insurance documents, HR forms, school paperwork,
              and client deliverables. None of these examples automatically means a file is highly
              confidential, but they show why a PDF upload should be treated as a real data transfer
              rather than a harmless button click.
            </p>
          </div>
        </SectionBlock>

        <section className='mt-10 grid gap-6 md:grid-cols-2'>
          <SectionBlock title='Common upload-based risks' className='md:flex md:h-full md:flex-col' contentClassName='md:flex-1'>
            <div className='space-y-4 text-sm leading-relaxed text-ui-muted'>
              <p>
                The most direct risk is that the file leaves your device. Once that happens, the
                workflow depends on the service that receives it. You may need to understand where
                the file is processed, how long temporary copies remain available, and whether a
                third party is involved in conversion, compression, malware scanning, storage, or
                analytics infrastructure.
              </p>
            <p>
              Another practical issue is account creation. If a simple PDF task requires a login,
              the document workflow can become tied to an identity, workspace, billing account, or
              saved history. That may be unnecessary when all you wanted to do was split a PDF,
              merge two files, or export a few pages as images.
            </p>
            <p>
              Policies can also be hard to compare quickly. A service may describe temporary
              storage, retention windows, processors, and support access in separate places. That
              does not mean the service is doing anything wrong, but it does add review work for a
              task that might only take a few seconds locally.
            </p>
            </div>
          </SectionBlock>

          <SectionBlock title='A practical no-upload alternative' className='md:flex md:h-full md:flex-col' contentClassName='md:flex-1'>
            <div className='space-y-4 text-sm leading-relaxed text-ui-muted'>
              <p>
                Local browser-based tools reduce that exposure by moving the operation into the
                browser runtime. The selected PDF can be read from your device, processed locally,
                and returned as a download without using a remote PDF processing endpoint.
              </p>
            <p>
              This is the model Filegap uses. It is not a claim that every upload-based service is
              unsafe, and it does not replace your organization&apos;s security review. It is a
              simpler starting point: when a PDF task can be completed locally, avoid the upload.
            </p>
            <p>
              That tradeoff is especially useful for routine edits. If the document only needs a
              page removed, two files merged, or a smaller copy created, local processing keeps the
              operation proportional to the task. You get the output you need without creating an
              additional copy on infrastructure you do not control.
            </p>
          </div>
        </SectionBlock>
        </section>

        <SectionBlock title='When to think twice before uploading' className='mt-10'>
          <div className='max-w-3xl space-y-4 text-sm leading-relaxed text-ui-muted'>
            <p>
              It is worth slowing down when a PDF contains personal, financial, medical, legal, or
              business-sensitive information. That includes files like employment paperwork, signed
              agreements, customer invoices, insurance claims, bank letters, tax summaries, internal
              reports, or resumes with contact details and work history.
            </p>
            <p>
              The question does not need to be dramatic. Ask whether the task truly requires a
              server. For many everyday edits, it does not. You can use Filegap to{' '}
              <a className='text-ui-text underline' href='/merge-pdf-without-uploading'>merge PDFs without uploading</a>,{' '}
              <a className='text-ui-text underline' href='/compress-pdf-without-uploading'>compress PDFs without uploading</a>,{' '}
              <a className='text-ui-text underline' href='/split-pdf'>split PDFs</a>, or{' '}
              <a className='text-ui-text underline' href='/pdf-to-jpg'>convert PDF pages to JPG</a> with local browser processing.
            </p>
          </div>
        </SectionBlock>

        <section id='no-upload-tools' className='mt-10 grid scroll-mt-28 gap-3 md:grid-cols-3'>
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

        <section className='mt-12 space-y-4 pb-2 text-center md:space-y-5'>
          <h2 className='font-heading text-3xl font-semibold leading-tight text-ui-text md:text-4xl'>
            Try Filegap&apos;s no-upload PDF tools
          </h2>
          <p className='mx-auto max-w-2xl text-base leading-relaxed text-ui-muted'>
            Choose a PDF tool and keep the processing local in your browser.
          </p>
          <a href='/local-first-pdf-tools' className={buttonStyles({ variant: 'primary', size: 'lg' })}>
            See local-first PDF tools
          </a>
        </section>
      </PageContainer>
      <AppFooter />
    </>
  );
}
