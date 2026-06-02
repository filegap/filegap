import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WhyUploadingPdfsIsAPrivacyRiskPage } from './WhyUploadingPdfsIsAPrivacyRiskPage';

describe('WhyUploadingPdfsIsAPrivacyRiskPage', () => {
  it('renders indexable privacy-risk content with required links and canonical metadata', async () => {
    render(<WhyUploadingPdfsIsAPrivacyRiskPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Why uploading PDFs online can be a privacy risk',
      })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Explore local-first tools' })).toHaveAttribute(
      'href',
      '/local-first-pdf-tools'
    );
    expect(screen.getByRole('link', { name: /^Merge without uploading/ })).toHaveAttribute(
      'href',
      '/merge-pdf-without-uploading'
    );
    expect(screen.getByRole('link', { name: /^Compress without uploading/ })).toHaveAttribute(
      'href',
      '/compress-pdf-without-uploading'
    );
    expect(screen.getByRole('link', { name: /^Merge PDF Use/ })).toHaveAttribute('href', '/merge-pdf');
    expect(screen.getByRole('link', { name: /^Split PDF Separate/ })).toHaveAttribute('href', '/split-pdf');
    expect(screen.getByRole('link', { name: /^Compress PDF Try/ })).toHaveAttribute('href', '/compress-pdf');
    expect(screen.getByRole('link', { name: /^PDF to JPG/ })).toHaveAttribute('href', '/pdf-to-jpg');

    expect(screen.getByRole('heading', { level: 2, name: 'PDFs often contain sensitive information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeInTheDocument();
    expect(screen.getByText('Is it always unsafe to upload a PDF online?')).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('Why Uploading PDFs Can Be a Privacy Risk | Filegap');
      expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
        'content',
        'PDFs often contain private information. Learn why uploading files to online PDF tools can be risky and how local browser-based tools can help.'
      );
      expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://www.filegap.app/why-uploading-pdfs-is-a-privacy-risk'
      );
      expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    });
  });
});
