import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Confirmed</Badge>);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('applies known variant styles', () => {
    render(<Badge variant="approved">Approved</Badge>);
    expect(screen.getByText('Approved')).toHaveClass('bg-secondary-container', 'text-on-secondary-container');
  });

  it('applies a distinct style for the "rejected" variant', () => {
    render(<Badge variant="rejected">Rejected</Badge>);
    expect(screen.getByText('Rejected')).toHaveClass('bg-error-container');
  });

  it('falls back to a neutral style for an unknown variant', () => {
    render(<Badge variant="not-a-real-variant">Mystery</Badge>);
    expect(screen.getByText('Mystery')).toHaveClass('bg-surface-variant', 'text-on-surface-variant');
  });

  it('defaults to the "pending" variant when none is given', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('text-tertiary');
  });
});
