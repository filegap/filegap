import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders hero, tool grid, and why section', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy-first PDF tools.' })).toBeInTheDocument();
    expect(screen.getByText('All processing runs locally in your browser. No uploads. No tracking.')).toBeInTheDocument();

    const grid = screen.getByTestId('home-tool-grid');
    expect(within(grid).getByRole('link', { name: /Merge PDF/i })).toHaveAttribute('href', '/merge-pdf');
    expect(within(grid).getByRole('link', { name: /Split PDF/i })).toHaveAttribute('href', '/split-pdf');
    expect(within(grid).getByRole('link', { name: /Extract Pages/i })).toHaveAttribute('href', '/extract-pages');
    expect(within(grid).getByRole('link', { name: /Reorder PDF/i })).toHaveAttribute('href', '/reorder-pdf');

    expect(screen.getByRole('heading', { level: 2, name: 'Why PDFlo' })).toBeInTheDocument();
    expect(screen.getByText('Your PDF files never leave your device.')).toBeInTheDocument();
  });
});
