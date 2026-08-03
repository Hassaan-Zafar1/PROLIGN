import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('renders the given src', () => {
    render(<Avatar src="https://example.com/pic.jpg" name="Jane Doe" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/pic.jpg');
  });

  it('falls back to a ui-avatars.com URL with the encoded name when no src is given', () => {
    render(<Avatar name="Jane Doe" />);
    const img = screen.getByRole('img');
    expect(img.src).toContain('ui-avatars.com');
    expect(img.src).toContain('Jane%20Doe');
  });

  it('uses "U" in the fallback URL when no name is given either', () => {
    render(<Avatar />);
    expect(screen.getByRole('img').src).toContain('name=U');
  });

  it('sets alt text from the name', () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByAltText("Jane Doe's avatar")).toBeInTheDocument();
  });

  it('uses a generic alt when no name is given', () => {
    render(<Avatar />);
    expect(screen.getByAltText('User avatar')).toBeInTheDocument();
  });

  it('applies the size class for each size option', () => {
    const { rerender } = render(<Avatar name="X" size="sm" />);
    expect(screen.getByRole('img')).toHaveClass('w-8', 'h-8');
    rerender(<Avatar name="X" size="lg" />);
    expect(screen.getByRole('img')).toHaveClass('w-14', 'h-14');
  });

  it('defaults to the "md" size for an unrecognized size value', () => {
    render(<Avatar name="X" size="not-a-real-size" />);
    expect(screen.getByRole('img')).toHaveClass('w-10', 'h-10');
  });
});
