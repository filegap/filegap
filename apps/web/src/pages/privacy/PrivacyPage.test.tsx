import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PrivacyPage } from './PrivacyPage';

describe('PrivacyPage', () => {
  it('renders privacy title and key local-processing statement', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByText(/process PDF files locally in your browser/i)).toBeInTheDocument();
  });
});
