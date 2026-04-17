import { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { ToolCard } from '../../components/ui/ToolCard';
import { TrustNotice } from '../../components/ui/TrustNotice';
import { ArrowDown, ArrowUpDown, Files, GitBranch, Minimize2, Scissors, Split, Zap } from 'lucide-react';

const FEATURED_TOOL = {
  name: 'Workflow Builder',
  description: 'Chain local PDF steps visually and run the flow on your device.',
  actionLabel: 'Build workflow',
  href: '/workflow-builder',
  icon: <GitBranch />,
  enabled: true,
};

const ORGANIZE_TOOLS = [
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
    description: 'Rearrange PDF pages and export a new file.',
    actionLabel: 'Reorder pages',
    href: '/reorder-pdf',
    icon: <ArrowUpDown />,
    enabled: true,
  },
];

const REDUCE_TOOLS = [
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
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [showScrollCta, setShowScrollCta] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) {
      return;
    }

    const updateScrollCtaVisibility = () => {
      const remainingScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight - scrollContainer.scrollTop;
      const hasScrollableContent = scrollContainer.scrollHeight - scrollContainer.clientHeight > 8;
      setShowScrollCta(hasScrollableContent && remainingScroll > 12);
    };

    updateScrollCtaVisibility();
    scrollContainer.addEventListener('scroll', updateScrollCtaVisibility);
    window.addEventListener('resize', updateScrollCtaVisibility);

    return () => {
      scrollContainer.removeEventListener('scroll', updateScrollCtaVisibility);
      window.removeEventListener('resize', updateScrollCtaVisibility);
    };
  }, []);

  const handleScrollDown = () => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) {
      return;
    }

    scrollContainer.scrollBy({
      top: Math.max(scrollContainer.clientHeight * 0.82, 320),
      behavior: 'smooth',
    });
  };

  return (
    <AppShell>
      <PageContainer ref={scrollContainerRef} className="home-page-container">
        <section className="home-main-center">
          <h1 className="home-title">Filegap — Private PDF tools</h1>
          <div className="home-trust-banner">
            <TrustNotice />
          </div>

          <section className="home-section" aria-labelledby="home-builder-heading">
            <div className="home-section-header">
              <h2 id="home-builder-heading">Start with a workflow</h2>
              <p>Build multi-step local PDF flows when a single tool is not enough.</p>
            </div>
            <div className="home-feature-grid">
              <div className="home-featured-card">
                <ToolCard
                  to={FEATURED_TOOL.enabled ? FEATURED_TOOL.href : undefined}
                  title={FEATURED_TOOL.name}
                  description={FEATURED_TOOL.description}
                  actionLabel={FEATURED_TOOL.actionLabel}
                  icon={FEATURED_TOOL.icon}
                  disabled={!FEATURED_TOOL.enabled}
                />
              </div>
            </div>
          </section>

          <section className="home-section" aria-labelledby="home-organize-heading">
            <div className="home-section-header">
              <h2 id="home-organize-heading">Organize PDFs</h2>
              <p>Fast local tools for combining, splitting, extracting, and reordering pages.</p>
            </div>
            <div className="home-tool-grid" aria-label="Organize PDF tools">
              {ORGANIZE_TOOLS.map((tool) => (
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

          <section className="home-section" aria-labelledby="home-reduce-heading">
            <div className="home-section-header">
              <h2 id="home-reduce-heading">Reduce file size</h2>
              <p>Optimize structure or compress images locally depending on the PDF you have.</p>
            </div>
            <div className="home-tool-grid" aria-label="Reduce PDF size tools">
              {REDUCE_TOOLS.map((tool) => (
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
        </section>
      </PageContainer>
      {showScrollCta ? (
        <button
          type="button"
          className="home-scroll-cta"
          onClick={handleScrollDown}
          aria-label="Scroll down to discover more tools"
          title="Discover more tools"
        >
          <ArrowDown />
        </button>
      ) : null}
    </AppShell>
  );
}
