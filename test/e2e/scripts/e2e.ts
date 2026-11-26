/**
 * `npm run e2e -- [category=integration ...] [playwright args]`
 * e.g. `npm run e2e -- commerce=commercetools search=algolia --project desktop`
 *
 * Categories default to mock. The choice is validated here, then passed to
 * Playwright (and the stack it starts) as E2E_<CATEGORY> env vars.
 */

import { spawnSync } from 'node:child_process'
import {
  integrationEnv,
  resolveIntegrations,
  splitIntegrationArgs,
} from '../stack/integration-choice'

const { choices, rest } = splitIntegrationArgs(process.argv.slice(2))
const env = { ...process.env, ...integrationEnv(choices) }

try {
  resolveIntegrations(env)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

const cli = require.resolve('@playwright/test/cli')
const { status } = spawnSync(process.execPath, [cli, 'test', ...rest], {
  stdio: 'inherit',
  env,
})
process.exit(status ?? 1)
