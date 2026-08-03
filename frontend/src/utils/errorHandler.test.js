import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import { errorHandler } from './errorHandler';

// react-toastify actually renders/queues real toasts — mock it so these tests
// only assert on the message-selection LOGIC, with zero UI side effects.
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warn: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('errorHandler.handleAuthError', () => {
  it('shows the given message', () => {
    errorHandler.handleAuthError('Session expired');
    expect(toast.error).toHaveBeenCalledWith('Session expired');
  });

  it('falls back to a default message when none is given', () => {
    errorHandler.handleAuthError();
    expect(toast.error).toHaveBeenCalledWith('Authentication failed');
  });
});

describe('errorHandler.handleError', () => {
  it('prefers the server-provided message when present', () => {
    errorHandler.handleError({ response: { data: { message: 'Custom server message' } } });
    expect(toast.error).toHaveBeenCalledWith('Custom server message');
  });

  it('maps a 400 with no message to "Invalid request"', () => {
    errorHandler.handleError({ response: { status: 400, data: {} } });
    expect(toast.error).toHaveBeenCalledWith('Invalid request');
  });

  it('maps a 403 with no message to "Access denied"', () => {
    errorHandler.handleError({ response: { status: 403, data: {} } });
    expect(toast.error).toHaveBeenCalledWith('Access denied');
  });

  it('maps a 404 with no message to "Not found"', () => {
    errorHandler.handleError({ response: { status: 404, data: {} } });
    expect(toast.error).toHaveBeenCalledWith('Not found');
  });

  it('maps a 500 with no message to "Server error"', () => {
    errorHandler.handleError({ response: { status: 500, data: {} } });
    expect(toast.error).toHaveBeenCalledWith('Server error');
  });

  it('maps an aborted/timeout request to a timeout message', () => {
    errorHandler.handleError({ code: 'ECONNABORTED' });
    expect(toast.error).toHaveBeenCalledWith('The request took too long. Please try again.');
  });

  it('maps a message containing "timeout" the same way', () => {
    errorHandler.handleError({ message: 'connection timeout' });
    expect(toast.error).toHaveBeenCalledWith('The request took too long. Please try again.');
  });

  it('maps axios\'s "Network Error" to a connection message', () => {
    errorHandler.handleError({ message: 'Network Error' });
    expect(toast.error).toHaveBeenCalledWith('Network error - check your connection');
  });

  it('falls back to a generic message for anything unrecognized', () => {
    errorHandler.handleError({});
    expect(toast.error).toHaveBeenCalledWith('An error occurred');
  });
});

describe('errorHandler.handleSuccess', () => {
  it('shows a success toast with the given message', () => {
    errorHandler.handleSuccess('Saved!');
    expect(toast.success).toHaveBeenCalledWith('Saved!');
  });
});

describe('errorHandler.notify', () => {
  it('shows a warning toast with the given message', () => {
    errorHandler.notify('Heads up');
    expect(toast.warn).toHaveBeenCalledWith('Heads up');
  });
});
