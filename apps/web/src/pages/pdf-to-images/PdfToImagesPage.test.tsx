import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { PdfToImagesPage } from './PdfToImagesPage';
import { renderPdfPagesToImages } from '../../lib/pdfImages';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPageCount: () => 2,
    }),
  },
}));

vi.mock('../../lib/pdfImages', () => ({
  renderPdfPagesToImages: vi.fn().mockImplementation(async (_bytes, _options, onProgress) => {
    onProgress?.(1, 2);
    onProgress?.(2, 2);
    return [
      {
        pageNumber: 1,
        filename: 'source-page-01.jpg',
        bytes: new Uint8Array([1, 2, 3]),
        width: 612,
        height: 792,
      },
      {
        pageNumber: 2,
        filename: 'source-page-02.jpg',
        bytes: new Uint8Array([4, 5, 6]),
        width: 612,
        height: 792,
      },
    ];
  }),
}));

describe('PdfToImagesPage', () => {
  function renderPdfToImagesPage() {
    return render(
      <MemoryRouter initialEntries={['/pdf-to-images']}>
        <Routes>
          <Route path='/pdf-to-images' element={<PdfToImagesPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders base route layout', () => {
    renderPdfToImagesPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Convert PDF to images — private, local, and fast' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Export every PDF page as a JPEG or PNG image directly in your browser.')
    ).toBeInTheDocument();
    expect(screen.getByText('Processed locally on your device — no uploads')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How to convert PDF pages to images' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Why use this PDF to images tool' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeInTheDocument();
  });

  it('converts a selected PDF into a ZIP output', async () => {
    const user = userEvent.setup();
    renderPdfToImagesPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Image export settings' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Convert to images' }));

    await waitFor(() => {
      expect(screen.getByText('Conversion completed')).toBeInTheDocument();
    });

    expect(renderPdfPagesToImages).toHaveBeenCalled();
    expect(screen.getByText('2 JPEG images are ready in one ZIP file.')).toBeInTheDocument();
    expect(screen.getByText('source-images.zip')).toBeInTheDocument();
    expect(screen.getByText('source-page-01.jpg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download ZIP' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New conversion' })).toBeInTheDocument();
  });
});
