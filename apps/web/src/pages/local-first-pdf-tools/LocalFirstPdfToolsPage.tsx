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
    label: 'Merge PDFs',
    description: 'Combine several PDF files into one local output file.',
  },
  {
    href: '/split-pdf',
    label: 'Split PDFs',
    description: 'Create smaller PDFs from page ranges in your browser.',
  },
  {
    href: '/compress-pdf',
    label: 'Compress PDFs',
    description: 'Reduce PDF overhead with local compression presets.',
  },
  {
    href: '/pdf-to-jpg',
    label: 'Convert PDF to JPG',
    description: 'Export PDF pages as JPG images without uploading the document.',
  },
  {
    href: '/extract-pages-from-pdf',
    label: 'Extract pages',
    description: 'Keep selected pages and save a new focused PDF.',
  },
  {
    href: '/reorder-pdf-pages',
    label: 'Reorder pages',
    description: 'Move PDF pages into the order you need before download.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'What does local-first mean for PDF tools?',
    answer:
      'Local-first means the PDF operation runs on your own device first, usually inside the browser or desktop app, instead of sending the file to a remote processing service.',
  },
  {
    question: 'Are browser-based PDF tools the same as upload-based tools?',
    answer:
      'No. A browser-based local tool can read and process the selected file in the browser runtime. An upload-based tool sends the file to a server before creating the result.',
  },
  {
    question: 'Can local-first PDF tools work without an account?',
    answer:
      'Yes. Filegap does not require an account for the core browser tools, because the processing does not depend on a user workspace on a server.',
  },
  {
    question: 'Do local-first tools work for every PDF task?',
    answer:
      'They work well for everyday tasks such as merging, splitting, compressing, extracting pages, reordering pages, and converting PDF pages to images. Very heavy files may be better handled by a desktop app or CLI.',
  },
];

export function LocalFirstPdfToolsPage() {
  usePageMetadata({
    title: 'Local-First PDF Tools - Private PDF Editing With No Upload | Filegap',
    description:
      'Use local-first PDF tools that process files directly in your browser. Merge, split, compress and convert PDFs privately with no uploads and no account.',
    canonicalPath: canonicalUrl('/local-first-pdf-tools'),
  });

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: 'Local-first PDF tools that keep your files on your device',
        description:
          'A practical guide to local-first PDF tools, browser-based processing, and no-upload PDF workflows.',
        mainEntityOfPage: canonicalUrl('/local-first-pdf-tools'),
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
            name: 'Local-first PDF tools',
            item: canonicalUrl('/local-first-pdf-tools'),
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
            Private browser-based PDF tools
          </p>
          <h1 className='max-w-4xl font-heading text-3xl font-bold leading-tight text-ui-text md:text-4xl'>
            Local-first PDF tools that keep your files on your device
          </h1>
          <p className='max-w-4xl text-sm leading-relaxed text-ui-muted md:text-base'>
            Local-first PDF tools let you handle common document tasks without handing your PDF to
            a remote processor. Filegap runs PDF operations in your browser, desktop app, or CLI so
            the file stays under your control from selection to download.
          </p>
          <TrustNotice />
          <div className='flex flex-col gap-3 pt-2 sm:flex-row'>
            <a href='#local-pdf-tools' className={buttonStyles({ variant: 'primary', size: 'lg' })}>
              Browse local PDF tools
            </a>
            <a href='/why-uploading-pdfs-is-a-privacy-risk' className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
              Understand upload risks
            </a>
          </div>
        </header>

        <SectionBlock title='What local-first means for PDF work'>
          <div className='max-w-3xl space-y-4 text-sm leading-relaxed text-ui-muted'>
            <p>
              Local-first means the first place work happens is your own device. In a PDF tool, that
              matters because the selected file can contain contracts, invoices, forms, notes, or
              drafts that were never meant to become part of a remote service workflow. A local-first
              tool reads the file in the browser or app runtime, performs the selected operation, and
              gives you a new file to download.
            </p>
            <p>
              Filegap is built around that model. The web app uses browser-local processing for PDF
              tasks, the desktop app keeps heavier workflows offline-friendly, and the CLI supports
              repeatable local automation. You still get a simple online interface, but the PDF
              operation itself does not require an upload endpoint or a server-side file queue.
            </p>
            <p>
              This also makes the workflow easier to reason about. The input is the file you choose
              on your device, the operation is the specific action you request, and the output is the
              downloaded result. There is no hidden project library, shared workspace, or remote
              storage area to clean up after a quick edit.
            </p>
          </div>
        </SectionBlock>

        <section id='local-pdf-tools' className='mt-10 grid scroll-mt-28 gap-3 md:grid-cols-3'>
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
          <SectionBlock title='Upload-based vs browser-based tools' className='md:flex md:h-full md:flex-col' contentClassName='md:flex-1'>
            <div className='space-y-4 text-sm leading-relaxed text-ui-muted'>
              <p>
                Upload-based PDF tools usually send your document to a backend service. The server
                processes the file, stores a temporary result, and returns a download. That can be
                convenient, but it also means the file leaves your device before the operation is
                complete.
              </p>
              <p>
                Browser-based local tools keep the processing boundary closer to you. The file is
                selected from your device, handled in the browser, and exported back to your device.
                That reduces unnecessary exposure for everyday edits like merging, splitting,
                compression, page extraction, page reordering, and PDF to image conversion.
              </p>
            </div>
          </SectionBlock>

          <SectionBlock title='Why this matters for privacy' className='md:flex md:h-full md:flex-col' contentClassName='md:flex-1'>
            <div className='space-y-4 text-sm leading-relaxed text-ui-muted'>
              <p>
                PDFs often carry more context than a single visible page. A simple attachment can
                include names, addresses, pricing, dates, embedded images, signatures, or internal
                references. Even when the task is basic, the file itself may be sensitive.
              </p>
              <p>
                Local-first processing is a practical privacy improvement because it removes a
                common data transfer from the workflow. It does not replace your own security
                process, but it helps avoid sending documents to a service when the task can be done
                on the device you already trust.
              </p>
            </div>
          </SectionBlock>
        </section>

        <SectionBlock title='When local PDF tools are useful' className='mt-10'>
          <div className='max-w-3xl space-y-4 text-sm leading-relaxed text-ui-muted'>
            <p>
              Local PDF tools are useful when the task is routine but the document still deserves
              care. You may need to <a className='text-ui-text underline' href='/merge-pdf'>merge PDFs</a> from
              several sources, <a className='text-ui-text underline' href='/split-pdf'>split a PDF</a> into
              smaller sections, <a className='text-ui-text underline' href='/compress-pdf'>compress a PDF</a> for
              sharing, <a className='text-ui-text underline' href='/extract-pages-from-pdf'>extract pages</a> from
              a longer document, <a className='text-ui-text underline' href='/reorder-pdf-pages'>reorder pages</a>,
              or <a className='text-ui-text underline' href='/pdf-to-jpg'>convert PDF pages to JPG</a>.
            </p>
            <p>
              Those tasks should not require an account, a file upload, or a complicated export
              flow. A local-first approach keeps the interface simple: choose the file, make the
              change, and download the result. For heavier jobs or offline-first workflows, Filegap
              also provides desktop and CLI paths that keep the same local-processing promise.
            </p>
            <p>
              The same idea applies across teams and personal workflows. A developer may prefer the
              CLI for a scripted document step, while a non-technical user may prefer the browser for
              a one-time merge or split. The important part is that both workflows avoid treating the
              PDF as data that must be uploaded before it can be edited.
            </p>
          </div>
        </SectionBlock>

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
            Use Filegap without uploading your PDFs
          </h2>
          <p className='mx-auto max-w-2xl text-base leading-relaxed text-ui-muted'>
            Start with a local browser tool and keep the PDF operation on your device.
          </p>
          <a href='/merge-pdf' className={buttonStyles({ variant: 'primary', size: 'lg' })}>
            Try Filegap tools
          </a>
        </section>
      </PageContainer>
      <AppFooter />
    </>
  );
}
