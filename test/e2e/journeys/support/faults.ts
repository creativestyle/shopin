/**
 * Drives the fault proxy in front of the BFF (test/e2e/fault-proxy).
 * Use through the `faults` fixture, which resets every rule after the test.
 */

import { BFF_URL } from '../../config'
import { FAULTS_PATH, type FaultRule } from '../../fault-proxy/server'

const controlUrl = `${new URL(BFF_URL).origin}${FAULTS_PATH}`

/** Path pattern for a BFF route, e.g. bffRoute('cart/items') → ^/bff/cart/items */
const bffRoute = (route: string) =>
  `^${new URL(BFF_URL).pathname.replace(/\/$/, '')}/${route.replace(/^\//, '')}`

export type ActiveFault = FaultRule & { hits: number }

async function control(method: string, rule?: FaultRule) {
  const res = await fetch(controlUrl, {
    method,
    headers: { 'content-type': 'application/json' },
    body: rule && JSON.stringify(rule),
  })
  if (!res.ok) {
    throw new Error(`fault proxy ${method}: ${res.status} ${await res.text()}`)
  }
  return res
}

export const faultProxy = {
  /** Answer matching requests with an error status (default 500). */
  fail: async (route: string, rule: Omit<FaultRule, 'path' | 'hang'> = {}) => {
    await control('POST', { ...rule, path: bffRoute(route) })
  },
  /** Never answer matching requests until the test ends. */
  hang: async (
    route: string,
    rule: Pick<FaultRule, 'method' | 'times'> = {}
  ) => {
    await control('POST', { ...rule, path: bffRoute(route), hang: true })
  },
  /** Forward matching requests after a pause (a slow BFF). */
  delay: async (
    route: string,
    delayMs: number,
    rule: Pick<FaultRule, 'method' | 'times'> = {}
  ) => {
    await control('POST', { ...rule, path: bffRoute(route), delayMs })
  },
  /** Active rules with how many requests each one caught. */
  list: async () => (await (await control('GET')).json()) as ActiveFault[],
  /** Requests caught by all active rules together. */
  totalHits: async () =>
    ((await (await control('GET')).json()) as ActiveFault[]).reduce(
      (sum, rule) => sum + rule.hits,
      0
    ),
  reset: async () => {
    await control('DELETE')
  },
}

export type FaultProxy = typeof faultProxy
