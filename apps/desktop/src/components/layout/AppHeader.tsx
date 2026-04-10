import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowUpDown, ChevronDown, Files, GitBranch, House, Minimize2, Scissors, Split, Zap } from 'lucide-react';

type ToolLink = {
  to: string;
  label: string;
  icon: ReactNode;
};

const TOOL_LINKS: ToolLink[] = [
  { to: '/merge-pdf', label: 'Merge PDF', icon: <Files aria-hidden="true" /> },
  { to: '/split-pdf', label: 'Split PDF', icon: <Split aria-hidden="true" /> },
  { to: '/extract-pages', label: 'Extract Pages', icon: <Scissors aria-hidden="true" /> },
  { to: '/reorder-pdf', label: 'Reorder PDF', icon: <ArrowUpDown aria-hidden="true" /> },
  { to: '/optimize-pdf', label: 'Optimize PDF', icon: <Minimize2 aria-hidden="true" /> },
  { to: '/compress-pdf', label: 'Compress PDF', icon: <Zap aria-hidden="true" /> },
];

export function AppHeader() {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const activePath = window.location.hash.replace(/^#/, '') || '/';
  const isToolActive = TOOL_LINKS.some((tool) => tool.to === activePath);

  useEffect(() => {
    if (!isToolsOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!toolsMenuRef.current?.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsToolsOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isToolsOpen]);

  return (
    <header className="app-header">
      <div className="header-row">
        <NavLink to="/" className="header-home-btn" aria-label="Home">
          <House aria-hidden="true" />
        </NavLink>
        <nav className="header-tools-nav" aria-label="Primary navigation">
          <div className="header-tools-dropdown" ref={toolsMenuRef}>
            <button
              type="button"
              className={`header-tool-btn ${isToolsOpen || isToolActive ? 'header-tool-btn-active' : ''}`.trim()}
              aria-haspopup="menu"
              aria-expanded={isToolsOpen}
              onClick={() => setIsToolsOpen((prev) => !prev)}
            >
              <span>Tools</span>
              <ChevronDown aria-hidden="true" className="header-chevron" />
            </button>

            {isToolsOpen ? (
              <div className="header-tools-menu" role="menu" aria-label="PDF tools">
                <p className="header-tools-menu-label">PDF tools</p>
                {TOOL_LINKS.map((tool) => (
                  <NavLink
                    key={tool.to}
                    to={tool.to}
                    role="menuitem"
                    onClick={() => setIsToolsOpen(false)}
                    className={({ isActive }) =>
                      `header-tools-menu-item ${isActive ? 'header-tools-menu-item-active' : ''}`.trim()
                    }
                  >
                    <span className="header-tool-icon">{tool.icon}</span>
                    <span>{tool.label}</span>
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>

          <NavLink
            to="/workflow-builder"
            className={({ isActive }) => `header-tool-btn ${isActive ? 'header-tool-btn-active' : ''}`.trim()}
          >
            <span className="header-tool-icon">
              <GitBranch aria-hidden="true" />
            </span>
            <span>Workflow Builder</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
