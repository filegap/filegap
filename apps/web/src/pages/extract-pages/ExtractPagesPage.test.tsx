import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ExtractPagesPage } from './ExtractPagesPage';
import { extractPdfByRanges } from '../../adapters/pdfEngine';
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
  function renderExtractPage() {
    return render(
      <MemoryRouter initialEntries={['/extract-pages']}>
        <Routes>
          <Route path='/extract-pages' element={<ExtractPagesPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders base extract route layout', () => {
    renderExtractPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Extract PDF pages online — fast, private, and local' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Extract pages from PDF files directly in your browser. No account required.')
    ).toBeInTheDocument();
    expect(screen.getByText('Processed locally on your device — no uploads')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Extract pages' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Page range')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'How to extract pages from a PDF' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Why use this Extract Pages tool' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Extract PDF pages quickly and securely' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Ready to extract your pages?' })).toBeInTheDocument();
    expect(screen.getByText('Can I extract PDF pages without uploading the file?')).toBeInTheDocument();
    expect(screen.getByText('Can I keep only certain pages from a PDF?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'split PDF files' })).toHaveAttribute('href', '/split-pdf');
    expect(screen.getByRole('link', { name: 'reorder PDF pages' })).toHaveAttribute('href', '/reorder-pdf');
    const extractCtas = screen.getAllByRole('link', { name: 'Extract pages now' });
    expect(extractCtas[extractCtas.length - 1]).toHaveAttribute('href', '#extract-pdf-tool');
  });

  it('keeps the extract controls hidden until a source file is selected', () => {
    renderExtractPage();

    expect(screen.queryByRole('heading', { level: 2, name: 'Select pages to extract' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Extract pages' })).not.toBeInTheDocument();
  });

  it('extracts pages and shows result state with new extract action', async () => {
    const user = userEvent.setup();
    vi.mocked(extractPdfByRanges).mockResolvedValue(new Uint8Array([1, 2, 3]));

    renderExtractPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/PDF ready/i)).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('1-3, 5, 7-9'), '1-2,4');
    await user.click(screen.getByRole('button', { name: 'Extract pages' }));

    await waitFor(() => {
      expect(screen.getByText('Extract completed')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Extract pages' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New extract' })).toBeInTheDocument();
    expect(screen.getByText('Pages 1-2,4')).toBeInTheDocument();
  });

  it('syncs thumbnail selection back into the range input', async () => {
    const user = userEvent.setup();
    renderExtractPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Select page 2' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Show file picker' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Select page 2' }));
    await user.click(screen.getByRole('button', { name: 'Select page 3' }));

    expect(screen.getByPlaceholderText('1-3, 5, 7-9')).toHaveValue('2-3');
    expect(screen.getByText('2 pages selected')).toBeInTheDocument();
  });

  it('collapses the upload area into a compact input summary after file selection', async () => {
    renderExtractPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Input file')).toBeInTheDocument();
    });

    expect(screen.getByText('source.pdf')).toBeInTheDocument();
    expect(screen.getByText('1 KB • 5 pages')).toBeInTheDocument();
    expect(screen.queryByText('Drag & drop PDF files')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Processing steps' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CLI preview' })).toBeInTheDocument();
    expect(screen.getByText('filegap extract "source.pdf" --pages "1-3" > source-extracted.pdf')).toBeInTheDocument();
  });

  it('reopens the upload flow when Replace is clicked and resets when Remove is clicked', async () => {
    const user = userEvent.setup();
    renderExtractPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Input file')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Show file picker' }));
    expect(screen.getByText('Drag & drop PDF files')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide file picker' }));
    await waitFor(() => {
      expect(screen.getByText('Input file')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Remove file' }));
    expect(screen.queryByText('Input file')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Select pages to extract' })).not.toBeInTheDocument();
    expect(screen.getByText('Drag & drop PDF files')).toBeInTheDocument();
  });

  it('applies typed ranges automatically to the page selection', async () => {
    const user = userEvent.setup();
    renderExtractPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Select page 1' })).toBeInTheDocument();
    });

    const rangesInput = screen.getByPlaceholderText('1-3, 5, 7-9');
    await user.clear(rangesInput);
    await user.type(rangesInput, '1,3');

    expect(screen.getByRole('button', { name: 'Select page 1' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Select page 2' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Select page 3' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens Workflow Builder with extract draft, file, and current ranges', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/extract-pages']}>
        <Routes>
          <Route path='/extract-pages' element={<ExtractPagesPage />} />
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Select pages to extract' })).toBeInTheDocument();
    });

    const rangesInput = screen.getByPlaceholderText('1-3, 5, 7-9');
    await user.clear(rangesInput);
    await user.type(rangesInput, '1-2,4');
    await user.click(screen.getByRole('button', { name: 'Open in Workflow Builder' }));

    expect(screen.getByRole('heading', { name: 'Workflow Builder (Preview)' })).toBeInTheDocument();
    expect(screen.getByText('source.pdf')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1-2,4')).toBeInTheDocument();
  });

  it('shows processing steps and updates CLI preview with typed ranges', async () => {
    const user = userEvent.setup();
    renderExtractPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Processing steps' })).toBeInTheDocument();
    });

    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Extract')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open in Workflow Builder' })).toBeInTheDocument();
    expect(screen.getByText('Run the same extract step from your terminal.')).toBeInTheDocument();

    const rangesInput = screen.getByPlaceholderText('1-3, 5, 7-9');
    await user.clear(rangesInput);
    await user.type(rangesInput, '2-3');

    expect(screen.getByText('filegap extract "source.pdf" --pages "2-3" > source-extracted.pdf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try the CLI →' })).toHaveAttribute('href', '/cli?example=extract');
  });
});
