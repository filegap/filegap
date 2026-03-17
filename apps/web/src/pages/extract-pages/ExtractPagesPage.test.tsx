import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ExtractPagesPage } from './ExtractPagesPage';
import { extractPdfByRanges } from '../../adapters/pdfEngine';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPageCount: () => 5,
    }),
  },
}));

vi.mock('../../adapters/pdfEngine', async () => {
  const actual = await vi.importActual<typeof import('../../adapters/pdfEngine')>(
    '../../adapters/pdfEngine'
  );
  return {
    ...actual,
    extractPdfByRanges: vi.fn(),
  };
});

describe('ExtractPagesPage', () => {
  it('renders base extract route layout', () => {
    render(<ExtractPagesPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Extract PDF pages online — fast, private, and local' })
    ).toBeInTheDocument();
    expect(screen.getByText('Free • No signup • Works in your browser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extract pages' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('1-3,5,7-9')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Uploaded files' })).toBeInTheDocument();
    expect(screen.getByText('No files selected yet.')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'How to extract pages from a PDF' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Why use this Extract Pages tool' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Extract PDF pages quickly and securely' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Ready to extract your pages?' })).toBeInTheDocument();
    const extractCtas = screen.getAllByRole('link', { name: 'Extract pages instantly' });
    expect(extractCtas[extractCtas.length - 1]).toHaveAttribute('href', '#extract-pdf-tool');
  });

  it('shows validation if extracting without selecting source file', async () => {
    const user = userEvent.setup();
    render(<ExtractPagesPage />);

    await user.click(screen.getByRole('button', { name: 'Extract pages' }));

    expect(screen.getByText('Select a PDF file before extracting pages.')).toBeInTheDocument();
  });

  it('extracts pages and shows result state with new extract action', async () => {
    const user = userEvent.setup();
    vi.mocked(extractPdfByRanges).mockResolvedValue(new Uint8Array([1, 2, 3]));

    render(<ExtractPagesPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/PDF ready/i)).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('1-3,5,7-9'), '1-2,4');
    await user.click(screen.getByRole('button', { name: 'Extract pages' }));

    await waitFor(() => {
      expect(screen.getByText('Extract completed')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Extract pages' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New extract' })).toBeInTheDocument();
    expect(screen.getByText('Pages 1-2,4')).toBeInTheDocument();
  });
});
