/**
 * The fault proxy itself: a chosen BFF route fails, hangs or slows down, others
 * pass, and a reset restores normal answers.
 */

import { bffStatus } from '../journeys/support/bff-api'
import { DATA_SOURCE, expect, test } from '../journeys/support/fixtures'
import {
  expireStorefrontCache,
  storefrontStatus,
} from '../journeys/support/pages'
import { ROUTES } from '../journeys/support/test-data'

const TAGS = ['@desktop', '@priority-medium', '@unverified']

test.describe('Fault proxy', { tag: '@smoke' }, () => {
  test(
    'fails only the chosen route until reset',
    { tag: TAGS },
    async ({ faults, request }) => {
      await faults.fail('csrf/token', { status: 503 })

      expect(await bffStatus(request, 'csrf/token')).toBe(503)
      expect(
        await bffStatus(request, 'store-config', { dataSource: DATA_SOURCE })
      ).toBe(200)

      await faults.reset()
      expect(await bffStatus(request, 'csrf/token')).toBe(200)
    }
  )

  test(
    'limits a fault to the given number of requests',
    { tag: TAGS },
    async ({ faults, request }) => {
      await faults.fail('csrf/token', { times: 1 })

      expect(await bffStatus(request, 'csrf/token')).toBe(500)
      expect(await bffStatus(request, 'csrf/token')).toBe(200)
    }
  )

  test(
    'holds a hanging route without answering',
    { tag: TAGS },
    async ({ faults, request }) => {
      await faults.hang('csrf/token')

      // Short request timeout: the proxy never answers until the reset
      await expect(
        bffStatus(request, 'csrf/token', { timeout: 1_000 })
      ).rejects.toThrow(/Timeout/)
    }
  )

  test(
    'the storefront server goes through the proxy too',
    { tag: TAGS },
    async ({ faults, request }) => {
      await expireStorefrontCache(request)
      await faults.delay('', 1)

      // No browser: only the storefront server can reach the BFF
      expect(await storefrontStatus(request, ROUTES.home)).toBe(200)

      expect(await faults.totalHits()).toBeGreaterThan(0)
    }
  )
})
