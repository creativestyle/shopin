/**
 * @jest-environment node
 *
 * React's `cache` normally creates per-request scope (one cached value per
 * React render tree). We test the variant.ts logic by loading the module fresh
 * inside jest.isolateModules() for each test so each test starts with an
 * empty holder, then we mock `cache` to behave like a simple memoiser.
 */

// Silence the React import — we'll mock it per isolated module load.

describe('getRequestVariant / setRequestVariant', () => {
  /**
   * Helper: load a fresh instance of variant.ts with `react.cache` mocked to
   * return a stable cached result (like React's cache within one request).
   */
  function loadFreshVariant() {
    let result:
      | {
          getRequestVariant: () => Record<string, string> | undefined
          setRequestVariant: (v: Record<string, string>) => void
        }
      | undefined

    jest.isolateModules(() => {
      jest.mock('react', () => ({
        ...jest.requireActual('react'),
        // Mimics React cache: the factory is called once, result reused.
        cache: <T extends () => unknown>(fn: T) => {
          const cached = fn()
          return () => cached
        },
      }))

      result = require('../variant') as typeof result
    })

    return result!
  }

  it('returns undefined before setRequestVariant is called', () => {
    const { getRequestVariant } = loadFreshVariant()
    expect(getRequestVariant()).toBeUndefined()
  })

  it('returns the value after setRequestVariant is called', () => {
    const { getRequestVariant, setRequestVariant } = loadFreshVariant()
    const value = { dataSource: 'commercetools-set' }
    setRequestVariant(value)
    expect(getRequestVariant()).toBe(value)
  })

  it('returns the latest value when setRequestVariant is called twice', () => {
    const { getRequestVariant, setRequestVariant } = loadFreshVariant()
    setRequestVariant({ dataSource: 'commercetools-set' })
    const second = { dataSource: 'commercetools-algolia-set' }
    setRequestVariant(second)
    expect(getRequestVariant()).toBe(second)
  })
})
