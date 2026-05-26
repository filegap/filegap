import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppFooter } from './AppFooter';

describe('AppFooter', () => {
  it('links to all current PDF tools', () => {
    render(<AppFooter />);

    expect(screen.getByRole('link', { name: 'Merge PDF' })).toHaveAttribute('href', '/merge-pdf');
    expect(screen.getByRole('link', { name: 'Split PDF' })).toHaveAttribute('href', '/split-pdf');
    expect(screen.getByRole('link', { name: 'Extract Pages' })).toHaveAttribute(
      'href',
      '/extract-specific-pages-from-pdf'
    );
    expect(screen.getByRole('link', { name: 'Reorder PDF' })).toHaveAttribute(
      'href',
      '/reorder-pdf-pages'
    );
    expect(screen.getByRole('link', { name: 'Optimize PDF' })).toHaveAttribute(
      'href',
      '/optimize-pdf'
    );
    expect(screen.getByRole('link', { name: 'Compress PDF' })).toHaveAttribute(
      'href',
      '/compress-pdf'
    );
    expect(screen.getByRole('link', { name: 'PDF to Images' })).toHaveAttribute(
      'href',
      '/pdf-to-images'
    );
    expect(screen.getByRole('link', { name: 'Extract Images' })).toHaveAttribute(
      'href',
      '/extract-images'
    );
  });
});
