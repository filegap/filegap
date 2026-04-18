import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { WorkflowBuilderPage } from './WorkflowBuilderPage';

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
});
