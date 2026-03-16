import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TermsPage } from './TermsPage';

describe('TermsPage', () => {
  it('renders terms title and disclaimer', () => {
    render(<TermsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeInTheDocument();
    expect(screen.getByText(/provided as open-source software on an “as is” basis/i)).toBeInTheDocument();
  });
});
