/** Which migrations a command runs: pure, so it is tested without Contentful. */
import type { MigrationEntry } from './discovery'

export interface CommandOpts {
  from?: string
  list?: boolean
}

export interface CommandSpec {
  name: string
  description: string
  fromOption: boolean
  /** Which migrations to run; 'apply' = all except reset */
  kind: 'reset' | 'content-types' | 'demo' | 'apply'
  /** Prompt for confirmation before each migration (default false) */
  interactive?: boolean
  /** Run this command when no subcommand is passed */
  default?: boolean
}

// --- Option parsing ---
export function parseFrom(opts: CommandOpts): number | null {
  const fromRaw = opts.from
  if (fromRaw == null || fromRaw === '') {
    return null
  }
  const fromSortKey = parseInt(fromRaw, 10)
  if (Number.isNaN(fromSortKey) || fromSortKey < 0) {
    return null
  }
  return fromSortKey
}

// --- Which entries to run per command ---
export function selectEntriesToRun(
  spec: CommandSpec,
  allEntries: MigrationEntry[],
  fromSortKey: number | null | undefined
): MigrationEntry[] {
  const resetEntries = allEntries.filter(
    (entry) => entry.g === 0 && entry.s === 0
  )
  const applyEntries = allEntries.filter(
    (entry) => !(entry.g === 0 && entry.s === 0)
  )
  const contentTypesEntries = allEntries.filter((entry) => entry.g === 1)
  const demoEntries = allEntries.filter((entry) => entry.g === 2)
  const entriesFromSortKey = (entries: MigrationEntry[]) =>
    fromSortKey != null
      ? entries.filter((entry) => entry.sortKey >= fromSortKey)
      : entries

  switch (spec.kind) {
    case 'reset':
      return resetEntries
    case 'content-types':
      return entriesFromSortKey(contentTypesEntries)
    case 'demo':
      return entriesFromSortKey(demoEntries)
    case 'apply':
      return entriesFromSortKey(applyEntries)
  }
}
