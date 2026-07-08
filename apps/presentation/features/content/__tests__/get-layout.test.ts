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
jest.mock('../lib/content-service', () => ({
  ContentService: jest.fn(),
}))

import { getHeaderLayout, getFooterLayout } from '../get-layout'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { getBffCacheOptions } from '@/lib/bff/bff-cache-options'
import { ContentService } from '../lib/content-service'

const MOCK_BFF_FETCH = { fetch: jest.fn() }
const LIVE_CACHE_OPTS = { next: { revalidate: 300 } }
const DRAFT_CACHE_OPTS = { cache: 'no-store' as const }

function mocks() {
  return {
    createBffFetchServer: jest.mocked(createBffFetchServer),
    getBffCacheOptions: jest.mocked(getBffCacheOptions),
    ContentService: jest.mocked(ContentService),
  }
}

describe('getHeaderLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const m = mocks()
    m.createBffFetchServer.mockResolvedValue(MOCK_BFF_FETCH as any)
    m.ContentService.mockImplementation(
      () => ({ getHeader: jest.fn().mockResolvedValue(null) }) as any
    )
  })

  it('calls createBffFetchServer with isDraft: false by default', async () => {
    mocks().getBffCacheOptions.mockReturnValue(LIVE_CACHE_OPTS)
    await getHeaderLayout()
    expect(mocks().createBffFetchServer).toHaveBeenCalledWith({
      isDraft: false,
    })
  })

  it('calls createBffFetchServer with isDraft: true when draft', async () => {
    mocks().getBffCacheOptions.mockReturnValue(DRAFT_CACHE_OPTS)
    await getHeaderLayout(true)
    expect(mocks().createBffFetchServer).toHaveBeenCalledWith({ isDraft: true })
  })

  it('passes no-store cache options when isDraft is true', async () => {
    mocks().getBffCacheOptions.mockReturnValue(DRAFT_CACHE_OPTS)
    const getHeader = jest.fn().mockResolvedValue(null)
    mocks().ContentService.mockImplementation(() => ({ getHeader }) as any)
    await getHeaderLayout(true)
    expect(mocks().getBffCacheOptions).toHaveBeenCalledWith(undefined, {
      isDraft: true,
    })
    expect(getHeader).toHaveBeenCalledWith(DRAFT_CACHE_OPTS)
  })

  it('passes revalidate cache options when isDraft is false', async () => {
    mocks().getBffCacheOptions.mockReturnValue(LIVE_CACHE_OPTS)
    const getHeader = jest.fn().mockResolvedValue(null)
    mocks().ContentService.mockImplementation(() => ({ getHeader }) as any)
    await getHeaderLayout(false)
    expect(mocks().getBffCacheOptions).toHaveBeenCalledWith(undefined, {
      isDraft: false,
    })
    expect(getHeader).toHaveBeenCalledWith(LIVE_CACHE_OPTS)
  })
})

describe('getFooterLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const m = mocks()
    m.createBffFetchServer.mockResolvedValue(MOCK_BFF_FETCH as any)
    m.ContentService.mockImplementation(
      () => ({ getFooter: jest.fn().mockResolvedValue(null) }) as any
    )
  })

  it('calls createBffFetchServer with isDraft: true when draft', async () => {
    mocks().getBffCacheOptions.mockReturnValue(DRAFT_CACHE_OPTS)
    await getFooterLayout(true)
    expect(mocks().createBffFetchServer).toHaveBeenCalledWith({ isDraft: true })
  })

  it('passes no-store cache options to getFooter when isDraft is true', async () => {
    mocks().getBffCacheOptions.mockReturnValue(DRAFT_CACHE_OPTS)
    const getFooter = jest.fn().mockResolvedValue(null)
    mocks().ContentService.mockImplementation(() => ({ getFooter }) as any)
    await getFooterLayout(true)
    expect(getFooter).toHaveBeenCalledWith(DRAFT_CACHE_OPTS)
  })

  it('passes revalidate cache options to getFooter by default', async () => {
    mocks().getBffCacheOptions.mockReturnValue(LIVE_CACHE_OPTS)
    const getFooter = jest.fn().mockResolvedValue(null)
    mocks().ContentService.mockImplementation(() => ({ getFooter }) as any)
    await getFooterLayout()
    expect(getFooter).toHaveBeenCalledWith(LIVE_CACHE_OPTS)
  })
})
