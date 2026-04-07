import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders hero, tool grid, why section, faq section, seo section, and final cta', () => {
    render(<HomePage />);

    const heroPrimaryCtas = screen.getAllByRole('link', { name: /Start with / });
    const heroPrimaryCta = heroPrimaryCtas[0];
    expect(heroPrimaryCta).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/(merge-pdf|split-pdf|extract-pages|reorder-pdf|optimize-pdf)$/)
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Edit PDFs locally — fast and private' })
    ).toBeInTheDocument();
    expect(screen.getByText('Merge, split, and edit PDFs directly in your browser.')).toBeInTheDocument();
    expect(screen.getByText('No uploads. No accounts.')).toBeInTheDocument();
    expect(screen.getByText('Processed locally on your device — no uploads')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open source on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/filegap/filegap'
    );
    expect(
      screen.getByText((_, element) => element?.textContent === 'Need more control? Try the CLI or download the app.')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'CLI' })[0]).toHaveAttribute('href', '/cli');
    expect(screen.getByRole('link', { name: 'download the app' })).toHaveAttribute(
      'href',
      '/download'
    );
    expect(screen.getByRole('link', { name: 'See all tools' })).toHaveAttribute('href', '#home-tool-grid');
    expect(screen.getByRole('heading', { level: 2, name: 'Use Filegap your way' })).toBeInTheDocument();
    expect(screen.getByText('Use Filegap from your terminal')).toBeInTheDocument();
    expect(
      screen.getByText('Run PDF tools directly via CLI — fast, scriptable, private.')
    ).toBeInTheDocument();
    expect(screen.getByText('Use the CLI').closest('a')).toHaveAttribute('href', '/cli');
    expect(screen.getByText('Download the desktop app')).toBeInTheDocument();
    expect(
      screen.getByText('Process files locally without a browser — fully offline.')
    ).toBeInTheDocument();
    expect(screen.getByText('Download the app').closest('a')).toHaveAttribute('href', '/download');

    const grid = screen.getByTestId('home-tool-grid');
    expect(within(grid).getByRole('link', { name: /Merge PDF/i })).toHaveAttribute('href', '/merge-pdf');
    expect(within(grid).getByRole('link', { name: /Split PDF/i })).toHaveAttribute('href', '/split-pdf');
    expect(within(grid).getByRole('link', { name: /Extract Pages/i })).toHaveAttribute('href', '/extract-pages');
    expect(within(grid).getByRole('link', { name: /Reorder PDF/i })).toHaveAttribute('href', '/reorder-pdf');
    expect(within(grid).getByRole('link', { name: /Optimize PDF/i })).toHaveAttribute('href', '/optimize-pdf');
    expect(within(grid).getByText('Merge PDFs')).toBeInTheDocument();
    expect(within(grid).getAllByText('Split PDF')).toHaveLength(2);
    expect(within(grid).getByText('Extract pages')).toBeInTheDocument();
    expect(within(grid).getByText('Reorder pages')).toBeInTheDocument();
    expect(within(grid).getAllByText('Optimize PDF')).toHaveLength(2);
    expect(within(grid).getByText('Combine multiple PDFs into one — fast and private.')).toBeInTheDocument();
    expect(within(grid).getByText('Split a PDF into smaller files — no uploads required.')).toBeInTheDocument();
    expect(within(grid).getByText('Extract only the pages you need from a PDF.')).toBeInTheDocument();
    expect(within(grid).getByText('Rearrange PDF pages and export a new file in seconds.')).toBeInTheDocument();
    expect(
      within(grid).getByText('Optimize PDF structure for leaner files without intentional quality loss.')
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Why Filegap' })).toBeInTheDocument();
    expect(screen.getByText('Local processing')).toBeInTheDocument();
    expect(screen.getByText('Your PDF files stay on your device while you edit them.')).toBeInTheDocument();
    expect(screen.getByText('No tracking')).toBeInTheDocument();
    expect(screen.getByText('No account is needed, and your files are not tracked.')).toBeInTheDocument();
    expect(screen.getByText('Fast & lightweight')).toBeInTheDocument();
    expect(screen.getByText('Quick tools with less waiting and a cleaner workflow.')).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeInTheDocument();
    expect(screen.getByText('Is Filegap really private?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Yes. All PDF processing happens locally in your browser. Your files are never uploaded to any server.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Are my files uploaded anywhere?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No. Your files stay on your device and are processed locally using your browser.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Do I need to create an account?')).toBeInTheDocument();
    expect(screen.getByText('No. You can use all tools instantly without signing up.')).toBeInTheDocument();
    expect(screen.getByText('Is Filegap free to use?')).toBeInTheDocument();
    expect(screen.getByText('Yes. All core PDF tools are free to use with no hidden limits.')).toBeInTheDocument();
    expect(screen.getByText('Does Filegap work offline?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Yes, in most cases. Once loaded, the tools can run locally without needing a constant internet connection.'
      )
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Simple and private PDF tools' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'The interface stays simple, so you can get in, make the change you need, and export the result without extra steps.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Whether you are combining files, splitting long documents, or fixing page order, Filegap keeps the workflow quick and easy to scan.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'merge PDF files' })).toHaveAttribute('href', '/merge-pdf');
    expect(screen.getByRole('link', { name: 'split PDF documents' })).toHaveAttribute('href', '/split-pdf');
    expect(screen.getByRole('link', { name: 'extract pages' })).toHaveAttribute('href', '/extract-pages');
    expect(screen.getByRole('link', { name: 'reorder pages' })).toHaveAttribute('href', '/reorder-pdf');
    expect(screen.getByRole('link', { name: 'optimize PDF files' })).toHaveAttribute('href', '/optimize-pdf');

    expect(screen.getByRole('heading', { level: 2, name: 'Ready to edit your PDFs privately?' })).toBeInTheDocument();
    expect(
      screen.getByText('Start using Filegap directly in your browser — no uploads, no signup.')
    ).toBeInTheDocument();
    expect(heroPrimaryCtas).toHaveLength(2);
    expect(heroPrimaryCtas[1]).toHaveAttribute(
      'href',
      heroPrimaryCta.getAttribute('href')
    );
  });
});
