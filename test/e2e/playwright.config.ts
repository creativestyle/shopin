import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import { APP_PORT, MOCK_BFF_PORT, APP_BASE } from './config'

const appDir = path.resolve(__dirname, '../../apps/presentation')
const e2eDir = path.resolve(__dirname)
// ts-node from the root workspace (hoisted by npm workspaces).
const tsNode = path.resolve(__dirname, '../../node_modules/.bin/ts-node')

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  // The mock BFF has a single shared request log (GET/DELETE /__requests).
  // Running spec files in parallel across workers causes resetRequests() in one
  // file to wipe the log while another file is reading it, producing false 0-call
  // results.  workers: 1 ensures all files run serially so the shared log is safe.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,

  use: {
    baseURL: APP_BASE,
    trace: 'on-first-retry',
    // Pre-set the demo-disclaimer-acknowledged cookie so the "Demo Store Notice"
    // modal never blocks interaction with page elements in tests.
    storageState: {
      cookies: [
        {
          name: 'demo-disclaimer-acknowledged',
          value: 'true',
          domain: 'localhost',
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'Lax' as const,
          expires: -1,
        },
      ],
      origins: [],
    },
  },

  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/preview-iframe.spec.ts',
    },
    {
      // Dedicated project for the cross-origin iframe test.  The test page
      // navigates to FAKE_CMS_BASE so the iframe is genuinely cross-origin.
      name: 'chromium-crossorigin',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/preview-iframe.spec.ts',
    },
  ],

  // Two webServer entries: mock BFF must start before Next.js so translation
  // fetches during the Next.js readiness probe always succeed.
  // Playwright starts both simultaneously; the mock BFF becomes ready in <100 ms
  // whereas Next.js takes seconds, guaranteeing the mock BFF is up before any
  // page render touches port 3001.
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
      // Run `npm run build:e2e` in apps/presentation before the first test run.
      // The server is reused across runs (reuseExistingServer: true) for fast
      // iteration. globalSetup calls /api/e2e/revalidate which hard-expires all
      // Data Cache entries (in-memory and on-disk) via revalidateTag('*', { expire: 0 }),
      // ensuring probe slugs always get a cold hit without a server restart.
      command: `cd ${appDir} && npm run start:e2e`,
      url: `http://127.0.0.1:${APP_PORT}/`,
      timeout: 30_000,
      reuseExistingServer: true,
    },
  ],
})
