import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders the logo image', () => {
    render(<LoadingScreen />);
    const img = screen.getByAltText('CUTS');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('renders the spinner element', () => {
    const { container } = render(<LoadingScreen />);
    const spinner = container.querySelector('.auth-spinner');
    expect(spinner).toBeInTheDocument();
  });
});
