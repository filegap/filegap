import { NavLink } from 'react-router-dom';
import { ArrowUpDown, Files, Scissors, Split } from 'lucide-react';

const TOOL_LINKS = [
  { to: '/merge-pdf', label: 'Merge PDF', icon: <Files aria-hidden="true" /> },
  { to: '/split-pdf', label: 'Split PDF', icon: <Split aria-hidden="true" /> },
  { to: '/extract-pages', label: 'Extract Pages', icon: <Scissors aria-hidden="true" /> },
  { to: '/reorder-pdf', label: 'Reorder PDF', icon: <ArrowUpDown aria-hidden="true" /> },
];

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="header-row">
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
