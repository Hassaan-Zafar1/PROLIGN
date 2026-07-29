import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

function Bomb() {
  throw new Error('boom');
}

// React (and this component's own componentDidCatch) both log the caught
// error to console.error — silence it so a PASSING test doesn't print a
// scary-looking stack trace, without hiding real unexpected console output.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

describe('ErrorBoundary', () => {
  it('renders children normally when nothing throws', () => {
    render(<ErrorBoundary><p>All good</p></ErrorBoundary>);
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders the default fallback UI when a child throws during render', () => {
    render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('renders a custom fallback when provided', () => {
    render(<ErrorBoundary fallback={<p>Custom fallback</p>}><Bomb /></ErrorBoundary>);
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('clicking "Try again" resets hasError and calls onReset', async () => {
    const onReset = vi.fn();
    // A boundary that stops throwing after the first render, so "Try again"
    // has something real to recover into.
    let shouldThrow = true;
    function Sometimes() {
      if (shouldThrow) throw new Error('boom');
      return <p>Recovered</p>;
    }
    render(
      <ErrorBoundary onReset={() => { shouldThrow = false; onReset(); }}>
        <Sometimes />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
