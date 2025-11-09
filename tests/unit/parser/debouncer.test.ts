import { Debouncer } from '../../../src/parser/debouncer';

describe('Debouncer', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should delay function execution by specified time', () => {
    const debouncer = new Debouncer();
    const mockFn = jest.fn();

    debouncer.debounce(mockFn, 300);

    // Function should not be called immediately
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward time by 299ms - should still not be called
    jest.advanceTimersByTime(299);
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward time by 1ms - should now be called
    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous timer when called again', () => {
    const debouncer = new Debouncer();
    const mockFn = jest.fn();

    // First call
    debouncer.debounce(mockFn, 300);
    jest.advanceTimersByTime(100);

    // Second call before first completes - should reset timer
    debouncer.debounce(mockFn, 300);
    jest.advanceTimersByTime(100);

    // After 200ms total, function should not be called yet
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward remaining time (200ms more from second call)
    jest.advanceTimersByTime(200);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple rapid calls correctly', () => {
    const debouncer = new Debouncer();
    const mockFn = jest.fn();

    // Rapid fire 5 calls
    for (let i = 0; i < 5; i++) {
      debouncer.debounce(mockFn, 300);
      jest.advanceTimersByTime(50);
    }

    // Function should not be called yet
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward to complete the last debounce
    jest.advanceTimersByTime(300);

    // Should only be called once (for the last debounce)
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should allow different delays for different calls', () => {
    const debouncer = new Debouncer();
    const mockFn = jest.fn();

    debouncer.debounce(mockFn, 100);
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    debouncer.debounce(mockFn, 500);
    jest.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle zero delay', () => {
    const debouncer = new Debouncer();
    const mockFn = jest.fn();

    debouncer.debounce(mockFn, 0);
    jest.advanceTimersByTime(0);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
