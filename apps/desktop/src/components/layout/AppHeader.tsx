import { NavLink } from 'react-router-dom';
import { ArrowUpDown, Files, GitBranch, House, Minimize2, Scissors, Split, Zap } from 'lucide-react';

const TOOL_LINKS = [
  { to: '/merge-pdf', label: 'Merge PDF', icon: <Files aria-hidden="true" /> },
  { to: '/split-pdf', label: 'Split PDF', icon: <Split aria-hidden="true" /> },
  { to: '/extract-pages', label: 'Extract Pages', icon: <Scissors aria-hidden="true" /> },
  { to: '/reorder-pdf', label: 'Reorder PDF', icon: <ArrowUpDown aria-hidden="true" /> },
  { to: '/optimize-pdf', label: 'Optimize PDF', icon: <Minimize2 aria-hidden="true" /> },
  { to: '/compress-pdf', label: 'Compress PDF', icon: <Zap aria-hidden="true" /> },
  { to: '/workflow-builder', label: 'Workflow', icon: <GitBranch aria-hidden="true" /> },
];

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="header-row">
        <NavLink to="/" className="header-home-btn" aria-label="Home">
          <House aria-hidden="true" />
        </NavLink>
        <nav className="header-tools-nav" aria-label="Tool navigation">
          {TOOL_LINKS.map((tool) => (
            <NavLink
              key={tool.to}
              to={tool.to}
              className={({ isActive }) => `header-tool-btn ${isActive ? 'header-tool-btn-active' : ''}`.trim()}
            >
              <span className="header-tool-icon">{tool.icon}</span>
              <span>{tool.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
