import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { ToolCard } from '../../components/ui/ToolCard';
import { ArrowUpDown, Files, Scissors, Split } from 'lucide-react';

const TOOLS = [
  {
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document — fast, private, and directly in your browser.',
    href: '/merge-pdf',
    icon: <Files />,
    enabled: true,
  },
  {
    name: 'Split PDF',
    description: 'Split one PDF into smaller PDF files without uploading it anywhere.',
    href: '/split-pdf',
    icon: <Split />,
    enabled: false,
  },
  {
    name: 'Extract Pages',
    description: 'Extract specific pages from a PDF and save only the pages you need.',
    href: '/extract-pages',
    icon: <Scissors />,
    enabled: false,
  },
  {
    name: 'Reorder PDF',
    description: 'Rearrange PDF pages visually and export a new file in seconds.',
    href: '/reorder-pdf',
    icon: <ArrowUpDown />,
    enabled: false,
  },
];

export function HomePage() {
  return (
    <AppShell showHeader={false}>
      <PageContainer>
        <section className="home-main-center">
          <p className="home-label">Private PDF tools - local only</p>

          <div className="tool-grid" aria-label="Tool launcher">
            {TOOLS.map((tool) => (
              <ToolCard
                key={tool.name}
                to={tool.enabled ? tool.href : undefined}
                title={tool.name}
                description={tool.description}
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
