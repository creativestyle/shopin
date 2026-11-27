/**
 * @jest-environment node
 *
 * React's `cache` normally creates per-request scope (one cached value per
 * React render tree). We test the variant.ts logic by loading the module fresh
 * inside jest.isolateModules() for each test so each test starts with an
 * empty holder, then we mock `cache` to behave like a simple memoiser.
 */
import {
  ALT,
  ALT_RESOLVED,
  DEFAULT,
  DEFAULT_RESOLVED,
} from '@/lib/variant/__fixtures__/variants'

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
    const value = { ...DEFAULT_RESOLVED }
    setRequestVariant(value)
    expect(getRequestVariant()).toBe(value)
  })

  it('returns the latest value when setRequestVariant is called twice', () => {
    const { getRequestVariant, setRequestVariant } = loadFreshVariant()
    setRequestVariant({ ...DEFAULT_RESOLVED })
    const second = { ...ALT_RESOLVED }
    setRequestVariant(second)
    expect(getRequestVariant()).toBe(second)
  })
})

describe('runWithRequestVariant / ALS context', () => {
  function loadModule() {
    let result:
      | {
          getRequestVariant: () => Record<string, string> | undefined
          setRequestVariant: (v: Record<string, string>) => void
          runWithRequestVariant: <T>(
            resolved: Record<string, string>,
            fn: () => T
          ) => T
          runWithRequestVariantFromSegment: <T>(
            segment: string,
            fn: () => T
          ) => T
          setRequestVariantFromSegment: (segment: string) => void
        }
      | undefined

    jest.isolateModules(() => {
      jest.mock('react', () => ({
        ...jest.requireActual('react'),
        cache: <T extends () => unknown>(fn: T) => {
          const cached = fn()
          return () => cached
        },
      }))
      // the real variant-key: segments come from the project config (fixtures)

      result = require('../variant') as typeof result
    })

    return result!
  }

  it('returns the value passed to runWithRequestVariant inside the callback', () => {
    const { getRequestVariant, runWithRequestVariant } = loadModule()
    const value = { ...ALT_RESOLVED }
    let captured: Record<string, string> | undefined
    runWithRequestVariant(value, () => {
      captured = getRequestVariant()
    })
    expect(captured).toBe(value)
  })

  it('returns undefined outside the runWithRequestVariant callback', () => {
    const { getRequestVariant, runWithRequestVariant } = loadModule()
    const value = { ...ALT_RESOLVED }
    runWithRequestVariant(value, () => {})
    expect(getRequestVariant()).toBeUndefined()
  })

  it('ALS store takes precedence over the React.cache holder when both are set', () => {
    const { getRequestVariant, setRequestVariant, runWithRequestVariant } =
      loadModule()
    const holderValue = { ...DEFAULT_RESOLVED }
    const alsValue = { ...ALT_RESOLVED }
    setRequestVariant(holderValue)
    let captured: Record<string, string> | undefined
    runWithRequestVariant(alsValue, () => {
      captured = getRequestVariant()
    })
    expect(captured).toBe(alsValue)
  })

  it('propagates correctly across awaits inside the run', async () => {
    const { getRequestVariant, runWithRequestVariant } = loadModule()
    const value = { ...ALT_RESOLVED }
    let captured: Record<string, string> | undefined
    await runWithRequestVariant(value, async () => {
      await Promise.resolve()
      captured = getRequestVariant()
    })
    expect(captured).toBe(value)
  })

  it('runWithRequestVariantFromSegment decodes the segment and sets ALS context', () => {
    const { getRequestVariant, runWithRequestVariantFromSegment } = loadModule()
    let captured: Record<string, string> | undefined
    runWithRequestVariantFromSegment(ALT, () => {
      captured = getRequestVariant()
    })
    expect(captured).toEqual({ ...ALT_RESOLVED })
  })

  it('runWithRequestVariantFromSegment runs fn without variant context for an invalid segment', () => {
    const { getRequestVariant, runWithRequestVariantFromSegment } = loadModule()
    let captured: Record<string, string> | undefined = { sentinel: 'set' }
    runWithRequestVariantFromSegment('~bogus', () => {
      captured = getRequestVariant()
    })
    expect(captured).toBeUndefined()
  })

  it('setRequestVariantFromSegment leaves the holder untouched for an invalid segment', () => {
    const { getRequestVariant, setRequestVariantFromSegment } = loadModule()
    setRequestVariantFromSegment(DEFAULT.slice(1))
    expect(getRequestVariant()).toBeUndefined()
  })
})
