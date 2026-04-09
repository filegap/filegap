import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WorkflowBuilderPage } from './WorkflowBuilderPage';

describe('WorkflowBuilderPage', () => {
  it('renders builder sections and CLI preview', () => {
    render(<WorkflowBuilderPage />);

    expect(screen.getByRole('heading', { name: 'Workflow Builder (Preview)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pipeline blocks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Validation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Run workflow' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CLI preview' })).toBeInTheDocument();
    expect(screen.getByText(/Workflow shape is valid for V1/i)).toBeInTheDocument();
    expect(screen.getByText(/filegap optimize/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run locally' })).toBeDisabled();
  });
});
