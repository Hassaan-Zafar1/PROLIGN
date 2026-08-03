import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from './Select';

describe('Select', () => {
  it('renders options from a plain string array', () => {
    render(<Select label="Role" options={['mentee', 'mentor']} value="mentee" onChange={() => {}} />);
    expect(screen.getByRole('option', { name: 'mentee' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'mentor' })).toBeInTheDocument();
  });

  it('renders options from a {value,label} object array', () => {
    render(
      <Select
        label="Role"
        options={[{ value: 'm', label: 'Mentor' }, { value: 'e', label: 'Mentee' }]}
        value="m"
        onChange={() => {}}
      />
    );
    expect(screen.getByRole('option', { name: 'Mentor' })).toHaveValue('m');
  });

  it('reflects the selected value', () => {
    render(<Select label="Role" options={['a', 'b']} value="b" onChange={() => {}} />);
    expect(screen.getByLabelText('Role')).toHaveValue('b');
  });

  it('calls onChange when a new option is selected', async () => {
    const onChange = vi.fn();
    render(<Select label="Role" options={['a', 'b']} value="a" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'b');
    expect(onChange).toHaveBeenCalled();
  });

  it('disables the select when disabled', () => {
    render(<Select label="Role" options={['a']} value="a" onChange={() => {}} disabled />);
    expect(screen.getByLabelText('Role')).toBeDisabled();
  });
});
