import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CliPage } from './CliPage';

describe('CliPage', () => {
  it('renders brew installation command and GitHub link', () => {
    render(<CliPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Filegap CLI' })).toBeInTheDocument();
    expect(screen.getByText('Private PDF tools, right from your terminal.')).toBeInTheDocument();
    expect(screen.getByText('CLI Homebrew channel')).toBeInTheDocument();
    expect(screen.getByText(/brew tap filegap\/filegap\s+brew install filegap/)).toBeInTheDocument();
    expect(screen.getByText('brew install filegap/filegap/filegap')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Update Filegap CLI' })).toBeInTheDocument();
    expect(screen.getByText(/brew update\s+brew upgrade filegap/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'CLI notes' })).toBeInTheDocument();
    expect(screen.getByText('Commands are pipe-first and safe for scripts.')).toBeInTheDocument();
    expect(screen.getByText(/filegap --version\s+filegap --help/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'View source code and releases on GitHub →' })
    ).toHaveAttribute(
      'href',
      'https://github.com/filegap/filegap'
    );
  });
});
