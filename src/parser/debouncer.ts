/**
 * Debouncer class for delaying function execution
 * Used to prevent excessive parsing during rapid typing
 */
export class Debouncer {
  private timerId: NodeJS.Timeout | null = null;

  /**
   * Debounce a function call
   * @param fn Function to execute after delay
   * @param delay Delay in milliseconds (default: 300ms)
   */
  debounce(fn: () => void, delay: number): void {
    // Clear any existing timer
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    // Set new timer
    this.timerId = setTimeout(() => {
      fn();
      this.timerId = null;
    }, delay);
  }

  /**
   * Cancel any pending debounced function
   */
  cancel(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Check if there's a pending debounced function
   */
  isPending(): boolean {
    return this.timerId !== null;
  }
}
