import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import { LOCALE } from './journeys/support/i18n'

// Shopping journeys against the real stack: presentation → BFF → commercetools.
// BASE_URL targets a deployed environment; E2E_LOCALE (en-US, de-DE) picks the language.
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'
const isCI = !!process.env.CI
const rootDir = path.resolve(__dirname, '../..')

export default defineConfig({
  testDir: './journeys',
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    locale: LOCALE,
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    storageState: {
      cookies: [
        {
          name: 'demo-disclaimer-acknowledged',
          value: 'true',
          domain: new URL(baseURL).hostname,
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

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Locally, already running dev or start:local servers are reused.
  webServer: process.env.BASE_URL
    ? undefined
    : [
        {
          command: 'npm run start:local',
          cwd: path.join(rootDir, 'apps/bff'),
          url: 'http://127.0.0.1:4000/bff/store-config',
          timeout: 180_000,
          reuseExistingServer: !isCI,
          // Secure routes allow 5 req/min, which a checkout run exceeds.
          env: { BFF_RATE_LIMIT_ENABLED: 'false' },
        },
        {
          command: 'npm run start:local',
          cwd: path.join(rootDir, 'apps/presentation'),
          url: 'http://127.0.0.1:3000/',
          timeout: 300_000,
          reuseExistingServer: !isCI,
        },
      ],
})
