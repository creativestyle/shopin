/**
 * Creates a throttled function that limits the execution rate of the provided function.
 * The function will be called at most once per specified delay period.
 *
 * @param func - The function to throttle
 * @param delay - The delay in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastExecTime = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastExecTime > delay) {
      func(...args)
      lastExecTime = now
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(
        () => {
          func(...args)
          lastExecTime = Date.now()
        },
        delay - (now - lastExecTime)
      )
    }
  }
}
