import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SplitPdfPage } from './SplitPdfPage';
import { splitPdfByRanges } from '../../adapters/pdfEngine';
import { WorkflowBuilderPage } from '../workflow-builder/WorkflowBuilderPage';

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
  function renderSplitPage() {
    return render(
      <MemoryRouter initialEntries={['/split-pdf']}>
        <Routes>
          <Route path='/split-pdf' element={<SplitPdfPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders base split route layout', () => {
    renderSplitPage();

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
    renderSplitPage();

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

    renderSplitPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/PDF ready/i)).toBeInTheDocument();
    });

    const splitRangesInput = screen.getByPlaceholderText('1-3, 4, 5-10');
    fireEvent.change(splitRangesInput, { target: { value: '1-2,3,4-4' } });
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

  it('shows processing steps and updates CLI preview with split ranges', async () => {
    const user = userEvent.setup();
    renderSplitPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Processing steps' })).toBeInTheDocument();
    });

    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Split')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open in Workflow Builder' })).toBeInTheDocument();
    expect(screen.getByText('Run the same split step from your terminal.')).toBeInTheDocument();

    const rangesInput = screen.getByPlaceholderText('1-3, 4, 5-10');
    fireEvent.change(rangesInput, { target: { value: '1-2,3' } });
    await waitFor(() => {
      expect(rangesInput).toHaveValue('1-2,3');
    });

    await waitFor(() => {
      const codeBlocks = Array.from(document.querySelectorAll('code'));
      expect(
        codeBlocks.some((node) => node.textContent === 'filegap split "source.pdf" --pages "1-2,3" > output.zip')
      ).toBe(true);
    });
    expect(screen.getByRole('link', { name: 'Try the CLI →' })).toHaveAttribute('href', '/cli?example=split');
  });

  it('resets the split view when New split is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(splitPdfByRanges).mockResolvedValue([new Uint8Array([1])]);

    renderSplitPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/PDF ready/i)).toBeInTheDocument();
    });

    const splitRangesInput = screen.getByPlaceholderText('1-3, 4, 5-10');
    fireEvent.change(splitRangesInput, { target: { value: '1' } });
    await user.click(screen.getByRole('button', { name: 'Split PDF' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New split' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'New split' }));

    expect(screen.queryByRole('button', { name: 'Split PDF' })).not.toBeInTheDocument();
    expect(screen.queryByText('Split completed')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Define split ranges' })).not.toBeInTheDocument();
  });

  it('opens Workflow Builder with split draft, file, and current ranges', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/split-pdf']}>
        <Routes>
          <Route path='/split-pdf' element={<SplitPdfPage />} />
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Define split ranges' })).toBeInTheDocument();
    });

    const rangesInput = screen.getByPlaceholderText('1-3, 4, 5-10');
    fireEvent.change(rangesInput, { target: { value: '1-2,3' } });
    await waitFor(() => {
      expect(rangesInput).toHaveValue('1-2,3');
    });
    await user.click(screen.getByRole('button', { name: 'Open in Workflow Builder' }));

    expect(screen.getByRole('heading', { name: 'Build PDF workflow — fast, private, and local' })).toBeInTheDocument();
    expect(screen.getAllByText('source.pdf').length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByDisplayValue(/1-2,3/)).toBeInTheDocument();
    });
  });
});
