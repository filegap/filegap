import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { MergePdfPage } from './MergePdfPage';
import { mergePdfBuffers } from '../../adapters/pdfEngine';
import { WorkflowBuilderPage } from '../workflow-builder/WorkflowBuilderPage';

vi.mock('../../adapters/pdfEngine', () => ({
  mergePdfBuffers: vi.fn(),
}));

function renderMergePage() {
  return render(
    <MemoryRouter initialEntries={['/merge-pdf']}>
      <Routes>
        <Route path='/merge-pdf' element={<MergePdfPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('MergePdfPage', () => {
  it('renders the base layout for merge route', () => {
    renderMergePage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Merge PDF files online — fast, private, and local' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Combine multiple PDF files into one document directly in your browser. No account required.')
    ).toBeInTheDocument();
    expect(screen.getByText('Processed locally on your device — no uploads')).toBeInTheDocument();
    expect(screen.getByText('How to merge PDF files')).toBeInTheDocument();
    expect(screen.getByText('Why use this Merge PDF tool')).toBeInTheDocument();
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
    expect(screen.getByText('Merge PDF files quickly and securely')).toBeInTheDocument();
    expect(screen.getByText('Ready to merge your PDFs?')).toBeInTheDocument();
    expect(screen.queryByText('Uploaded files')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Merge PDF' })).not.toBeInTheDocument();
    const mergeCtas = screen.getAllByRole('link', { name: 'Merge PDFs instantly' });
    expect(mergeCtas[mergeCtas.length - 1]).toHaveAttribute('href', '#merge-pdf-tool');
  });

  it('shows queued state and disabled CTA when less than 2 files are selected', () => {
    renderMergePage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA] } });

    expect(screen.getAllByText('1 PDF ready').length).toBeGreaterThan(0);
    expect(screen.getByText('Add at least 2 PDF files to merge.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge PDF' })).toBeDisabled();
  });

  it('shows compact process flow and workflow builder bridge after files are added', () => {
    renderMergePage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    expect(screen.getByRole('heading', { name: 'Processing steps' })).toBeInTheDocument();
    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Merge')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open in Workflow Builder' })).toBeInTheDocument();
    expect(screen.getByText('Runs locally on your files.')).toBeInTheDocument();
    expect(screen.getAllByText('2 PDFs ready').length).toBeGreaterThan(0);
    expect(screen.getByText('Ready to merge.')).toBeInTheDocument();
    expect(screen.getByText('Input files')).toBeInTheDocument();
    expect(screen.queryByText('Drag & drop PDF files')).not.toBeInTheDocument();
  });

  it('shows completed feedback and download CTA after successful merge', async () => {
    const user = userEvent.setup();
    vi.mocked(mergePdfBuffers).mockResolvedValue(new Uint8Array([1, 2, 3]));

    renderMergePage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    await user.click(screen.getByRole('button', { name: 'Merge PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Merge completed')).toBeInTheDocument();
    });

    expect(screen.getByText('Your merged PDF is ready. The local process finished on this device.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Merge PDF' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New merge' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
  });

  it('adds files to queue with subsequent selections', async () => {
    const user = userEvent.setup();
    renderMergePage();

    let input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'b.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [fileA] } });
    await user.click(screen.getByRole('button', { name: /add more/i }));
    input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fileB] } });

    const names = screen
      .getAllByTestId('uploaded-file-name')
      .map((node) => node.textContent?.trim());
    expect(names).toContain('a.pdf');
    expect(names).toContain('b.pdf');
    expect(screen.getAllByText(/KB/i).length).toBeGreaterThan(0);
  });

  it('removes a file from the queue', async () => {
    const user = userEvent.setup();
    renderMergePage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    await user.click(screen.getByRole('button', { name: 'Remove a.pdf' }));

    const names = screen
      .getAllByTestId('uploaded-file-name')
      .map((node) => node.textContent?.trim());
    expect(names).not.toContain('a.pdf');
    expect(names).toContain('b.pdf');
  });

  it('reorders files with drag and drop', () => {
    renderMergePage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });
    expect(screen.getByText('Drag rows to reorder')).toBeInTheDocument();

    const fileItems = screen.getAllByTestId('uploaded-file-row');
    fireEvent.dragStart(fileItems[0], { dataTransfer: {} });
    fireEvent.dragOver(fileItems[1], { dataTransfer: {} });
    fireEvent.drop(fileItems[1], { dataTransfer: {} });
    fireEvent.dragEnd(fileItems[0], { dataTransfer: {} });

    const names = screen
      .getAllByTestId('uploaded-file-name')
      .map((node) => node.textContent?.trim());
    expect(names[0]).toContain('b.pdf');
    expect(names[1]).toContain('a.pdf');
    expect(screen.getByText('Ready to merge.')).toBeInTheDocument();
  });

  it('opens modal on Download PDF click and confirms download', async () => {
    const user = userEvent.setup();
    vi.mocked(mergePdfBuffers).mockResolvedValue(new Uint8Array([1, 2, 3]));
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    renderMergePage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    await user.click(screen.getByRole('button', { name: 'Merge PDF' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(screen.getByText('Your PDF is ready')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    const modalDownloadButton = screen.getAllByRole('button', { name: 'Download PDF' })[1];

    await user.click(modalDownloadButton);
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('shows CLI preview connected to the same merge process', () => {
    renderMergePage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'alpha.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'beta.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    expect(screen.getByRole('heading', { name: 'CLI preview' })).toBeInTheDocument();
    expect(screen.getByText('Run the same merge from your terminal.')).toBeInTheDocument();
    expect(screen.getByText('filegap merge "alpha.pdf" "beta.pdf" > merged.pdf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try the CLI →' })).toHaveAttribute('href', '/cli?example=merge');
    expect(screen.getByRole('button', { name: 'Copy CLI command' })).toBeInTheDocument();
  });

  it('reopens the picker from compact state and can clear the queued files', async () => {
    const user = userEvent.setup();
    renderMergePage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'alpha.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'beta.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    await waitFor(() => {
      expect(screen.getByText('Input files')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add more/i }));
    expect(screen.getByText('Drag & drop PDF files')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide file picker' }));
    await waitFor(() => {
      expect(screen.getByText('Input files')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Clear files' }));
    expect(screen.queryByText('Input files')).not.toBeInTheDocument();
    expect(screen.getByText('Drag & drop PDF files')).toBeInTheDocument();
    expect(screen.queryByText('Uploaded files')).not.toBeInTheDocument();
  });

  it('opens Workflow Builder with merge draft and current files', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/merge-pdf']}>
        <Routes>
          <Route path='/merge-pdf' element={<MergePdfPage />} />
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'alpha.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'beta.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    await user.click(screen.getByRole('button', { name: 'Open in Workflow Builder' }));

    expect(screen.getByRole('heading', { name: 'Workflow Builder (Preview)' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Multiple PDFs')).toBeInTheDocument();
    expect(screen.getByText('Workflow imported locally. Review the flow and run it when ready.')).toBeInTheDocument();
    expect(screen.getByText('alpha.pdf')).toBeInTheDocument();
    expect(screen.getByText('beta.pdf')).toBeInTheDocument();
  });
});
