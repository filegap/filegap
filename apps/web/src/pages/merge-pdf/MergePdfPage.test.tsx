import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MergePdfPage } from './MergePdfPage';
import { mergePdfBuffers } from '../../adapters/pdfEngine';

vi.mock('../../adapters/pdfEngine', () => ({
  mergePdfBuffers: vi.fn(),
}));

describe('MergePdfPage', () => {
  it('renders the base layout for merge route', () => {
    render(<MergePdfPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Merge PDF files online — fast, private, and local' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Combine multiple PDF files into one document directly in your browser. No uploads. No accounts. Your files never leave your device.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Processed locally on your device — no uploads')).toBeInTheDocument();
    expect(screen.getByText('How to merge PDF files')).toBeInTheDocument();
    expect(screen.getByText('Why use this Merge PDF tool')).toBeInTheDocument();
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
    expect(screen.getByText('Merge PDF files quickly and securely')).toBeInTheDocument();
    expect(screen.getByText('Ready to merge your PDFs?')).toBeInTheDocument();
    const mergeCtas = screen.getAllByRole('link', { name: 'Merge PDFs instantly' });
    expect(mergeCtas[mergeCtas.length - 1]).toHaveAttribute('href', '#merge-pdf-tool');
    expect(screen.getByRole('button', { name: 'Merge PDF' })).toBeInTheDocument();
  });

  it('shows validation if merge starts with less than 2 files', async () => {
    const user = userEvent.setup();
    render(<MergePdfPage />);

    await user.click(screen.getByRole('button', { name: 'Merge PDF' }));

    expect(screen.getByText('Add PDF files to start.')).toBeInTheDocument();
  });

  it('shows completed feedback and download CTA after successful merge', async () => {
    const user = userEvent.setup();
    vi.mocked(mergePdfBuffers).mockResolvedValue(new Uint8Array([1, 2, 3]));

    render(<MergePdfPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    await user.click(screen.getByRole('button', { name: 'Merge PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Merge completed')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Merge PDF' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New merge' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
  });

  it('adds files to queue with subsequent selections', () => {
    render(<MergePdfPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'b.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [fileA] } });
    fireEvent.change(input, { target: { files: [fileB] } });

    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    expect(screen.getByText('b.pdf')).toBeInTheDocument();
    expect(screen.getAllByText(/KB/i).length).toBeGreaterThan(0);
  });

  it('removes a file from the queue', async () => {
    const user = userEvent.setup();
    render(<MergePdfPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    await user.click(screen.getByRole('button', { name: 'Remove a.pdf' }));

    expect(screen.queryByText(/a\.pdf/i)).not.toBeInTheDocument();
    const names = screen
      .getAllByTestId('uploaded-file-name')
      .map((node) => node.textContent?.trim());
    expect(names).toContain('b.pdf');
  });

  it('reorders files with drag and drop', () => {
    render(<MergePdfPage />);

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
    expect(screen.getByText('File order updated.')).toBeInTheDocument();
  });

  it('opens modal on Download PDF click and confirms download', async () => {
    const user = userEvent.setup();
    vi.mocked(mergePdfBuffers).mockResolvedValue(new Uint8Array([1, 2, 3]));
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<MergePdfPage />);

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
});
