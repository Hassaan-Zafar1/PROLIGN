import React from 'react';
import Button from './Button';

/**
 * Catches render-time errors in its subtree so one broken page/widget can't
 * blank the whole app. Class component because React error boundaries require
 * getDerivedStateFromError/componentDidCatch (no hook equivalent exists).
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[40vh]">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-4xl text-error">error</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-1.5">Something went wrong</h3>
          <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed mb-5">
            This section hit an unexpected error. You can try again, or reload the page if it keeps happening.
          </p>
          <div className="flex gap-3">
            <Button variant="primary" size="md" onClick={this.handleReset}>Try again</Button>
            <Button variant="secondary" size="md" onClick={() => window.location.reload()}>Reload page</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
