import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DownloadPage } from './DownloadPage';

describe('DownloadPage', () => {
  afterEach(() => {
    delete window.sa_event;
    vi.restoreAllMocks();
  });

  it('renders desktop community install instructions and release link', () => {
    render(<DownloadPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Download Filegap Desktop App' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Desktop community channel/)).toBeInTheDocument();
    expect(
      screen.getByText(/brew tap filegap\/filegap\s+brew install --cask filegap-desktop/)
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Update Filegap Desktop' })).toBeInTheDocument();
    expect(
      screen.getByText(/brew update\s+brew upgrade --cask filegap-desktop/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'GitHub Releases' })
    ).toHaveAttribute('href', 'https://github.com/filegap/filegap/releases');
    expect(
      screen.getByText(/xattr -dr com\.apple\.quarantine "\/Applications\/Filegap Desktop\.app"/)
    ).toBeInTheDocument();
  });

  it('tracks successful Homebrew command copies and GitHub release clicks', async () => {
    const user = userEvent.setup();
    const analyticsEvent = vi.fn();
    window.sa_event = analyticsEvent;
    const clipboardWrite = vi.spyOn(navigator.clipboard, 'writeText');

    render(<DownloadPage />);

    await user.click(
      screen.getByRole('button', { name: 'Copy Homebrew install command' })
    );

    expect(clipboardWrite).toHaveBeenCalledWith(
      'brew tap filegap/filegap\nbrew install --cask filegap-desktop'
    );
    expect(analyticsEvent).toHaveBeenCalledWith('homebrew_command_copied');

    await user.click(screen.getByRole('link', { name: 'GitHub Releases' }));

    expect(analyticsEvent).toHaveBeenCalledWith('github_release_clicked');
  });
});
