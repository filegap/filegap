import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MergePdfPage } from './MergePdfPage';
import { mergePdfBuffers } from '../../adapters/pdfEngine';

vi.mock('../../adapters/pdfEngine', () => ({
  mergePdfBuffers: vi.fn(),
}));

describe('MergePdfPage', () => {
  it('renderizza il layout base della rotta merge', () => {
    render(<MergePdfPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Merge PDF' })
    ).toBeInTheDocument();
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('Why PDFlo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge PDF' })).toBeInTheDocument();
  });

  it('mostra validazione se si tenta merge con meno di 2 file', async () => {
    const user = userEvent.setup();
    render(<MergePdfPage />);

    await user.click(screen.getByRole('button', { name: 'Merge PDF' }));

    expect(screen.getByText('Select at least 2 PDF files to merge.')).toBeInTheDocument();
  });

  it('mostra feedback completato e CTA download dopo merge riuscito', async () => {
    const user = userEvent.setup();
    vi.mocked(mergePdfBuffers).mockResolvedValue(new Uint8Array([1, 2, 3]));

    render(<MergePdfPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File([new Uint8Array([2])], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    await user.click(screen.getByRole('button', { name: 'Merge PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Merge completato')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Merge PDF' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuovo merge' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scarica PDF' })).toBeInTheDocument();
  });

  it('apre la modale al click su Scarica PDF e conferma il download', async () => {
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
      expect(screen.getByRole('button', { name: 'Scarica PDF' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Scarica PDF' }));
    expect(screen.getByRole('button', { name: 'Continua al download' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continua al download' }));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });
});
