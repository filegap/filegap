import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractEmbeddedImages } from '../../adapters/pdfEngine';
import { ExtractImagesPage } from './ExtractImagesPage';

vi.mock('../../adapters/pdfEngine', async () => {
  const actual = await vi.importActual<typeof import('../../adapters/pdfEngine')>(
    '../../adapters/pdfEngine'
  );
  return {
    ...actual,
    extractEmbeddedImages: vi.fn(),
  };
});

const mockedExtractEmbeddedImages = vi.mocked(extractEmbeddedImages);

describe('ExtractImagesPage', () => {
  function renderExtractImagesPage() {
    return render(
      <MemoryRouter initialEntries={['/extract-images']}>
        <Routes>
          <Route path='/extract-images' element={<ExtractImagesPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    mockedExtractEmbeddedImages.mockResolvedValue([
      {
        filename: 'image-001.jpg',
        bytes: new Uint8Array([1, 2, 3]),
        format: 'jpeg',
      },
    ]);
  });

  it('renders base route layout', () => {
    renderExtractImagesPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Extract images from PDF — private and local' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Extract supported embedded JPEG and JPEG 2000 assets from a PDF directly in your browser.')
    ).toBeInTheDocument();
    expect(screen.getByText('Processed locally on your device — no uploads')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How to extract embedded images from a PDF' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Why use this embedded image extractor' })).toBeInTheDocument();
  });

  it('extracts supported embedded images into a ZIP output', async () => {
    const user = userEvent.setup();
    renderExtractImagesPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Embedded image extraction' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Extract images' }));

    await waitFor(() => {
      expect(screen.getByText('Extraction completed')).toBeInTheDocument();
    });

    expect(mockedExtractEmbeddedImages).toHaveBeenCalled();
    expect(screen.getByText('1 embedded image is ready in one ZIP file.')).toBeInTheDocument();
    expect(screen.getByText('source-embedded-images.zip')).toBeInTheDocument();
    expect(screen.getByText('image-001.jpg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download ZIP' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New extraction' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Download ZIP' }));
    expect(screen.getByText('Your image ZIP is ready')).toBeInTheDocument();
  });

  it('shows an empty result state when no supported images are found', async () => {
    const user = userEvent.setup();
    mockedExtractEmbeddedImages.mockRejectedValue(new Error('No supported embedded images found.'));
    renderExtractImagesPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await user.click(await screen.findByRole('button', { name: 'Extract images' }));

    await waitFor(() => {
      expect(screen.getAllByText('No supported embedded images were found in this PDF.').length).toBeGreaterThan(0);
    });
  });
});
