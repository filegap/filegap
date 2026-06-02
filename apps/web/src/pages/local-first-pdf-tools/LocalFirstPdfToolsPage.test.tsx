import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LocalFirstPdfToolsPage } from './LocalFirstPdfToolsPage';

describe('LocalFirstPdfToolsPage', () => {
  it('renders indexable local-first content with required links and canonical metadata', async () => {
    render(<LocalFirstPdfToolsPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Local-first PDF tools that keep your files on your device',
      })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /^Merge PDFs/ })).toHaveAttribute('href', '/merge-pdf');
    expect(screen.getByRole('link', { name: /^Split PDFs/ })).toHaveAttribute('href', '/split-pdf');
    expect(screen.getByRole('link', { name: /^Compress PDFs/ })).toHaveAttribute('href', '/compress-pdf');
    expect(screen.getByRole('link', { name: /^Convert PDF to JPG/ })).toHaveAttribute('href', '/pdf-to-jpg');
    expect(screen.getByRole('link', { name: /^Extract pages/ })).toHaveAttribute('href', '/extract-pages-from-pdf');
    expect(screen.getByRole('link', { name: /^Reorder pages/ })).toHaveAttribute('href', '/reorder-pdf-pages');
    expect(screen.getByRole('link', { name: 'Understand upload risks' })).toHaveAttribute(
      'href',
      '/why-uploading-pdfs-is-a-privacy-risk'
    );

    expect(screen.getByRole('heading', { level: 2, name: 'What local-first means for PDF work' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeInTheDocument();
    expect(screen.getByText('What does local-first mean for PDF tools?')).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('Local-First PDF Tools - Private PDF Editing With No Upload | Filegap');
      expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
        'content',
        'Use local-first PDF tools that process files directly in your browser. Merge, split, compress and convert PDFs privately with no uploads and no account.'
      );
      expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://www.filegap.app/local-first-pdf-tools'
      );
      expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    });
  });
});
