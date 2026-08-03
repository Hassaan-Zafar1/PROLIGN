import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Textarea from './Textarea';

describe('Textarea', () => {
  it('renders the label and applies the rows prop (defaulting to 3)', () => {
    render(<Textarea label="Bio" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Bio')).toHaveAttribute('rows', '3');
  });

  it('applies a custom rows value', () => {
    render(<Textarea label="Bio" value="" onChange={() => {}} rows={6} />);
    expect(screen.getByLabelText('Bio')).toHaveAttribute('rows', '6');
  });

  it('forwards value/onChange', async () => {
    const onChange = vi.fn();
    render(<Textarea label="Bio" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Bio'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows an error message with role="alert" and marks the textarea invalid', () => {
    render(<Textarea label="Bio" value="" onChange={() => {}} error="Too short" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Too short');
    // Not getByLabelText here: the error <p> lives inside the same <label>,
    // so its text merges into the computed label text and breaks an exact
    // match on just "Bio" — getByRole('textbox') sidesteps that.
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('disables the textarea when disabled', () => {
    render(<Textarea label="Bio" value="" onChange={() => {}} disabled />);
    expect(screen.getByLabelText('Bio')).toBeDisabled();
  });
});
