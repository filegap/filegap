import {
  ArrowUpDown,
  Download,
  Files,
  Github,
  Leaf,
  Scissors,
  ShieldCheck,
  Split,
  Terminal,
  Zap,
} from 'lucide-react';

import { AppFooter } from '../../components/layout/AppFooter';
import { AppHeader } from '../../components/layout/AppHeader';
import { PageContainer } from '../../components/layout/PageContainer';
import { trackEvent } from '../../lib/analytics/trackEvent';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { usePageMetadata } from '../../lib/seo/usePageMetadata';
import { HomeToolCard } from './HomeToolCard';

const TOOLS = [
  {
    name: 'Merge PDF',
    description:
      'Combine multiple PDF files into one document — fast, private, and directly in your browser.',
    href: '/merge-pdf',
    ctaLabel: 'Merge PDFs',
    icon: <Files />,
  },
  {
    name: 'Split PDF',
    description: 'Split one PDF into smaller PDF files without uploading it anywhere.',
    href: '/split-pdf',
    ctaLabel: 'Split PDF',
    icon: <Split />,
  },
  {
    name: 'Extract Pages',
    description: 'Extract specific pages from a PDF and save only the pages you need.',
    href: '/extract-pages',
    ctaLabel: 'Extract pages',
    icon: <Scissors />,
  },
  {
    name: 'Reorder PDF',
    description: 'Rearrange PDF pages visually and export a new file in seconds.',
    href: '/reorder-pdf',
    ctaLabel: 'Reorder pages',
    icon: <ArrowUpDown />,
  },
];

const WHY_ITEMS = [
  {
    icon: <ShieldCheck className='h-6 w-6' />,
    title: '100% local processing',
    description:
      'Your PDF files are processed directly in your browser. They are never uploaded to any server.',
  },
  {
    icon: <Zap className='h-6 w-6' />,
    title: 'No accounts, no file tracking',
    description:
      'Use all tools instantly without signing up. We only track high-level tool usage and never your files.',
  },
  {
    icon: <Leaf className='h-6 w-6' />,
    title: 'Fast and lightweight',
    description:
      'No uploads, no waiting. Everything runs locally for maximum speed and responsiveness.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is Filegap really private?',
    answer:
      'Yes. All PDF processing happens locally in your browser. Your files are never uploaded to any server.',
  },
  {
    question: 'Are my files uploaded anywhere?',
    answer:
      'No. Your files stay on your device and are processed locally using your browser.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No. You can use all tools instantly without signing up.',
  },
  {
    question: 'Is Filegap free to use?',
    answer: 'Yes. All core PDF tools are free to use with no hidden limits.',
  },
  {
    question: 'Does Filegap work offline?',
    answer:
      'Yes, in most cases. Once loaded, the tools can run locally without needing a constant internet connection.',
  },
];

export function HomePage() {
  usePageMetadata({
    title: 'Free PDF tools — private, fast, and local | Filegap',
    description:
      'Merge, split, and edit PDF files directly in your browser. No uploads. No accounts. Private local processing with files that never leave your device.',
  });

  return (
    <>
      <AppHeader />
      <PageContainer>
        <section className='mx-auto max-w-4xl space-y-6 text-center md:space-y-7'>
          <div className='flex justify-center'>
            <TrustNotice className='px-2.5 py-1.5' textClassName='text-[11px]' />
          </div>

          <p className='text-sm text-ui-muted'>
            <a
              href='https://github.com/filegap/filegap'
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1.5 transition hover:text-ui-text'
            >
              <Github className='h-4 w-4' aria-hidden='true' />
              <span>Open source on GitHub</span>
            </a>
          </p>

          <h1 className='mx-auto max-w-4xl font-heading text-4xl font-bold leading-tight text-ui-text md:text-5xl'>
            Edit PDF files online
            <br />
            <span className='block font-semibold'>No uploads. No accounts.</span>
          </h1>
          <p className='mx-auto max-w-lg text-base leading-relaxed text-ui-muted'>
            <span className='block'>Merge, split, and edit PDF files directly in your browser</span>
            <span className='block font-medium'>Everything runs locally</span>
          </p>

          <div className='space-y-2'>
            <a
              href='/merge-pdf'
              className='inline-flex items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2'
            >
              Merge PDFs instantly
            </a>
            <p className='text-sm text-ui-muted'>
              Use the{' '}
              <a
                className='underline hover:text-ui-text'
                href='/cli'
                onClick={() => trackEvent('download_cli_clicked')}
              >
                CLI
              </a>{' '}
              or{' '}
              <a
                className='underline hover:text-ui-text'
                href='/download'
                onClick={() => trackEvent('download_app_clicked')}
              >
                download the app
              </a>
            </p>
            <p className='text-[11px] text-ui-muted/75'>Works in all modern browsers</p>
          </div>
        </section>

        <section data-testid='home-tool-grid' className='mt-16 grid gap-4 md:mt-20 md:grid-cols-2'>
          {TOOLS.map((tool) => (
            <HomeToolCard
              key={tool.href}
              name={tool.name}
              description={tool.description}
              href={tool.href}
              ctaLabel={tool.ctaLabel}
              icon={tool.icon}
            />
          ))}
        </section>

        <section className='mt-10 space-y-4'>
          <h2 className='font-heading text-2xl font-semibold text-ui-text'>More ways to use Filegap</h2>
          <div className='grid gap-4 md:grid-cols-2'>
            <a
              href='/cli'
              onClick={() => trackEvent('download_cli_clicked')}
              className='rounded-xl border border-ui-border bg-ui-surface p-6 transition hover:border-brand-primary/70 hover:bg-brand-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2'
            >
              <div className='flex items-start gap-4'>
                <span
                  className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary'
                  aria-hidden='true'
                >
                  <Terminal className='h-5 w-5' />
                </span>
                <div>
                  <h3 className='font-heading text-lg font-semibold text-ui-text'>
                    Use Filegap from your terminal
                  </h3>
                  <p className='mt-2 text-sm leading-relaxed text-ui-muted'>
                    Run PDF tools directly via CLI — fast, scriptable, private.
                  </p>
                  <p className='mt-4 text-sm font-semibold text-ui-text underline'>Go to CLI</p>
                </div>
              </div>
            </a>
            <a
              href='/download'
              onClick={() => trackEvent('download_app_clicked')}
              className='rounded-xl border border-ui-border bg-ui-surface p-6 transition hover:border-brand-primary/70 hover:bg-brand-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2'
            >
              <div className='flex items-start gap-4'>
                <span
                  className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary'
                  aria-hidden='true'
                >
                  <Download className='h-5 w-5' />
                </span>
                <div>
                  <h3 className='font-heading text-lg font-semibold text-ui-text'>
                    Download the desktop app
                  </h3>
                  <p className='mt-2 text-sm leading-relaxed text-ui-muted'>
                    Process files locally without a browser — fully offline.
                  </p>
                  <p className='mt-4 text-sm font-semibold text-ui-text underline'>Download app</p>
                </div>
              </div>
            </a>
          </div>
        </section>

        <section className='mt-10 rounded-xl border border-ui-border bg-ui-surface p-6'>
          <h2 className='font-heading text-2xl font-semibold text-ui-text'>Why Filegap</h2>
          <ul className='mt-5 space-y-4'>
            {WHY_ITEMS.map((item) => (
              <li key={item.title} className='flex items-start gap-3 py-1.5'>
                <span className='mt-0.5 text-brand-primary' aria-hidden='true'>
                  {item.icon}
                </span>
                <div>
                  <p className='text-sm font-semibold text-ui-text'>{item.title}</p>
                  <p className='mt-1.5 text-sm leading-relaxed text-ui-muted'>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className='mt-10 rounded-xl border border-ui-border bg-ui-surface p-6'>
          <h2 className='font-heading text-2xl font-semibold text-ui-text'>Frequently asked questions</h2>
          <ul className='mt-5 space-y-6'>
            {FAQ_ITEMS.map((item) => (
              <li key={item.question}>
                <h3 className='text-base font-semibold text-ui-text'>{item.question}</h3>
                <p className='mt-2 text-sm leading-relaxed text-ui-muted'>{item.answer}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className='mt-10 rounded-xl border border-ui-border bg-ui-surface p-6'>
          <h2 className='font-heading text-2xl font-semibold text-ui-text'>Simple and private PDF tools</h2>
          <div className='mt-5 max-w-3xl space-y-4 text-sm leading-relaxed text-ui-muted'>
            <p>
              Filegap provides a set of simple and private PDF tools that run entirely in your
              browser. You can easily <a className='text-ui-text underline' href='/merge-pdf'>merge PDF files</a>,{' '}
              <a className='text-ui-text underline' href='/split-pdf'>split PDF documents</a>,{' '}
              <a className='text-ui-text underline' href='/extract-pages'>extract pages</a>, or{' '}
              <a className='text-ui-text underline' href='/reorder-pdf'>reorder pages</a> without
              uploading anything online.
            </p>
            <p>
              Unlike most PDF tools, Filegap does not send your files to a server. All processing
              happens locally on your device, making it a safer choice if you need to handle
              sensitive documents.
            </p>
            <p>
              Whether you need to combine PDF files into one document, split large PDFs into
              smaller files, or extract only specific pages, Filegap lets you do it quickly and
              securely — directly in your browser, with no signup required.
            </p>
          </div>
        </section>

        <section className='mt-12 space-y-4 pb-2 text-center md:space-y-5'>
          <h2 className='font-heading text-3xl font-semibold leading-tight text-ui-text md:text-4xl'>
            Ready to edit your PDFs privately?
          </h2>
          <p className='mx-auto max-w-2xl text-base leading-relaxed text-ui-muted'>
            Start using Filegap directly in your browser — no uploads, no signup.
          </p>
          <a
            href='/merge-pdf'
            className='inline-flex items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2'
          >
            Merge PDFs instantly
          </a>
        </section>
      </PageContainer>
      <AppFooter />
    </>
  );
}
