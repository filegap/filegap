import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { ToolCard } from '../../components/ui/ToolCard';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { ArrowUpDown, Files, GitBranch, Minimize2, Scissors, Split, Zap } from 'lucide-react';

const TOOLS = [
  {
    name: 'Workflow Builder',
    description: 'Chain operations visually (preview linear mode).',
    actionLabel: 'Build workflow',
    href: '/workflow-builder',
    icon: <GitBranch />,
    enabled: true,
  },
  {
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into one — fast and private.',
    actionLabel: 'Merge PDFs',
    href: '/merge-pdf',
    icon: <Files />,
    enabled: true,
  },
  {
    name: 'Split PDF',
    description: 'Split a PDF into smaller files — no uploads required.',
    actionLabel: 'Split PDF',
    href: '/split-pdf',
    icon: <Split />,
    enabled: true,
  },
  {
    name: 'Extract Pages',
    description: 'Extract only the pages you need from a PDF.',
    actionLabel: 'Extract pages',
    href: '/extract-pages',
    icon: <Scissors />,
    enabled: true,
  },
  {
    name: 'Reorder PDF',
    description: 'Rearrange PDF pages and export a new file in seconds.',
    actionLabel: 'Reorder pages',
    href: '/reorder-pdf',
    icon: <ArrowUpDown />,
    enabled: true,
  },
  {
    name: 'Optimize PDF',
    description: 'Clean PDF structure without intentional visual quality reduction.',
    actionLabel: 'Optimize PDF',
    href: '/optimize-pdf',
    icon: <Minimize2 />,
    enabled: true,
  },
  {
    name: 'Compress PDF',
    description: 'Shrink PDF size locally with low, balanced, or strong presets.',
    actionLabel: 'Compress PDF',
    href: '/compress-pdf',
    icon: <Zap />,
    enabled: true,
  },
];

export function HomePage() {
  return (
    <AppShell showHeader={false}>
      <PageContainer>
        <section className="home-main-center">
          <h1 className="home-title">Filegap — Private PDF tools</h1>
          <div className="home-trust-banner">
            <TrustNotice />
          </div>

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
