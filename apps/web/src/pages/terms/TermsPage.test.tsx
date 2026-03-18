import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TermsPage } from './TermsPage';

describe('TermsPage', () => {
  it('renders terms title and disclaimer', () => {
    render(<TermsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Simple terms for using Filegap's private PDF tools that run locally in your browser."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Filegap is provided as open-source software on an "as is" and "as available" basis/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Local processing only. Your files stay on your device.')
    ).toBeInTheDocument();
  });
});
