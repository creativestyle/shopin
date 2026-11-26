/**
 * Fixtures for journey and smoke specs. Import `test` / `signedInTest` and
 * `expect` from here, never from @playwright/test.
 *
 * - Every test runs in a fresh browser context (own cookies, own guest cart).
 * - `@mock-only` tests are skipped with a reason when the run uses another
 *   integration, so the report lists them as not run.
 * - On the local mock stack, any browser request to an outside host fails the test.
 * - `faults` drives the fault proxy and resets it after the test.
 * - `signedInTest` starts signed in as an account only its worker uses, with
 *   an empty cart.
 */

import { test as base, expect, type Browser } from '@playwright/test'
import { BFF_URL, STOREFRONT_URL, USES_EXTERNAL_STACK } from '../../config'
import { isMockRun, resolveIntegrations } from '../../stack/integration-choice'
import { bffApi, emptyCart } from './bff-api'
import { journeyStorageState } from './cookies'
import { faultProxy, type FaultProxy } from './faults'
import { uniqueEmail } from './test-data'

export const INTEGRATIONS = resolveIntegrations()
export const DATA_SOURCE = INTEGRATIONS.dataSource

export const MOCK_ONLY_TAG = '@mock-only'

const LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  new URL(STOREFRONT_URL).hostname,
  new URL(BFF_URL).hostname,
])

export interface Account {
  email: string
  password: string
  firstName: string
  lastName: string
}

type TestFixtures = {
  faults: FaultProxy
  mockOnlyGuard: void
  outsideRequestGuard: void
}

type WorkerFixtures = {
  account: Account
  signedInState: Awaited<ReturnType<typeof signIn>>
}

async function newApiContext(browser: Browser) {
  return browser.newContext({
    baseURL: STOREFRONT_URL,
    storageState: journeyStorageState(STOREFRONT_URL, DATA_SOURCE),
  })
}

async function signIn(browser: Browser, account: Account) {
  const context = await newApiContext(browser)
  await bffApi(context.request, DATA_SOURCE).post('auth/login', {
    email: account.email,
    password: account.password,
  })
  const state = await context.storageState()
  await context.close()
  return state
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  mockOnlyGuard: [
    async ({}, use, testInfo) => {
      if (testInfo.tags.includes(MOCK_ONLY_TAG) && !isMockRun(INTEGRATIONS)) {
        testInfo.skip(
          true,
          `mock-only: not run on ${INTEGRATIONS.dataSource}, only the mock serves this step`
        )
      }
      await use()
    },
    { auto: true },
  ],

  outsideRequestGuard: [
    async ({ context }, use) => {
      if (USES_EXTERNAL_STACK || !isMockRun(INTEGRATIONS)) {
        await use()
        return
      }
      const blocked: string[] = []
      await context.route(
        (url) => !LOCAL_HOSTS.has(url.hostname),
        (route) => {
          blocked.push(route.request().url())
          return route.abort('blockedbyclient')
        }
      )
      await use()
      expect(blocked, 'Browser requests to outside hosts').toEqual([])
    },
    { auto: true },
  ],

  faults: async ({}, use, testInfo) => {
    testInfo.skip(USES_EXTERNAL_STACK, 'needs the local fault proxy')
    await faultProxy.reset()
    await use(faultProxy)
    await faultProxy.reset()
  },

  account: [
    async ({ browser }, use, workerInfo) => {
      const account: Account = {
        email: uniqueEmail(`worker${workerInfo.parallelIndex}`),
        password: `E2e-${Math.random().toString(36).slice(2, 10)}`,
        firstName: 'E2E',
        lastName: `Worker${workerInfo.parallelIndex}`,
      }
      const context = await newApiContext(browser)
      const api = bffApi(context.request, DATA_SOURCE)
      const { emailToken } = await api.post<{ emailToken?: string }>(
        'auth/register',
        { ...account, acceptTerms: true }
      )
      expect(emailToken, 'register returns the confirmation token').toBeTruthy()
      await api.post('auth/confirm-email', { tokenValue: emailToken })
      await context.close()
      await use(account)
    },
    { scope: 'worker' },
  ],

  signedInState: [
    async ({ browser, account }, use) => {
      await use(await signIn(browser, account))
    },
    { scope: 'worker' },
  ],
})

/** Starts each test signed in as the worker's account, with an empty cart. */
export const signedInTest = test.extend<{ emptyCustomerCart: void }>({
  storageState: async ({ signedInState }, use) => {
    await use(signedInState)
  },
  emptyCustomerCart: [
    async ({ context }, use) => {
      await emptyCart(bffApi(context.request, DATA_SOURCE))
      await use()
    },
    { auto: true },
  ],
})

export { expect }
