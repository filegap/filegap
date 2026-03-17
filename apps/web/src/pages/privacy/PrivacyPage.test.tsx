import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PrivacyPage } from './PrivacyPage';

describe('PrivacyPage', () => {
  it('renders privacy title and key local-processing statement', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy & Security' })).toBeInTheDocument();
    expect(screen.getByText(/your files never leave your device\. period\./i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Instant proof' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Technical details' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'In short' })).toBeInTheDocument();
  });
});
