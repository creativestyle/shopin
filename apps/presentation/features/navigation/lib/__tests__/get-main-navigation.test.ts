/**
 * @jest-environment node
 */

jest.mock('react', () => ({ cache: <T>(fn: T) => fn }))
jest.mock('@/lib/bff/core/bff-fetch-server', () => ({
  createBffFetchServer: jest.fn(),
}))
jest.mock('@/lib/bff/bff-cache-options', () => ({
  getBffCacheOptions: jest.fn(),
}))
jest.mock('@config/constants', () => ({
  NAVIGATION_REVALIDATE_SECONDS: 600,
}))
jest.mock('../navigation-service', () => ({
  NavigationService: jest.fn(),
}))

import { getMainNavigation } from '../get-main-navigation'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { getBffCacheOptions } from '@/lib/bff/bff-cache-options'
import { NavigationService } from '../navigation-service'

const MOCK_BFF_FETCH = { fetch: jest.fn() }
const LIVE_CACHE_OPTS = { next: { revalidate: 600 } }
const DRAFT_CACHE_OPTS = { cache: 'no-store' as const }

function mocks() {
  return {
    createBffFetchServer: jest.mocked(createBffFetchServer),
    getBffCacheOptions: jest.mocked(getBffCacheOptions),
    NavigationService: jest.mocked(NavigationService),
  }
}

describe('getMainNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const m = mocks()
    m.createBffFetchServer.mockResolvedValue(MOCK_BFF_FETCH as any)
    m.NavigationService.mockImplementation(
      () => ({ getMainNavigation: jest.fn().mockResolvedValue(null) }) as any
    )
  })

  it('calls createBffFetchServer with isDraft: false by default', async () => {
    mocks().getBffCacheOptions.mockReturnValue(LIVE_CACHE_OPTS)
    await getMainNavigation()
    expect(mocks().createBffFetchServer).toHaveBeenCalledWith({
      isDraft: false,
    })
  })

  it('calls createBffFetchServer with isDraft: true when draft', async () => {
    mocks().getBffCacheOptions.mockReturnValue(DRAFT_CACHE_OPTS)
    await getMainNavigation(true)
    expect(mocks().createBffFetchServer).toHaveBeenCalledWith({ isDraft: true })
  })

  it('passes NAVIGATION_REVALIDATE_SECONDS and isDraft to getBffCacheOptions', async () => {
    mocks().getBffCacheOptions.mockReturnValue(LIVE_CACHE_OPTS)
    await getMainNavigation(false)
    expect(mocks().getBffCacheOptions).toHaveBeenCalledWith(600, {
      isDraft: false,
    })
  })

  it('passes no-store cache options to the service when isDraft is true', async () => {
    mocks().getBffCacheOptions.mockReturnValue(DRAFT_CACHE_OPTS)
    const getNav = jest.fn().mockResolvedValue(null)
    mocks().NavigationService.mockImplementation(
      () => ({ getMainNavigation: getNav }) as any
    )
    await getMainNavigation(true)
    expect(getNav).toHaveBeenCalledWith(DRAFT_CACHE_OPTS)
  })

  it('returns null on error without throwing', async () => {
    mocks().createBffFetchServer.mockRejectedValue(new Error('network'))
    mocks().getBffCacheOptions.mockReturnValue(LIVE_CACHE_OPTS)
    const result = await getMainNavigation()
    expect(result).toBeNull()
  })
})
