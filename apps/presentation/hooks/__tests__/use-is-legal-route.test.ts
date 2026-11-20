import { renderHook } from '@testing-library/react'
import { useSelectedLayoutSegments } from 'next/navigation'
import { useIsLegalRoute } from '../use-is-legal-route'

jest.mock('next/navigation', () => ({
  useSelectedLayoutSegments: jest.fn(),
}))

const mockSegments = jest.mocked(useSelectedLayoutSegments)

describe('useIsLegalRoute', () => {
  it.each([
    [['privacy'], true],
    [['(main)', 'terms'], true],
    [['(main)', 'imprint'], true],
    [['cart'], false],
    [['(main)', 'p', 'red-shoes'], false],
    [[], false],
    [null, false],
  ])('segments %j → %s', (segments, expected) => {
    mockSegments.mockReturnValue(segments as string[])

    const { result } = renderHook(() => useIsLegalRoute())

    expect(result.current).toBe(expected)
  })
})
