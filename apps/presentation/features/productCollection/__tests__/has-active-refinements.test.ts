/**
 * @jest-environment node
 */
import { DEFAULT_SORT_OPTION, VALID_SORT_OPTIONS } from '@config/constants'
import {
  hasActiveRefinements,
  type PlpSearchParams,
} from '../parse-search-params'

const CLEAN: PlpSearchParams = {
  page: 1,
  sort: DEFAULT_SORT_OPTION,
  filters: undefined,
  saleOnly: false,
  priceMin: undefined,
  priceMax: undefined,
}

describe('hasActiveRefinements', () => {
  it('is false for the clean URL and for pagination alone', () => {
    expect(hasActiveRefinements(CLEAN)).toBe(false)
    expect(hasActiveRefinements({ ...CLEAN, page: 3 })).toBe(false)
  })

  it('ignores filters without selected values', () => {
    expect(hasActiveRefinements({ ...CLEAN, filters: { color: [] } })).toBe(
      false
    )
  })

  it('is true for any refinement', () => {
    const otherSort = VALID_SORT_OPTIONS.find((o) => o !== DEFAULT_SORT_OPTION)!
    expect(hasActiveRefinements({ ...CLEAN, sort: otherSort })).toBe(true)
    expect(
      hasActiveRefinements({ ...CLEAN, filters: { color: ['red'] } })
    ).toBe(true)
    expect(hasActiveRefinements({ ...CLEAN, saleOnly: true })).toBe(true)
    expect(hasActiveRefinements({ ...CLEAN, priceMin: 0 })).toBe(true)
    expect(hasActiveRefinements({ ...CLEAN, priceMax: 100 })).toBe(true)
  })
})
