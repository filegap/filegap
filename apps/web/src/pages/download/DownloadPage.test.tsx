import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DownloadPage } from './DownloadPage';

describe('DownloadPage', () => {
  it('renders desktop community install instructions and release link', () => {
    render(<DownloadPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Download Filegap Desktop App' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Desktop community channel/)).toBeInTheDocument();
    expect(
      screen.getByText(/brew tap filegap\/filegap\s+brew install --cask filegap-desktop/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/brew upgrade --cask filegap-desktop/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'GitHub Releases' })
    ).toHaveAttribute('href', 'https://github.com/filegap/filegap/releases');
    expect(
      screen.getByText(/xattr -dr com\.apple\.quarantine "\/Applications\/Filegap Desktop\.app"/)
    ).toBeInTheDocument();
  });
});
