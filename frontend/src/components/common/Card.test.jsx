import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('renders its children', () => {
    render(<Card><p>Body content</p></Card>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders a title and description when given', () => {
    render(<Card title="My Title" description="My description">Body</Card>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('My description')).toBeInTheDocument();
  });

  it('renders the icon when given', () => {
    render(<Card title="X" icon="star">Body</Card>);
    expect(screen.getByText('star')).toBeInTheDocument();
  });

  it('omits the header entirely when there is no title and no icon', () => {
    const { container } = render(<Card>Body</Card>);
    expect(screen.queryByText('star')).not.toBeInTheDocument();
    // Only one child div (the body wrapper) directly inside the card root.
    expect(container.firstChild.children).toHaveLength(1);
  });
});
