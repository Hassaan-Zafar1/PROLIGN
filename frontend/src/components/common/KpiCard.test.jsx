import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KpiCard from './KpiCard';

describe('KpiCard', () => {
  it('renders value, label, and subtitle', () => {
    render(<KpiCard value="128" label="Total Sessions" subtitle="This month" icon="event" />);
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Total Sessions')).toBeInTheDocument();
    expect(screen.getByText('This month')).toBeInTheDocument();
  });

  it('shows an upward trend badge for a positive change', () => {
    render(<KpiCard value="10" label="X" change={12} icon="event" />);
    expect(screen.getByText('trending_up')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('shows a downward trend badge for a negative change (no leading +)', () => {
    render(<KpiCard value="10" label="X" change={-5} icon="event" />);
    expect(screen.getByText('trending_down')).toBeInTheDocument();
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('treats a change of exactly 0 as positive (matches the ">= 0" check)', () => {
    render(<KpiCard value="10" label="X" change={0} icon="event" />);
    expect(screen.getByText('trending_up')).toBeInTheDocument();
    expect(screen.getByText('+0%')).toBeInTheDocument();
  });

  it('renders no change badge at all when change is not provided', () => {
    render(<KpiCard value="10" label="X" icon="event" />);
    expect(screen.queryByText('trending_up')).not.toBeInTheDocument();
    expect(screen.queryByText('trending_down')).not.toBeInTheDocument();
  });

  it('renders extra children below the standard content', () => {
    render(<KpiCard value="10" label="X" icon="event"><p>Extra content</p></KpiCard>);
    expect(screen.getByText('Extra content')).toBeInTheDocument();
  });
});
