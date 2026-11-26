/**
 * Fixtures for journey and smoke specs. Import `test`, `signedInTest`,
 * `freshAccountTest` and `expect` from here, never from @playwright/test.
 *
 * - Every test runs in a fresh browser context (own cookies, own guest cart).
 * - `@mock-only` tests are skipped with a reason when the run uses another
 *   integration; `@local-only` tests (they need an outside test system) are
 *   skipped with a reason in CI. Both are reported as not run.
 * - On the local mock stack, any browser request to an outside host fails the test.
 * - `faults` drives the fault proxy and resets it after the test.
 * - `signedInTest` signs in (per test) as an account only its worker uses, with
 *   an empty cart. `freshAccountTest` signs in as an account of its own, for
 *   tests that sign out or change the password or e-mail.
 * - On another integration, each test's cart and wishlist are emptied after it
 *   and every account is logged for the run's cleanup report.
 */

import {
  test as base,
  expect,
  type Browser,
  type BrowserContext,
} from '@playwright/test'
import { BFF_URL, STOREFRONT_URL, USES_EXTERNAL_STACK } from '../../config'
import { isMockRun, resolveIntegrations } from '../../stack/integration-choice'
import { bffApi, emptyCart, emptyWishlist } from './bff-api'
import { journeyStorageState } from './cookies'
import { faultProxy, type FaultProxy } from './faults'
import { logCreated } from './run'
import { uniqueEmail } from './test-data'

export const INTEGRATIONS = resolveIntegrations()
export const DATA_SOURCE = INTEGRATIONS.dataSource

export const MOCK_ONLY_TAG = '@mock-only'
export const LOCAL_ONLY_TAG = '@local-only'

const IS_CI = !!process.env.CI
const CLEANS_UP = !isMockRun(INTEGRATIONS)

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

type StorageState = Awaited<ReturnType<typeof signIn>>

type TestFixtures = {
  faults: FaultProxy
  tagGuard: void
  outsideRequestGuard: void
  runDataCleanup: void
}

type WorkerFixtures = {
  account: Account
}

async function newApiContext(browser: Browser) {
  return browser.newContext({
    baseURL: STOREFRONT_URL,
    storageState: journeyStorageState(STOREFRONT_URL, DATA_SOURCE),
  })
}

/** Registers and confirms an account through the BFF. */
async function createAccount(browser: Browser, label: string) {
  const account: Account = {
    email: uniqueEmail(label),
    password: `E2e-${Math.random().toString(36).slice(2, 10)}`,
    firstName: 'E2E',
    lastName: label,
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
  if (CLEANS_UP) {
    logCreated({
      kind: 'account',
      id: account.email,
      cleaned: false,
      reason: 'the BFF has no endpoint to delete a customer',
    })
  }
  return account
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

async function emptyCustomerCartFixture(
  { context }: { context: BrowserContext },
  use: () => Promise<void>
) {
  await emptyCart(bffApi(context.request, DATA_SOURCE))
  await use()
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  tagGuard: [
    async ({}, use, testInfo) => {
      if (testInfo.tags.includes(MOCK_ONLY_TAG) && !isMockRun(INTEGRATIONS)) {
        testInfo.skip(
          true,
          `mock-only: not run on ${INTEGRATIONS.dataSource}, only the mock serves this step`
        )
      }
      if (testInfo.tags.includes(LOCAL_ONLY_TAG) && IS_CI) {
        testInfo.skip(
          true,
          'local-only: needs an outside test system, not run in CI'
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

  runDataCleanup: [
    async ({ context }, use, testInfo) => {
      await use()
      if (!CLEANS_UP) {
        return
      }
      // The mock forgets everything with its BFF; other backends keep it
      const api = bffApi(context.request, DATA_SOURCE)
      for (const [kind, empty] of [
        ['cart', emptyCart],
        ['wishlist', emptyWishlist],
      ] as const) {
        try {
          const id = await empty(api)
          if (id) {
            logCreated({ kind, id, cleaned: true })
          }
        } catch (error) {
          logCreated({
            kind,
            id: testInfo.titlePath.join(' › '),
            cleaned: false,
            reason: String(error),
          })
        }
      }
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
      await use(await createAccount(browser, `worker${workerInfo.workerIndex}`))
    },
    { scope: 'worker' },
  ],
})

/**
 * Signs in (per test) as the worker's account, with an empty cart. A test that
 * signs out ends only its own session; one that changes the password or
 * e-mail uses `freshAccountTest` instead.
 */
export const signedInTest = test.extend<{
  signedInState: StorageState
  emptyCustomerCart: void
}>({
  signedInState: async ({ browser, account }, use) => {
    await use(await signIn(browser, account))
  },
  storageState: async ({ signedInState }, use) => {
    await use(signedInState)
  },
  emptyCustomerCart: [emptyCustomerCartFixture, { auto: true }],
})

/** Signs in as an account of its own: for tests that change or end the account's access. */
export const freshAccountTest = test.extend<{
  freshAccount: Account
  signedInState: StorageState
  emptyCustomerCart: void
}>({
  freshAccount: async ({ browser }, use) => {
    await use(await createAccount(browser, 'fresh'))
  },
  signedInState: async ({ browser, freshAccount }, use) => {
    await use(await signIn(browser, freshAccount))
  },
  storageState: async ({ signedInState }, use) => {
    await use(signedInState)
  },
  emptyCustomerCart: [emptyCustomerCartFixture, { auto: true }],
})

export { expect }
