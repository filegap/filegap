import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OptimizePdfPage } from './OptimizePdfPage';
import { optimizePdfBuffer } from '../../adapters/pdfEngine';

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
    optimizePdfBuffer: vi.fn(),
  };
});

describe('OptimizePdfPage', () => {
  it('renders base optimize route layout', () => {
    render(<OptimizePdfPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Optimize PDF online — private, local, and fast' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Optimize PDF structure directly in your browser without uploading your file.')
    ).toBeInTheDocument();
    expect(screen.getByText('Processed locally on your device — no uploads')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Optimize PDF' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How to optimize a PDF' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Why use this Optimize PDF tool' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Optimize PDF online with local processing' })
    ).toBeInTheDocument();
  });

  it('shows size-limit fallback for large files', async () => {
    render(<OptimizePdfPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const oversized = new File([new Uint8Array(11 * 1024 * 1024)], 'big.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(input, { target: { files: [oversized] } });

    await waitFor(() => {
      expect(screen.getByText('Use desktop app for larger files')).toBeInTheDocument();
    });
    expect(screen.getAllByRole('link', { name: 'Download app' })[0]).toHaveAttribute('href', '/download');
    expect(screen.getAllByRole('link', { name: 'Try CLI' })[0]).toHaveAttribute('href', '/cli');
    expect(screen.queryByRole('heading', { level: 2, name: 'Optimize file' })).not.toBeInTheDocument();
  });

  it('optimizes a file and shows result state', async () => {
    const user = userEvent.setup();
    vi.mocked(optimizePdfBuffer).mockResolvedValue(new Uint8Array([1, 2, 3]));

    render(<OptimizePdfPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Optimize file' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Optimize PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Optimize completed')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New optimize' })).toBeInTheDocument();
  });
});
