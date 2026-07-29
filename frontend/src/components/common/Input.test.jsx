import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from './Input';

describe('Input', () => {
  it('renders the label and forwards value/onChange/placeholder to the input', async () => {
    const onChange = vi.fn();
    render(<Input label="Email" placeholder="you@example.com" value="" onChange={onChange} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('you@example.com');
    await userEvent.type(input, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('uses "field" as the input\'s name when given', () => {
    render(<Input label="Email" field="email" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email');
  });

  it('shows an error message with role="alert" and marks the input invalid', () => {
    render(<Input label="Email" value="" onChange={() => {}} error="Required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
    // Not getByLabelText here: the error <p> lives inside the same <label>,
    // so its text merges into the computed label text and breaks an exact
    // match on just "Email" — getByRole('textbox') sidesteps that (there's
    // only one text input on the page).
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a success indicator only when success is true and there is no error', () => {
    const { container, rerender } = render(<Input label="Email" value="" onChange={() => {}} success />);
    expect(container.querySelector('.text-success')).toBeInTheDocument();
    rerender(<Input label="Email" value="" onChange={() => {}} success error="Required" />);
    expect(container.querySelector('.material-symbols-outlined.text-success')).not.toBeInTheDocument();
  });

  it('applies disabled styling when disabled', () => {
    render(<Input label="Email" value="" onChange={() => {}} disabled />);
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });
});
