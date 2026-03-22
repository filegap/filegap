import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { ToolCard } from '../../components/ui/ToolCard';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { ArrowUpDown, Files, Scissors, Split } from 'lucide-react';

const TOOLS = [
  {
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document — fast, private, and directly in your browser.',
    actionLabel: 'Merge files',
    href: '/merge-pdf',
    icon: <Files />,
    enabled: true,
  },
  {
    name: 'Split PDF',
    description: 'Split one PDF into smaller PDF files without uploading it anywhere.',
    actionLabel: 'Split PDF',
    href: '/split-pdf',
    icon: <Split />,
    enabled: true,
  },
  {
    name: 'Extract Pages',
    description: 'Extract specific pages from a PDF and save only the pages you need.',
    actionLabel: 'Extract pages',
    href: '/extract-pages',
    icon: <Scissors />,
    enabled: true,
  },
  {
    name: 'Reorder PDF',
    description: 'Rearrange PDF pages visually and export a new file in seconds.',
    actionLabel: 'Reorder pages',
    href: '/reorder-pdf',
    icon: <ArrowUpDown />,
    enabled: true,
  },
];

export function HomePage() {
  return (
    <AppShell showHeader={false}>
      <PageContainer>
        <section className="home-main-center">
          <h1 className="home-title">Filegap — Private PDF tools</h1>
          <TrustNotice className="home-trust-banner" />

          <div className="tool-grid" aria-label="Tool launcher">
            {TOOLS.map((tool) => (
              <ToolCard
                key={tool.name}
                to={tool.enabled ? tool.href : undefined}
                title={tool.name}
                description={tool.description}
                actionLabel={tool.actionLabel}
                icon={tool.icon}
                disabled={!tool.enabled}
              />
            ))}
          </div>
        </section>
      </PageContainer>
    </AppShell>
  );
}
