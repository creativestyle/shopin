/**
 * The current run: its id (set once in playwright.config.ts, inherited by the
 * workers) and a log of what tests created, which global teardown reports.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

export const RUN_ID = process.env.E2E_RUN_ID ?? 'local'

const runLog = path.resolve(
  __dirname,
  '../../test-results',
  `e2e-run-${RUN_ID}.jsonl`
)

export interface RunLogEntry {
  kind: 'account' | 'cart' | 'wishlist'
  id: string
  cleaned: boolean
  reason?: string
}

export function logCreated(entry: RunLogEntry) {
  mkdirSync(path.dirname(runLog), { recursive: true })
  appendFileSync(runLog, `${JSON.stringify(entry)}\n`)
}

export function readRunLog(): RunLogEntry[] {
  if (!existsSync(runLog)) return []
  return readFileSync(runLog, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RunLogEntry)
}

/** Worker process of the run (`main` outside a worker); unique, unlike the parallel index a restarted worker reuses. */
export const workerLabel = () =>
  process.env.TEST_WORKER_INDEX !== undefined
    ? `w${process.env.TEST_WORKER_INDEX}`
    : 'main'
