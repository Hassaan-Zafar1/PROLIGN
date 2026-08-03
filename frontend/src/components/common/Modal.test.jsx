import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(<Modal open={false}>Content</Modal>);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders its children with dialog semantics when open', () => {
    render(<Modal open labelledBy="modal-title">Content</Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(<Modal open onClose={onClose}>Content</Modal>);
    await userEvent.click(container.querySelector('[aria-hidden="true"]'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose}>Content</Modal>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores it on close', () => {
    const { rerender } = render(<Modal open>Content</Modal>);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<Modal open={false}>Content</Modal>);
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
