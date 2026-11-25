#!/usr/bin/env node
/**
 * Contentful migration CLI.
 * Usage: npm run migrate -- [command] [options]. See --help.
 */
import path from 'path'
import { Command } from 'commander'
import { getMigrationEntries, type MigrationEntry } from './lib/discovery'
import { requireEnv } from './lib/env'
import { runMigrations } from './lib/runner'

const baseDir = path.join(__dirname, '..')
const migrationsDir = path.join(baseDir, 'migrations')
const packageRoot = path.join(baseDir, '..')

interface CommandOpts {
  from?: string
  list?: boolean
}

interface CommandSpec {
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
function parseFrom(opts: CommandOpts): number | null {
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
function selectEntriesToRun(
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

// --- Command definitions (single source of truth) ---
const COMMANDS: CommandSpec[] = [
  {
    name: 'migrate',
    description: 'Run all migrations (except reset) in triple order',
    fromOption: true,
    kind: 'apply',
    default: true,
  },
  {
    name: 'migrate:interactive',
    description: 'Same as migrate but interactive (prompts for confirmation)',
    fromOption: true,
    kind: 'apply',
    interactive: true,
  },
  {
    name: 'reset',
    description: 'Run only 00-00-* reset migration(s)',
    fromOption: false,
    kind: 'reset',
  },
  {
    name: 'migrate:content-types',
    description: 'Run only content-type migrations (group 01)',
    fromOption: true,
    kind: 'content-types',
  },
  {
    name: 'migrate:demo',
    description: 'Run only demo migrations (group 02)',
    fromOption: true,
    kind: 'demo',
  },
]

async function runCommand(spec: CommandSpec, opts: CommandOpts): Promise<void> {
  const contentfulEnv = requireEnv()
  const listOnly = opts.list === true
  const fromSortKey = parseFrom(opts)

  if (opts.from != null && opts.from !== '' && fromSortKey === null) {
    throw new Error(
      `Invalid --from value: must be a non-negative integer, got "${opts.from}".`
    )
  }

  const allEntries = getMigrationEntries(migrationsDir)
  const entriesToRun = selectEntriesToRun(
    spec,
    allEntries,
    fromSortKey ?? undefined
  )

  if (
    spec.kind !== 'reset' &&
    fromSortKey != null &&
    entriesToRun.length === 0
  ) {
    throw new Error(`No migrations to run with --from ${fromSortKey}.`)
  }

  if (entriesToRun.length === 0) {
    const errorMessage =
      spec.kind === 'reset'
        ? 'No 00-00-* reset migration(s) found.'
        : 'No migration files found.'
    throw new Error(errorMessage)
  }

  const showFromMessage =
    spec.kind === 'apply' && fromSortKey != null && entriesToRun.length > 0
  if (showFromMessage) {
    const first = entriesToRun[0]
    if (first) {
      console.log(
        `  Starting from ${first.relativePath} (--from ${fromSortKey})\n`
      )
    }
  }

  const autoConfirm = !spec.interactive
  if (listOnly) {
    console.log(
      `Would run ${entriesToRun.length} migration(s) (--yes: ${autoConfirm}):\n`
    )
    entriesToRun.forEach((entry) => console.log(`  ${entry.relativePath}`))
    console.log('')
    return
  }

  const success = await runMigrations(
    entriesToRun,
    autoConfirm,
    contentfulEnv,
    {
      migrationsDir,
      packageRoot,
    }
  )
  if (!success) {
    throw new Error('One or more migrations failed.')
  }
  console.log(`\n✅ Done. Ran ${entriesToRun.length} migration(s).`)
}

function listEntries(): void {
  const entries = getMigrationEntries(migrationsDir)
  console.log(`${entries.length} migration(s):\n`)
  entries.forEach((entry) => console.log(`  ${entry.relativePath}`))
  console.log('')
}

// --- CLI setup ---
const program = new Command()

program
  .name('run-migrations.js')
  .description('Run Contentful migrations (expects dist/ from npm run build)')
  .version('1.0.0')

program
  .command('list')
  .description('List all migration files in order')
  .action(listEntries)

for (const commandSpec of COMMANDS) {
  const subcommand = program
    .command(commandSpec.name)
    .description(commandSpec.description)
  if (commandSpec.fromOption) {
    subcommand.option(
      '--from <number>',
      'Start from migration sort key (e.g. 10103)'
    )
  }
  subcommand.option(
    '--list',
    'Only list migrations that would run, do not execute'
  )
  subcommand.action(async (opts: CommandOpts) => {
    await runCommand(commandSpec, opts)
  })
}

async function main(): Promise<void> {
  try {
    const cliArgs = process.argv.slice(2)
    if (cliArgs.length === 0) {
      console.log('🚀 Contentful migrations\n')
      const defaultSpec = COMMANDS.find((c) => c.default) ?? COMMANDS[0]
      if (!defaultSpec) {
        throw new Error('No commands defined.')
      }
      await runCommand(defaultSpec, {})
      return
    }
    await program.parseAsync()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    program.error(message)
  }
}

main()
