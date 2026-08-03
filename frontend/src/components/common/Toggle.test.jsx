import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toggle from './Toggle';

describe('Toggle', () => {
  it('renders the label and detail text', () => {
    render(<Toggle label="Email alerts" detail="Get notified by email" checked={false} onChange={() => {}} />);
    expect(screen.getByText('Email alerts')).toBeInTheDocument();
    expect(screen.getByText('Get notified by email')).toBeInTheDocument();
  });

  it('exposes switch semantics reflecting the checked state', () => {
    const { rerender } = render(<Toggle label="X" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    rerender(<Toggle label="X" checked onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with the toggled value when clicked', async () => {
    const onChange = vi.fn();
    render(<Toggle label="X" checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', async () => {
    const onChange = vi.fn();
    render(<Toggle label="X" checked={false} onChange={onChange} disabled />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
