import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PreDownloadModal } from './PreDownloadModal';

describe('PreDownloadModal', () => {
  it('adds www.filegap.app UTM source to external links', () => {
    render(<PreDownloadModal open onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Create link' })).toHaveAttribute(
      'href',
      'https://lynko.it?utm_source=www.filegap.app'
    );
    expect(screen.getByRole('link', { name: 'supporting the project' })).toHaveAttribute(
      'href',
      'https://buymeacoffee.com/filegap?utm_source=www.filegap.app'
    );
  });
});
