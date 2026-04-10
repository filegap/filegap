import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { OptimizePdfPage } from './OptimizePdfPage';
import { optimizePdfBuffer } from '../../adapters/pdfEngine';
import { WorkflowBuilderPage } from '../workflow-builder/WorkflowBuilderPage';

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
  function renderOptimizePage() {
    return render(
      <MemoryRouter initialEntries={['/optimize-pdf']}>
        <Routes>
          <Route path='/optimize-pdf' element={<OptimizePdfPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders base optimize route layout', () => {
    renderOptimizePage();

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
    renderOptimizePage();

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

    renderOptimizePage();

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

  it('shows processing steps and CLI preview after file selection', async () => {
    renderOptimizePage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Processing steps' })).toBeInTheDocument();
    });

    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Optimize')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open in Workflow Builder' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CLI preview' })).toBeInTheDocument();
    expect(screen.getByText('Run the same optimize step from your terminal.')).toBeInTheDocument();
    expect(screen.getByText('filegap optimize "source.pdf" > source-optimized.pdf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try the CLI →' })).toHaveAttribute('href', '/cli?example=optimize');
  });

  it('opens Workflow Builder with optimize draft and file', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/optimize-pdf']}>
        <Routes>
          <Route path='/optimize-pdf' element={<OptimizePdfPage />} />
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open in Workflow Builder' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Open in Workflow Builder' }));

    expect(screen.getByRole('heading', { name: 'Workflow Builder (Preview)' })).toBeInTheDocument();
    expect(screen.getByText('Workflow imported locally. Review the flow and run it when ready.')).toBeInTheDocument();
    expect(screen.getByText('source.pdf')).toBeInTheDocument();
    expect(screen.getByText(/filegap optimize/)).toBeInTheDocument();
  });
});
