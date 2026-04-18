import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { WorkflowBuilderPage } from './WorkflowBuilderPage';

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
    optimizePdfBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  };
});

describe('WorkflowBuilderPage', () => {
  it('renders dropzone-only state before files are loaded', () => {
    render(
      <MemoryRouter initialEntries={['/workflow-builder']}>
        <Routes>
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Build PDF workflow — fast, private, and local' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Input files' })).not.toBeInTheDocument();
    expect(screen.getByText('Drag & drop PDF files')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Uploaded files' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Processing steps' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'CLI preview' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Run workflow' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How to build a PDF workflow' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Why use this tool' })).toBeInTheDocument();
  });

  it('bootstraps merge workflows from navigation state', () => {
    const sourceFiles = [
      new File([new Uint8Array([1])], 'alpha.pdf', { type: 'application/pdf' }),
      new File([new Uint8Array([2])], 'beta.pdf', { type: 'application/pdf' }),
    ];

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/workflow-builder',
            search: '?template=merge',
            state: {
              template: 'merge',
              draft: {
                inputMode: 'multiple',
                steps: [
                  {
                    id: 'merge-seed',
                    operation: 'merge',
                    pageRanges: '1-3',
                    pageOrder: '3,2,1',
                    splitRanges: '1-2,3-4',
                    compressionPreset: 'balanced',
                  },
                ],
              },
              sourceFiles,
            },
          },
        ]}
      >
        <Routes>
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Imported from merge')).toBeInTheDocument();
    expect(screen.getByText('Existing files and step draft were loaded into this workflow.')).toBeInTheDocument();
    expect(screen.getByText('alpha.pdf')).toBeInTheDocument();
    expect(screen.getByText('beta.pdf')).toBeInTheDocument();
    expect(screen.getByText(/filegap merge input-1\.pdf input-2\.pdf/)).toBeInTheDocument();
  });

  it('shows completed state with gated download and filegap output naming', async () => {
    const user = userEvent.setup();
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const originalCreateElement = document.createElement.bind(document);
    const createdAnchors: HTMLAnchorElement[] = [];
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        createdAnchors.push(element as HTMLAnchorElement);
      }
      return element;
    }) as typeof document.createElement);

    render(
      <MemoryRouter initialEntries={['/workflow-builder']}>
        <Routes>
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/> output\.pdf/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Run workflow' }));

    await waitFor(() => {
      expect(screen.getByText('Workflow completed')).toBeInTheDocument();
    });

    expect(screen.getByText('Your PDF is ready. The local process finished on this device.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New workflow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Run workflow' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(screen.getByText('Your PDF is ready')).toBeInTheDocument();

    const modalDownloadButton = screen.getAllByRole('button', { name: 'Download PDF' })[1];
    await user.click(modalDownloadButton);

    expect(createdAnchors.some((anchor) => anchor.download === 'filegap-optimize-pdf-output.pdf')).toBe(true);
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);

    createElementSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('shows uploaded page count and derives reorder defaults from the real PDF length', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/workflow-builder']}>
        <Routes>
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'source.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(within(screen.getAllByTestId('uploaded-file-row')[0]).getByText('4')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByRole('combobox'), 'reorder');
    expect(screen.getByDisplayValue('1,2,3,4')).toBeInTheDocument();
  });
});
