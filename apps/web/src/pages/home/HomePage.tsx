import {
  ArrowRight,
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
import { useState } from 'react';

import { AppFooter } from '../../components/layout/AppFooter';
import { AppHeader } from '../../components/layout/AppHeader';
import { PageContainer } from '../../components/layout/PageContainer';
import { SectionBlock } from '../../components/layout/SectionBlock';
import { trackEvent } from '../../lib/analytics/trackEvent';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { usePageMetadata } from '../../lib/seo/usePageMetadata';
import { HomeToolCard } from './HomeToolCard';

const TOOLS = [
  {
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into one — fast and private.',
    href: '/merge-pdf',
    ctaLabel: 'Merge PDFs',
    icon: <Files />,
  },
  {
    name: 'Split PDF',
    description: 'Split a PDF into smaller files — no uploads required.',
    href: '/split-pdf',
    ctaLabel: 'Split PDF',
    icon: <Split />,
  },
  {
    name: 'Extract Pages',
    description: 'Extract only the pages you need from a PDF.',
    href: '/extract-pages',
    ctaLabel: 'Extract pages',
    icon: <Scissors />,
  },
  {
    name: 'Reorder PDF',
    description: 'Rearrange PDF pages and export a new file in seconds.',
    href: '/reorder-pdf',
    ctaLabel: 'Reorder pages',
    icon: <ArrowUpDown />,
  },
];

const WHY_ITEMS = [
  {
    icon: <ShieldCheck className='h-6 w-6' />,
    title: 'Local processing',
    description: 'Your PDF files stay on your device while you edit them.',
  },
  {
    icon: <Zap className='h-6 w-6' />,
    title: 'No tracking',
    description: 'No account is needed, and your files are not tracked.',
  },
  {
    icon: <Leaf className='h-6 w-6' />,
    title: 'Fast & lightweight',
    description: 'Quick tools with less waiting and a cleaner workflow.',
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
  const [heroPrimaryTool] = useState(() => TOOLS[Math.floor(Math.random() * TOOLS.length)] ?? TOOLS[0]);

  usePageMetadata({
    title: 'Free PDF tools — private, fast, and local | Filegap',
    description:
      'Edit PDF files locally with fast, private tools. Merge, split, and reorder PDFs directly in your browser with no uploads or account required.',
  });

  return (
    <>
      <AppHeader />
      <PageContainer>
        <section className='mx-auto max-w-5xl space-y-7 text-center md:space-y-8'>
          <p className='text-sm text-ui-muted'>
            <a
              href='https://github.com/filegap/filegap'
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1.5 rounded-xl border border-ui-border px-3 py-1.5 text-xs font-medium text-ui-muted transition hover:border-ui-text/15 hover:text-ui-text'
            >
              <Github className='h-4 w-4' aria-hidden='true' />
              <span>Open source on GitHub</span>
            </a>
          </p>

          <div className='space-y-3 md:space-y-4'>
            <h1 className='mx-auto max-w-4xl font-heading text-4xl font-bold leading-[1.1] text-ui-text md:text-5xl'>
              Edit PDFs locally — fast and private
            </h1>
            <p className='mx-auto max-w-xl text-base leading-relaxed text-ui-muted md:text-lg'>
              Merge, split, and edit PDFs directly in your browser.
            </p>
            <p className='text-sm font-medium text-ui-muted'>No uploads. No accounts.</p>
            <div className='pt-1.5'>
              <TrustNotice />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <a
                href={heroPrimaryTool.href}
                className='inline-flex min-w-[210px] items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-[background-color,box-shadow] duration-200 ease-out hover:bg-brand-primary-dark hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2'
              >
                {`Start with ${heroPrimaryTool.name}`}
              </a>
              <a
                href='#home-tool-grid'
                className='inline-flex min-w-[160px] items-center justify-center rounded-xl border border-ui-border/90 bg-ui-surface px-6 py-3 text-sm font-semibold text-ui-text shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition duration-200 hover:border-ui-text/20 hover:bg-ui-bg hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:ring-offset-2'
              >
                See all tools
              </a>
            </div>
            <p className='text-sm text-ui-muted'>
              Need more control? Try the{' '}
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
              .
            </p>
          </div>
        </section>

        <section
          id='home-tool-grid'
          data-testid='home-tool-grid'
          className='mt-20 scroll-mt-28 grid gap-4 md:mt-24 md:grid-cols-2 md:scroll-mt-32'
        >
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

        <SectionBlock
          title='Use Filegap your way'
          className='mt-16 md:mt-20'
          contentClassName='border-0 bg-transparent p-0 md:p-0'
        >
          <div className='grid gap-4 md:grid-cols-2'>
            <a
              href='/cli'
              onClick={() => trackEvent('download_cli_clicked')}
              className='group rounded-xl border border-ui-border bg-ui-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-ui-text/10 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2'
            >
              <div className='flex items-start gap-4'>
                <span
                  className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary transition-transform duration-200 ease-out group-hover:scale-[1.03]'
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
                  <span className='mt-4 inline-flex items-center rounded-lg border border-ui-border bg-ui-surface px-4 py-2 text-sm font-semibold text-ui-text shadow-[0_1px_2px_rgba(15,23,42,0.02)]'>
                    <span>Use the CLI</span>
                    <ArrowRight
                      className='ml-1.5 h-3.5 w-3.5 text-current/70 transition-[transform,opacity] duration-200 ease-out group-hover:translate-x-1 group-hover:opacity-100'
                      aria-hidden='true'
                    />
                  </span>
                </div>
              </div>
            </a>
            <a
              href='/download'
              onClick={() => trackEvent('download_app_clicked')}
              className='group rounded-xl border border-ui-border bg-ui-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-ui-text/10 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2'
            >
              <div className='flex items-start gap-4'>
                <span
                  className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary transition-transform duration-200 ease-out group-hover:scale-[1.03]'
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
                  <span className='mt-4 inline-flex items-center rounded-lg border border-ui-border bg-ui-surface px-4 py-2 text-sm font-semibold text-ui-text shadow-[0_1px_2px_rgba(15,23,42,0.02)]'>
                    <span>Download the app</span>
                    <ArrowRight
                      className='ml-1.5 h-3.5 w-3.5 text-current/70 transition-[transform,opacity] duration-200 ease-out group-hover:translate-x-1 group-hover:opacity-100'
                      aria-hidden='true'
                    />
                  </span>
                </div>
              </div>
            </a>
          </div>
        </SectionBlock>

        <SectionBlock title='Why Filegap' className='mt-16 md:mt-20'>
          <ul className='grid gap-6 md:grid-cols-3'>
            {WHY_ITEMS.map((item, index) => (
              <li
                key={item.title}
                className={`space-y-3 ${index > 0 ? 'md:border-l md:border-ui-border/70 md:pl-6' : ''}`.trim()}
              >
                <span className='inline-flex text-brand-primary' aria-hidden='true'>
                  {item.icon}
                </span>
                <div>
                  <p className='text-sm font-semibold text-ui-text'>{item.title}</p>
                  <p className='mt-1.5 text-sm leading-relaxed text-ui-muted'>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionBlock>

        <SectionBlock title='Frequently asked questions' className='mt-16 md:mt-20'>
          <ul className='space-y-6'>
            {FAQ_ITEMS.map((item) => (
              <li key={item.question}>
                <h3 className='text-base font-semibold text-ui-text'>{item.question}</h3>
                <p className='mt-2 text-sm leading-relaxed text-ui-muted'>{item.answer}</p>
              </li>
            ))}
          </ul>
        </SectionBlock>

        <SectionBlock title='Simple and private PDF tools' className='mt-16 md:mt-20'>
          <div className='max-w-3xl space-y-4 text-sm leading-relaxed text-ui-muted'>
            <p>
              Filegap gives you a focused set of PDF tools for everyday work. You can{' '}
              <a className='text-ui-text underline' href='/merge-pdf'>merge PDF files</a>,{' '}
              <a className='text-ui-text underline' href='/split-pdf'>split PDF documents</a>,{' '}
              <a className='text-ui-text underline' href='/extract-pages'>extract pages</a>, or{' '}
              <a className='text-ui-text underline' href='/reorder-pdf'>reorder pages</a> in a few clicks.
            </p>
            <p>
              The interface stays simple, so you can get in, make the change you need, and export
              the result without extra steps.
            </p>
            <p>
              Whether you are combining files, splitting long documents, or fixing page order,
              Filegap keeps the workflow quick and easy to scan.
            </p>
          </div>
        </SectionBlock>

        <section className='mt-16 space-y-4 pb-2 text-center md:mt-20 md:space-y-5'>
          <h2 className='font-heading text-3xl font-semibold leading-tight text-ui-text md:text-4xl'>
            Ready to edit your PDFs privately?
          </h2>
          <p className='mx-auto max-w-2xl text-base leading-relaxed text-ui-muted'>
            Start using Filegap directly in your browser — no uploads, no signup.
          </p>
          <a
            href={heroPrimaryTool.href}
            className='inline-flex items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2'
          >
            {`Start with ${heroPrimaryTool.name}`}
          </a>
        </section>
      </PageContainer>
      <AppFooter />
    </>
  );
}
