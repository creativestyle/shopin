/**
 * `npm run e2e -- [category=integration ...] [playwright args]`
 * e.g. `npm run e2e -- commerce=commercetools search=algolia --project desktop`
 *
 * Categories default to mock. The choice is validated here, then passed to
 * Playwright (and the stack it starts) as E2E_<CATEGORY> env vars.
 *
 * Runs in two passes with one run id: every project but `faults`, then the
 * fault specs alone (E2E_FAULT_RUN=1), so their global fault rules never reach
 * another test and a failure elsewhere does not hide them. Exits non-zero when
 * either pass fails. `--ui` runs a single pass with the fault specs included.
 */

import { spawnSync } from 'node:child_process'
import {
  integrationEnv,
  resolveIntegrations,
  splitIntegrationArgs,
} from '../stack/integration-choice'

const FAULTS_PROJECT = 'faults'

const { choices, rest } = splitIntegrationArgs(process.argv.slice(2))
const env: NodeJS.ProcessEnv = { ...process.env, ...integrationEnv(choices) }

try {
  resolveIntegrations(env)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

env.E2E_RUN_ID ??= `${new Date()
  .toISOString()
  .replace(/\D/g, '')
  .slice(0, 12)}-${Math.random().toString(36).slice(2, 6)}`

/** Splits `--project x` / `--project=x` from the other Playwright args. */
function splitProjects(args: string[]) {
  const projects: string[] = []
  const others: string[] = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--project' && args[i + 1]) {
      projects.push(args[++i])
    } else if (arg.startsWith('--project=')) {
      projects.push(arg.slice('--project='.length))
    } else {
      others.push(arg)
    }
  }
  return { projects, others }
}

const cli = require.resolve('@playwright/test/cli')
const playwright = (args: string[], extraEnv: NodeJS.ProcessEnv = {}) =>
  spawnSync(process.execPath, [cli, 'test', ...args], {
    stdio: 'inherit',
    env: { ...env, ...extraEnv },
  }).status ?? 1

if (rest.includes('--ui')) {
  process.exit(playwright(rest, { E2E_FAULT_RUN: '1' }))
}

const { projects, others } = splitProjects(rest)
const mainProjects = projects.filter((name) => name !== FAULTS_PROJECT)
const runsMain = projects.length === 0 || mainProjects.length > 0
const runsFaults = projects.length === 0 || projects.includes(FAULTS_PROJECT)

// One token each: `--project` takes several values, so `--project x file` would read file as a project
const projectArgs = (names: string[]) =>
  names.map((name) => `--project=${name}`)

// Flags whose next argument is their value, not a file filter
const FLAGS_WITH_VALUE = new Set([
  '-c',
  '--config',
  '-g',
  '--grep',
  '--grep-invert',
  '-j',
  '--workers',
  '--reporter',
  '--retries',
  '--repeat-each',
  '--max-failures',
  '--timeout',
  '--output',
  '--shard',
  '--trace',
  '--tsconfig',
])
const FILTER_FLAGS = [
  '-g',
  '--grep',
  '--grep-invert',
  '--last-failed',
  '--only-changed',
]

/** A file, line or grep filter, which may leave one of the passes without tests. */
function isFiltered(args: string[]) {
  return args.some((arg, i) => {
    const flag = arg.split('=')[0]
    if (FILTER_FLAGS.includes(flag)) return true
    const isValue = i > 0 && FLAGS_WITH_VALUE.has(args[i - 1])
    return !arg.startsWith('-') && !isValue
  })
}

// A plain run stays strict about finding tests; a filtered one may match only one pass
const passArgs = isFiltered(others)
  ? [...others, '--pass-with-no-tests']
  : others

let status = 0
if (runsMain) {
  status = playwright([...projectArgs(mainProjects), ...passArgs])
}
if (runsFaults) {
  const faultStatus = playwright(
    [...projectArgs([FAULTS_PROJECT]), ...passArgs],
    { E2E_FAULT_RUN: '1' }
  )
  status ||= faultStatus
}
process.exit(status)
