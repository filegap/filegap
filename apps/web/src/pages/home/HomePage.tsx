import { ArrowUpDown, Files, Leaf, Scissors, ShieldCheck, Split, Zap } from 'lucide-react';

import { AppFooter } from '../../components/layout/AppFooter';
import { AppHeader } from '../../components/layout/AppHeader';
import { PageContainer } from '../../components/layout/PageContainer';
import { usePageMetadata } from '../../lib/seo/usePageMetadata';
import { HomeToolCard } from './HomeToolCard';

const TOOLS = [
  {
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document.',
    href: '/merge-pdf',
    icon: <Files />,
  },
  {
    name: 'Split PDF',
    description: 'Split one PDF into multiple files.',
    href: '/split-pdf',
    icon: <Split />,
  },
  {
    name: 'Extract Pages',
    description: 'Extract selected pages from a PDF.',
    href: '/extract-pages',
    icon: <Scissors />,
  },
  {
    name: 'Reorder PDF',
    description: 'Reorder pages within a PDF.',
    href: '/reorder-pdf',
    icon: <ArrowUpDown />,
  },
];

const WHY_ITEMS = [
  {
    icon: <ShieldCheck className='h-6 w-6' />,
    title: 'Local processing only',
    description: 'Your PDF files never leave your device.',
  },
  {
    icon: <Zap className='h-6 w-6' />,
    title: 'Fast',
    description: 'Everything runs directly in your browser.',
  },
  {
    icon: <Leaf className='h-6 w-6' />,
    title: 'Lightweight',
    description: 'No accounts, no tracking, no uploads.',
  },
];

export function HomePage() {
  usePageMetadata({
    title: 'Private PDF tools that run locally | Filegap',
    description:
      'Private PDF tools that run locally. All processing runs in your browser. No uploads. Your files never leave your device.',
  });

  return (
    <>
      <AppHeader />
      <PageContainer>
        <section className='mx-auto max-w-3xl space-y-4 text-center'>
          <h1 className='font-heading text-4xl font-bold leading-tight text-ui-text md:text-5xl'>
            Private PDF tools that run locally.
          </h1>
          <p className='text-sm leading-relaxed text-ui-muted md:text-base'>
            All processing runs locally in your browser. No uploads. Your files never leave your
            device.
          </p>
        </section>

        <section data-testid='home-tool-grid' className='mt-10 grid gap-4 md:grid-cols-2'>
          {TOOLS.map((tool) => (
            <HomeToolCard
              key={tool.href}
              name={tool.name}
              description={tool.description}
              href={tool.href}
              icon={tool.icon}
            />
          ))}
        </section>

        <section className='mt-10 rounded-xl border border-ui-border bg-ui-surface p-5'>
          <h2 className='font-heading text-2xl font-semibold text-ui-text'>Why Filegap</h2>
          <ul className='mt-4 space-y-3'>
            {WHY_ITEMS.map((item) => (
              <li key={item.title} className='flex items-start gap-3 py-1'>
                <span className='mt-0.5 text-brand-primary' aria-hidden='true'>
                  {item.icon}
                </span>
                <div>
                  <p className='text-sm font-semibold text-ui-text'>{item.title}</p>
                  <p className='mt-1 text-sm text-ui-muted'>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </PageContainer>
      <AppFooter />
    </>
  );
}
