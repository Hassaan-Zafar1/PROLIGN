import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the title and description', () => {
    render(<EmptyState title="Nothing here" description="Try again later" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });

  it('renders the icon glyph (defaulting to "inbox")', () => {
    render(<EmptyState title="X" />);
    expect(screen.getByText('inbox')).toBeInTheDocument();
  });

  it('renders an action button and fires onAction when clicked, only when both are given', async () => {
    const onAction = vi.fn();
    render(<EmptyState title="X" actionLabel="Retry" onAction={onAction} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render an action button when actionLabel is missing', () => {
    render(<EmptyState title="X" onAction={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render an action button when onAction is missing', () => {
    render(<EmptyState title="X" actionLabel="Retry" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
