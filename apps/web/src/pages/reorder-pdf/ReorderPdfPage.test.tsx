import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ReorderPdfPage } from './ReorderPdfPage';
import { reorderPdfPages } from '../../adapters/pdfEngine';
import { WorkflowBuilderPage } from '../workflow-builder/WorkflowBuilderPage';

vi.mock('../../lib/pdfPreview', () => ({
  renderPdfThumbnails: vi.fn().mockResolvedValue([
    { pageNumber: 1, imageDataUrl: 'data:image/jpeg;base64,page-1' },
    { pageNumber: 2, imageDataUrl: 'data:image/jpeg;base64,page-2' },
    { pageNumber: 3, imageDataUrl: 'data:image/jpeg;base64,page-3' },
    { pageNumber: 4, imageDataUrl: 'data:image/jpeg;base64,page-4' },
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
    reorderPdfPages: vi.fn(),
  };
});

describe('ReorderPdfPage', () => {
  function renderReorderPage() {
    return render(
      <MemoryRouter initialEntries={['/reorder-pdf']}>
        <Routes>
          <Route path='/reorder-pdf' element={<ReorderPdfPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders base reorder route layout', () => {
    renderReorderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Reorder PDF pages online — fast, private, and local' })
    ).toBeInTheDocument();
    expect(screen.getByText('Reorder PDF pages directly in your browser. No account required.')).toBeInTheDocument();
    expect(screen.getByText('Processed locally on your device — no uploads')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reorder PDF' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Page order')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How to reorder PDF pages' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Why use this Reorder PDF tool' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Reorder PDF pages quickly and securely' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Ready to reorder your PDF?' })).toBeInTheDocument();
    expect(screen.getByText('Can I reorder PDF pages without uploading my file?')).toBeInTheDocument();
    expect(screen.getByText('Can I change the page order in a PDF?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'extract pages' })).toHaveAttribute('href', '/extract-pages');
    expect(screen.getByRole('link', { name: 'split PDF files' })).toHaveAttribute('href', '/split-pdf');
    const reorderCtas = screen.getAllByRole('link', { name: 'Reorder PDF pages now' });
    expect(reorderCtas[reorderCtas.length - 1]).toHaveAttribute('href', '#reorder-pdf-tool');
  });

  it('keeps reorder controls hidden until a source file is selected', () => {
    renderReorderPage();

    expect(screen.queryByRole('heading', { level: 2, name: 'Set page order' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reorder PDF' })).not.toBeInTheDocument();
  });

  it('reorders pages and shows result state', async () => {
    const user = userEvent.setup();
    vi.mocked(reorderPdfPages).mockResolvedValue(new Uint8Array([1, 2, 3]));

    renderReorderPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Set page order' })).toBeInTheDocument();
    });

    const orderInput = screen.getByPlaceholderText('3, 1, 2, 4-6');
    await user.clear(orderInput);
    await user.type(orderInput, '2,1,3,4');
    await user.click(screen.getByRole('button', { name: 'Reorder PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Reorder completed')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Reorder PDF' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New reorder' })).toBeInTheDocument();
    expect(screen.getByText('Order 2,1,3,4')).toBeInTheDocument();
  });

  it('shows processing steps and updates CLI preview with page order', async () => {
    const user = userEvent.setup();
    renderReorderPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Processing steps' })).toBeInTheDocument();
    });

    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Reorder')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open in Workflow Builder' })).toBeInTheDocument();
    expect(screen.getByText('Run the same reorder step from your terminal.')).toBeInTheDocument();

    const orderInput = screen.getByPlaceholderText('3, 1, 2, 4-6');
    await user.clear(orderInput);
    await user.type(orderInput, '2,1,3,4');

    expect(screen.getByText('filegap reorder "source.pdf" --pages "2,1,3,4" > source-reordered.pdf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try the CLI →' })).toHaveAttribute('href', '/cli?example=reorder');
  });

  it('opens Workflow Builder with reorder draft, file, and current order', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/reorder-pdf']}>
        <Routes>
          <Route path='/reorder-pdf' element={<ReorderPdfPage />} />
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Set page order' })).toBeInTheDocument();
    });

    const orderInput = screen.getByPlaceholderText('3, 1, 2, 4-6');
    await user.clear(orderInput);
    await user.type(orderInput, '2,1,3,4');
    await user.click(screen.getByRole('button', { name: 'Open in Workflow Builder' }));

    expect(screen.getByRole('heading', { name: 'Build PDF workflow — fast, private, and local' })).toBeInTheDocument();
    expect(screen.getAllByText('source.pdf').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('2,1,3,4')).toBeInTheDocument();
  });
});
