import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SplitPdfPage } from './SplitPdfPage';
import { splitPdfByRanges } from '../../adapters/pdfEngine';

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

    expect(screen.getByRole('heading', { level: 1, name: 'Split PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Split PDF' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('1-3,4-7,8-10')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Uploaded files' })).toBeInTheDocument();
    expect(screen.getByText('No files selected yet.')).toBeInTheDocument();
  });

  it('shows validation if splitting without selecting source file', async () => {
    const user = userEvent.setup();
    render(<SplitPdfPage />);

    await user.click(screen.getByRole('button', { name: 'Split PDF' }));

    expect(screen.getByText('Select a PDF file before splitting.')).toBeInTheDocument();
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

    await user.type(screen.getByPlaceholderText('1-3,4-7,8-10'), '1-2,3,4-4');
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

    await user.type(screen.getByPlaceholderText('1-3,4-7,8-10'), '1');
    await user.click(screen.getByRole('button', { name: 'Split PDF' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New split' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'New split' }));

    expect(screen.getByRole('button', { name: 'Split PDF' })).toBeInTheDocument();
    expect(screen.queryByText('Split completed')).not.toBeInTheDocument();
    expect(screen.getByText('No files selected yet.')).toBeInTheDocument();
  });
});
