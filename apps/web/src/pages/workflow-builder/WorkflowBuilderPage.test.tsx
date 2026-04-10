import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { WorkflowBuilderPage } from './WorkflowBuilderPage';

describe('WorkflowBuilderPage', () => {
  it('renders builder sections and CLI preview', () => {
    render(
      <MemoryRouter initialEntries={['/workflow-builder']}>
        <Routes>
          <Route path='/workflow-builder' element={<WorkflowBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Workflow Builder (Preview)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pipeline blocks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Validation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Run workflow' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CLI preview' })).toBeInTheDocument();
    expect(screen.getByText(/Workflow shape is valid for V1/i)).toBeInTheDocument();
    expect(screen.getByText(/filegap optimize/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run locally' })).toBeDisabled();
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

    expect(screen.getByDisplayValue('Multiple PDFs')).toBeInTheDocument();
    expect(screen.getByText('Workflow imported locally. Review the flow and run it when ready.')).toBeInTheDocument();
    expect(screen.getByText('alpha.pdf')).toBeInTheDocument();
    expect(screen.getByText('beta.pdf')).toBeInTheDocument();
    expect(screen.getByText(/filegap merge input-1\.pdf input-2\.pdf/)).toBeInTheDocument();
  });
});
