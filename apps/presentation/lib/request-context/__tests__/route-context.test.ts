/**
 * @jest-environment node
 *
 * initRouteContext is the per-segment initialiser that every server page/layout
 * under [variant]/[locale] must call. It atomically sets both the next-intl
 * locale and the request variant so neither can be set without the other.
 *
 * These tests confirm that initRouteContext delegates correctly to both
 * setRequestLocale and setRequestVariant(decodeVariant(variant)).
 */

jest.mock('next-intl/server', () => ({ setRequestLocale: jest.fn() }))
jest.mock('../variant', () => ({ setRequestVariant: jest.fn() }))
jest.mock('@/lib/variant/variant-key', () => ({
  decodeVariant: jest.fn(),
  isVariantSegment: jest.fn(),
}))

import { initRouteContext } from '../route-context'

function mocks() {
  return {
    setRequestLocale: jest.mocked(
      jest.requireMock('next-intl/server').setRequestLocale as jest.Mock
    ),
    setRequestVariant: jest.mocked(
      jest.requireMock('../variant').setRequestVariant as jest.Mock
    ),
    decodeVariant: jest.mocked(
      jest.requireMock('@/lib/variant/variant-key').decodeVariant as jest.Mock
    ),
    isVariantSegment: jest.mocked(
      jest.requireMock('@/lib/variant/variant-key')
        .isVariantSegment as jest.Mock
    ),
  }
}

describe('initRouteContext', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls setRequestLocale with the provided locale', () => {
    const m = mocks()
    m.isVariantSegment.mockReturnValue(true)
    m.decodeVariant.mockReturnValue({ dataSource: 'commercetools-set' })
    initRouteContext({ variant: '~commercetools-set', locale: 'en' })
    expect(m.setRequestLocale).toHaveBeenCalledWith('en')
  })

  it('calls decodeVariant with the raw variant segment', () => {
    const m = mocks()
    m.isVariantSegment.mockReturnValue(true)
    m.decodeVariant.mockReturnValue({ dataSource: 'commercetools-set' })
    initRouteContext({ variant: '~commercetools-set', locale: 'en' })
    expect(m.decodeVariant).toHaveBeenCalledWith('~commercetools-set')
  })

  it('calls setRequestVariant with the decoded variant from decodeVariant', () => {
    const m = mocks()
    const decoded = { dataSource: 'commercetools-algolia-set' }
    m.isVariantSegment.mockReturnValue(true)
    m.decodeVariant.mockReturnValue(decoded)
    initRouteContext({ variant: '~commercetools-algolia-set', locale: 'de' })
    expect(m.setRequestVariant).toHaveBeenCalledWith(decoded)
  })

  it('sets both locale and variant on every call — neither is conditional', () => {
    const m = mocks()
    m.isVariantSegment.mockReturnValue(true)
    m.decodeVariant.mockReturnValue({ dataSource: 'commercetools-set' })
    initRouteContext({ variant: '~commercetools-set', locale: 'de' })
    expect(m.setRequestLocale).toHaveBeenCalledTimes(1)
    expect(m.setRequestVariant).toHaveBeenCalledTimes(1)
  })

  it('throws on a malformed variant segment instead of silently defaulting', () => {
    const m = mocks()
    m.isVariantSegment.mockReturnValue(false)
    expect(() =>
      initRouteContext({ variant: 'malformed', locale: 'en' })
    ).toThrow('Invalid variant segment: "malformed"')
    expect(m.setRequestLocale).not.toHaveBeenCalled()
    expect(m.setRequestVariant).not.toHaveBeenCalled()
  })
})
