import { defineConfig, devices, type Project } from '@playwright/test'
import path from 'node:path'
import {
  APP_PORT,
  MOCK_BFF_PORT,
  APP_BASE,
  FAULT_PROXY_PORT,
  STOREFRONT_URL,
  USES_EXTERNAL_STACK,
} from './config'
import { READY_PATH } from './fault-proxy/server'
import { journeyStorageState } from './journeys/support/cookies'
import { resolveIntegrations } from './stack/integration-choice'

// One id per run, inherited by the workers: data a test creates carries it
process.env.E2E_RUN_ID ??= `${new Date()
  .toISOString()
  .replace(/\D/g, '')
  .slice(0, 12)}-${Math.random().toString(36).slice(2, 6)}`

const appDir = path.resolve(__dirname, '../../apps/presentation')
const e2eDir = path.resolve(__dirname)
// ts-node from the root workspace (hoisted by npm workspaces).
const tsNode = path.resolve(__dirname, '../../node_modules/.bin/ts-node')
const isCI = !!process.env.CI
// Fault specs run in a second pass of scripts/e2e.ts, alone, after everything else
const isFaultRun = process.env.E2E_FAULT_RUN === '1'

const integrations = resolveIntegrations()

// Consent banner and demo notice answered up front so neither modal hides the page
const platformStorageState = journeyStorageState(APP_BASE)

// Journey and smoke specs: black-box against STOREFRONT_URL and BFF_URL
const journeyUse = {
  baseURL: STOREFRONT_URL,
  locale: process.env.E2E_LOCALE ?? 'en-US',
  timezoneId: 'Europe/Berlin',
  storageState: journeyStorageState(STOREFRONT_URL, integrations.dataSource),
}
const journeyFiles = ['journeys/**/*.spec.ts', 'smoke/**/*.spec.ts']
const faultFiles = '**/*.fault.spec.ts'

const journeyProjects: Project[] = [
  {
    name: 'desktop',
    testDir: '.',
    // Device tags pick the project (AGENTS.md: "Tags, projects and waits")
    grep: /@desktop/,
    testMatch: journeyFiles,
    testIgnore: faultFiles,
    use: { ...devices['Desktop Chrome'], ...journeyUse },
  },
  {
    name: 'phone',
    testDir: '.',
    grep: /@mobile/,
    testMatch: journeyFiles,
    testIgnore: faultFiles,
    use: { ...devices['Pixel 7'], ...journeyUse },
  },
  {
    // Fault rules and cache expiry reach every server sharing the build, so
    // these run alone: only in the fault pass (E2E_FAULT_RUN=1, see scripts/e2e.ts)
    name: 'faults',
    testDir: '.',
    grep: /@desktop/,
    testMatch: faultFiles,
    testIgnore: isFaultRun ? [] : '**/*',
    workers: 1,
    use: { ...devices['Desktop Chrome'], ...journeyUse },
  },
]

export default defineConfig({
  fullyParallel: false,
  workers: isCI ? 2 : undefined,
  retries: isCI ? 1 : 0,
  // A test that passes only on retry is flaky, not green
  failOnFlakyTests: isCI,
  // The fault pass keeps its own results, so it does not wipe the first pass's traces
  outputDir: isFaultRun ? 'test-results/faults' : 'test-results',
  reporter: isCI
    ? [
        ['github'],
        [
          'html',
          {
            open: 'never',
            outputFolder: isFaultRun
              ? 'playwright-report/faults'
              : 'playwright-report',
          },
        ],
        ['./reporters/ci-summary.ts'],
      ]
    : 'list',
  timeout: 30_000,

  use: {
    trace: isCI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  projects: [
    {
      // Variant routing, draft preview, ISR and locales against the recording mock BFF.
      // Its single shared request log needs one worker (resetRequests() races otherwise).
      name: 'platform',
      testDir: './specs',
      testIgnore: '**/preview-iframe.spec.ts',
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: APP_BASE,
        storageState: platformStorageState,
      },
    },
    {
      // Dedicated project for the cross-origin iframe test.  The test page
      // navigates to FAKE_CMS_BASE so the iframe is genuinely cross-origin.
      name: 'platform-crossorigin',
      testDir: './specs',
      testMatch: '**/preview-iframe.spec.ts',
      workers: 1,
      // Shares the mock BFF request log, so it waits for the platform project
      dependencies: ['platform'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: APP_BASE,
        storageState: platformStorageState,
      },
    },
    ...journeyProjects,
  ],

  // Mock BFF must start before Next.js so translation fetches during the
  // Next.js readiness probe always succeed: it is ready in <100 ms, Next.js
  // takes seconds.
  // Readiness URLs use explicit 127.0.0.1: Playwright's probe resolves localhost
  // to ::1, and the Next standalone server does not answer on IPv6 loopback in
  // sandboxed environments (the probe hangs forever). Browser traffic still uses
  // localhost (APP_BASE) — the servers listen dual-stack.
  webServer: [
    {
      // Recording mock BFF — always freshly started so the request log is empty.
      command: `cd ${e2eDir} && ${tsNode} --project tsconfig.json mock-bff/standalone.ts`,
      url: `http://127.0.0.1:${MOCK_BFF_PORT}/__requests`,
      timeout: 15_000,
      reuseExistingServer: false,
    },
    {
      // Platform storefront. Build once with `npm run build` in test/e2e; the
      // server is reused across runs for fast iteration. globalSetup calls
      // /api/e2e/revalidate, which hard-expires all Data Cache entries.
      command: `cd ${appDir} && npm run start:e2e`,
      url: `http://127.0.0.1:${APP_PORT}/`,
      timeout: 30_000,
      reuseExistingServer: true,
    },
    // Journey stack: storefront → fault proxy → real BFF (stack/start-stack.ts)
    ...(USES_EXTERNAL_STACK
      ? []
      : [
          {
            command: `cd ${e2eDir} && ${tsNode} --project tsconfig.json stack/start-stack.ts`,
            url: `http://127.0.0.1:${FAULT_PROXY_PORT}${READY_PATH}`,
            timeout: 120_000,
            reuseExistingServer: !isCI,
            stdout: 'pipe' as const,
          },
        ]),
  ],
})
