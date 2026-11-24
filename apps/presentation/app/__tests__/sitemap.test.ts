/**
 * @jest-environment node
 */
import { SITEMAP_REVALIDATE_SECONDS } from '@config/constants'

jest.mock('@/lib/site-url', () => ({ tryGetSiteBaseUrl: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn() } }))
jest.mock('@/features/seo/get-sitemap-entries', () => ({
  getSitemapEntries: jest.fn(),
}))

import { revalidate } from '../sitemap'

describe('sitemap route', () => {
  it('keeps the literal revalidate in sync with SITEMAP_REVALIDATE_SECONDS', () => {
    expect(revalidate).toBe(SITEMAP_REVALIDATE_SECONDS)
  })
})
