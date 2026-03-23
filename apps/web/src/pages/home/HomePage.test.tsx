import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders hero, tool grid, why section, faq section, seo section, and final cta', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Edit PDF files online\s*No uploads\. No accounts\./ })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Merge, split, and edit PDF files directly in your browser')
    ).toBeInTheDocument();
    expect(screen.getByText('Everything runs locally')).toBeInTheDocument();

    const mergeCtas = screen.getAllByRole('link', { name: 'Merge PDFs instantly' });
    expect(mergeCtas[0]).toHaveAttribute('href', '/merge-pdf');
    expect(
      screen.getByText('Processed locally on your device — no uploads')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open source on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/filegap/filegap'
    );
    expect(
      screen.getByText((_, element) => element?.textContent === 'Use the CLI or download the app')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'CLI' })[0]).toHaveAttribute('href', '/cli');
    expect(screen.getByRole('link', { name: 'download the app' })).toHaveAttribute(
      'href',
      '/download'
    );
    expect(screen.getByText('Works in all modern browsers')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'More ways to use Filegap' })).toBeInTheDocument();
    expect(screen.getByText('Use Filegap from your terminal')).toBeInTheDocument();
    expect(
      screen.getByText('Run PDF tools directly via CLI — fast, scriptable, private.')
    ).toBeInTheDocument();
    expect(screen.getByText('Go to CLI').closest('a')).toHaveAttribute('href', '/cli');
    expect(screen.getByText('Download the desktop app')).toBeInTheDocument();
    expect(
      screen.getByText('Process files locally without a browser — fully offline.')
    ).toBeInTheDocument();
    expect(screen.getByText('Download app').closest('a')).toHaveAttribute('href', '/download');

    const grid = screen.getByTestId('home-tool-grid');
    expect(within(grid).getByRole('link', { name: /Merge PDF/i })).toHaveAttribute('href', '/merge-pdf');
    expect(within(grid).getByRole('link', { name: /Split PDF/i })).toHaveAttribute('href', '/split-pdf');
    expect(within(grid).getByRole('link', { name: /Extract Pages/i })).toHaveAttribute('href', '/extract-pages');
    expect(within(grid).getByRole('link', { name: /Reorder PDF/i })).toHaveAttribute('href', '/reorder-pdf');
    expect(within(grid).getByText('Merge PDFs')).toBeInTheDocument();
    expect(within(grid).getAllByText('Split PDF')).toHaveLength(2);
    expect(within(grid).getByText('Extract pages')).toBeInTheDocument();
    expect(within(grid).getByText('Reorder pages')).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Why Filegap' })).toBeInTheDocument();
    expect(screen.getByText('100% local processing')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your PDF files are processed directly in your browser. They are never uploaded to any server.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('No accounts, no file tracking')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Use all tools instantly without signing up. We only track high-level tool usage and never your files.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Fast and lightweight')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No uploads, no waiting. Everything runs locally for maximum speed and responsiveness.'
      )
    ).toBeInTheDocument();

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
        'Unlike most PDF tools, Filegap does not send your files to a server. All processing happens locally on your device, making it a safer choice if you need to handle sensitive documents.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Whether you need to combine PDF files into one document, split large PDFs into smaller files, or extract only specific pages, Filegap lets you do it quickly and securely — directly in your browser, with no signup required.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'merge PDF files' })).toHaveAttribute('href', '/merge-pdf');
    expect(screen.getByRole('link', { name: 'split PDF documents' })).toHaveAttribute('href', '/split-pdf');
    expect(screen.getByRole('link', { name: 'extract pages' })).toHaveAttribute('href', '/extract-pages');
    expect(screen.getByRole('link', { name: 'reorder pages' })).toHaveAttribute('href', '/reorder-pdf');

    expect(screen.getByRole('heading', { level: 2, name: 'Ready to edit your PDFs privately?' })).toBeInTheDocument();
    expect(
      screen.getByText('Start using Filegap directly in your browser — no uploads, no signup.')
    ).toBeInTheDocument();
    expect(mergeCtas).toHaveLength(2);
    expect(mergeCtas[1]).toHaveAttribute('href', '/merge-pdf');
  });
});
