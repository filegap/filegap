import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ReorderPdfPage } from './ReorderPdfPage';
import { reorderPdfPages } from '../../adapters/pdfEngine';

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
    reorderPdfPages: vi.fn(),
  };
});

describe('ReorderPdfPage', () => {
  it('renders base reorder route layout', () => {
    render(<ReorderPdfPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Reorder PDF Pages' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reorder PDF' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('3,1,2,4-6')).toBeInTheDocument();
    expect(screen.getByText('No files selected yet.')).toBeInTheDocument();
  });

  it('shows validation if reorder starts without selecting source file', async () => {
    const user = userEvent.setup();
    render(<ReorderPdfPage />);

    await user.click(screen.getByRole('button', { name: 'Reorder PDF' }));

    expect(screen.getByText('Select a PDF file before reordering pages.')).toBeInTheDocument();
  });

  it('reorders pages and shows result state', async () => {
    const user = userEvent.setup();
    vi.mocked(reorderPdfPages).mockResolvedValue(new Uint8Array([1, 2, 3]));

    render(<ReorderPdfPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/PDF ready/i)).toBeInTheDocument();
    });

    const orderInput = screen.getByPlaceholderText('3,1,2,4-6');
    fireEvent.change(orderInput, { target: { value: '2,1,3,4' } });
    await user.click(screen.getByRole('button', { name: 'Reorder PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Reorder completed')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Reorder PDF' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New reorder' })).toBeInTheDocument();
    expect(screen.getByText('Order 2,1,3,4')).toBeInTheDocument();
  });
});
