import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SplitPdfPage } from './SplitPdfPage';
import { splitPdfByRanges } from '../../adapters/pdfEngine';

vi.mock('../../lib/pdfPreview', () => ({
  renderPdfThumbnails: vi.fn().mockResolvedValue([
    { pageNumber: 1, imageDataUrl: 'data:image/jpeg;base64,page-1' },
    { pageNumber: 2, imageDataUrl: 'data:image/jpeg;base64,page-2' },
    { pageNumber: 3, imageDataUrl: 'data:image/jpeg;base64,page-3' },
  ]),
}));

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPageCount: () => 4,
    }),
  },
}));

vi.mock('../../adapters/pdfEngine', async () => {
  const actual = await vi.importActual<typeof import('../../adapters/pdfEngine')>(
    '../../adapters/pdfEngine'
  );
  return {
    ...actual,
    splitPdfByRanges: vi.fn(),
  };
});

describe('SplitPdfPage', () => {
  it('renders base split route layout', () => {
    render(<SplitPdfPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Split PDF files online — fast, private, and local' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Split PDF files into multiple documents directly in your browser. No account required.')
    ).toBeInTheDocument();
    expect(screen.getByText('Processed locally on your device — no uploads')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Split PDF' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Split ranges')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How to split PDF files' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Why use this Split PDF tool' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Split PDF files quickly and securely' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Ready to split your PDF?' })).toBeInTheDocument();
    expect(screen.getByText('Can I split a PDF without uploading it?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'merge PDF files' })).toHaveAttribute('href', '/merge-pdf');
    expect(screen.getByRole('link', { name: 'extract specific pages' })).toHaveAttribute('href', '/extract-pages');
    const splitCtas = screen.getAllByRole('link', { name: 'Split your PDF now' });
    expect(splitCtas[splitCtas.length - 1]).toHaveAttribute('href', '#split-pdf-tool');
  });

  it('keeps split controls hidden until a source file is selected', () => {
    render(<SplitPdfPage />);

    expect(screen.queryByRole('heading', { level: 2, name: 'Define split ranges' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Split PDF' })).not.toBeInTheDocument();
  });

  it('splits file and renders output downloads', async () => {
    const user = userEvent.setup();
    vi.mocked(splitPdfByRanges).mockResolvedValue([
      new Uint8Array([1]),
      new Uint8Array([2]),
      new Uint8Array([3]),
    ]);

    render(<SplitPdfPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/PDF ready/i)).toBeInTheDocument();
    });

    const splitRangesInput = screen.getByPlaceholderText('1-3, 4, 5-10');
    await user.clear(splitRangesInput);
    await user.type(splitRangesInput, '1-2,3,4-4');
    await user.click(screen.getByRole('button', { name: 'Split PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Split completed')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Download all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New split' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Split PDF' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Download' })).toHaveLength(3);
    expect(screen.getByText('Pages 3')).toBeInTheDocument();
  });

  it('resets the split view when New split is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(splitPdfByRanges).mockResolvedValue([new Uint8Array([1])]);

    render(<SplitPdfPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/PDF ready/i)).toBeInTheDocument();
    });

    const splitRangesInput = screen.getByPlaceholderText('1-3, 4, 5-10');
    await user.clear(splitRangesInput);
    await user.type(splitRangesInput, '1');
    await user.click(screen.getByRole('button', { name: 'Split PDF' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New split' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'New split' }));

    expect(screen.queryByRole('button', { name: 'Split PDF' })).not.toBeInTheDocument();
    expect(screen.queryByText('Split completed')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Define split ranges' })).not.toBeInTheDocument();
  });
});
