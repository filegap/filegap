import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { CompressPdfPage } from './CompressPdfPage';
import { compressPdfBuffer } from '../../adapters/pdfEngine';
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
    compressPdfBuffer: vi.fn(),
  };
});

describe('CompressPdfPage', () => {
  function renderCompressPage() {
    return render(
      <MemoryRouter initialEntries={['/compress-pdf']}>
        <Routes>
          <Route path='/compress-pdf' element={<CompressPdfPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders base compress route layout', () => {
    renderCompressPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Compress PDF online — private, local, and fast' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Compress PDF files directly in your browser with privacy-first local processing.')
    ).toBeInTheDocument();
    expect(screen.getByText('Processed locally on your device — no uploads')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Compress PDF' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How to compress a PDF' })).toBeInTheDocument();
  });

  it('shows size-limit fallback for large files', async () => {
    renderCompressPage();

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
    expect(screen.queryByRole('heading', { level: 2, name: 'Compress file' })).not.toBeInTheDocument();
  });

  it('compresses a file and shows result state', async () => {
    const user = userEvent.setup();
    vi.mocked(compressPdfBuffer).mockResolvedValue(new Uint8Array([1, 2, 3]));

    renderCompressPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Compress file' })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Preset'), 'strong');
    await user.click(screen.getByRole('button', { name: 'Compress PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Compress completed')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New compress' })).toBeInTheDocument();
    expect(screen.getByText('Preset: Strong')).toBeInTheDocument();
  });

  it('shows processing steps and CLI preview after file selection', async () => {
    const user = userEvent.setup();
    renderCompressPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Processing steps' })).toBeInTheDocument();
    });

    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Compress')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open in Workflow Builder' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CLI preview' })).toBeInTheDocument();
    expect(screen.getByText('Run the same compression from your terminal.')).toBeInTheDocument();
    expect(screen.getByText('filegap compress "source.pdf" --preset balanced > source-compressed.pdf')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Preset'), 'strong');
    expect(screen.getByText('filegap compress "source.pdf" --preset strong > source-compressed.pdf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try the CLI →' })).toHaveAttribute('href', '/cli?example=compress');
  });

  it('opens Workflow Builder with compress draft, file, and preset', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/compress-pdf']}>
        <Routes>
          <Route path='/compress-pdf' element={<CompressPdfPage />} />
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Compress file' })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Preset'), 'strong');
    await user.click(screen.getByRole('button', { name: 'Open in Workflow Builder' }));

    expect(screen.getByRole('heading', { name: 'Workflow Builder (Preview)' })).toBeInTheDocument();
    expect(screen.getByText('source.pdf')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Strong')).toBeInTheDocument();
  });
});
