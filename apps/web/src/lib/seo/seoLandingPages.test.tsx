import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { CompressPdfPage } from '../../pages/compress-pdf/CompressPdfPage';
import { SplitPdfPage } from '../../pages/split-pdf/SplitPdfPage';
import {
  allSeoLandingPaths,
  compressSeoLandingConfigs,
  extractPagesCanonicalConfig,
  extractSeoLandingConfigs,
  mergeSeoLandingConfigs,
  reorderSeoLandingConfigs,
  splitSeoLandingConfigs,
} from './seoLandingPages';

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

describe('SEO landing pages', () => {
  it('preselects individual page ranges for the split individual pages route', async () => {
    const config = splitSeoLandingConfigs.find((item) => item.routePath === '/split-pdf-into-individual-pages');
    if (!config) {
      throw new Error('Missing split individual pages SEO config.');
    }

    render(
      <MemoryRouter initialEntries={['/split-pdf-into-individual-pages']}>
        <Routes>
          <Route
            path='/split-pdf-into-individual-pages'
            element={<SplitPdfPage seoConfig={config} />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Split every PDF page into its own file' })).toBeInTheDocument();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('1-3, 4, 5-10')).toHaveValue('1,2,3,4');
    });
    expect(screen.getByText('4 split files configured')).toBeInTheDocument();
  });

  it('uses strong compression preset for target-size SEO pages without guaranteeing exact size', async () => {
    const config = compressSeoLandingConfigs.find((item) => item.routePath === '/compress-pdf-to-100kb');
    if (!config) {
      throw new Error('Missing compress 100KB SEO config.');
    }

    render(
      <MemoryRouter initialEntries={['/compress-pdf-to-100kb']}>
        <Routes>
          <Route path='/compress-pdf-to-100kb' element={<CompressPdfPage seoConfig={config} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Try to compress a PDF toward 100KB' })).toBeInTheDocument();
    expect(screen.getByText(/Exact 100KB output is not guaranteed/i)).toBeInTheDocument();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByLabelText('Preset')).toHaveValue('strong');
    });
  });

  it('tracks the expected canonical SEO landing route set', () => {
    expect(allSeoLandingPaths).toEqual(
      expect.arrayContaining([
        '/split-pdf-into-individual-pages',
        '/split-pdf-by-page-ranges',
        '/split-pdf-without-uploading',
        '/split-large-pdf',
        '/merge-pdf-without-uploading',
        '/combine-pdf-files',
        '/extract-pages-from-pdf',
        '/extract-specific-pages-from-pdf',
        '/save-single-pages-from-pdf',
        '/reorder-pdf-pages',
        '/organize-pdf-pages',
        '/compress-pdf-to-100kb',
        '/compress-pdf-to-200kb',
        '/compress-pdf-for-email',
        '/compress-pdf-without-uploading',
        '/offline-pdf-tools',
      ])
    );
    expect(new Set(allSeoLandingPaths).size).toBe(allSeoLandingPaths.length);
  });

  it('marks redundant SEO pages as noindex and canonicalizes them to primary pages', () => {
    const redundantPages = [
      {
        config: splitSeoLandingConfigs.find((item) => item.routePath === '/split-pdf-into-individual-pages'),
        canonical: 'https://www.filegap.app/split-pdf-by-page-ranges',
      },
      {
        config: splitSeoLandingConfigs.find((item) => item.routePath === '/split-pdf-without-uploading'),
        canonical: 'https://www.filegap.app/split-pdf-by-page-ranges',
      },
      {
        config: mergeSeoLandingConfigs.find((item) => item.routePath === '/combine-pdf-files'),
        canonical: 'https://www.filegap.app/merge-pdf-without-uploading',
      },
      {
        config: extractPagesCanonicalConfig,
        canonical: 'https://www.filegap.app/extract-specific-pages-from-pdf',
      },
      {
        config: extractSeoLandingConfigs.find((item) => item.routePath === '/save-single-pages-from-pdf'),
        canonical: 'https://www.filegap.app/extract-specific-pages-from-pdf',
      },
      {
        config: reorderSeoLandingConfigs.find((item) => item.routePath === '/organize-pdf-pages'),
        canonical: 'https://www.filegap.app/reorder-pdf-pages',
      },
    ];

    redundantPages.forEach((item) => {
      if (!item.config) {
        throw new Error(`Missing config for ${item.canonical}`);
      }
      expect(item.config.canonicalPath).toBe(item.canonical);
      expect(item.config.robots).toBe('noindex,follow');
    });
  });
});
