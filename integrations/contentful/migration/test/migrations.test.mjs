/**
 * The migrations without Contentful: every migration file is discovered in GG-SS-NN order with a unique sort
 * key, every one loads and exports the migration function contentful-migration calls, and each command runs
 * the right slice (reset alone, apply without reset, --from).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import discovery from '../dist/scripts/lib/discovery.js'
import select from '../dist/scripts/lib/select.js'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distMigrations = join(root, 'dist/migrations')
const { getMigrationEntries } = discovery
const { parseFrom, selectEntriesToRun } = select
const entries = getMigrationEntries(distMigrations)

/** Every NN-NN-NN-*.ts migration source, outside lib/. */
function sourceMigrations(dir = join(root, 'migrations')) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? e.name === 'lib'
        ? []
        : sourceMigrations(join(dir, e.name))
      : /^\d{2}-\d{2}-\d{2}-[\w-]+\.ts$/.test(e.name)
        ? [e.name.replace(/\.ts$/, '.js')]
        : []
  )
}

test('every migration source is discovered once, in sort-key order, with unique keys', () => {
  assert.deepEqual(
    entries.map((e) => e.filename).sort(),
    sourceMigrations().sort()
  )
  const keys = entries.map((e) => e.sortKey)
  assert.deepEqual(
    keys,
    [...keys].sort((a, b) => a - b)
  )
  assert.equal(new Set(keys).size, keys.length)
  assert.equal(entries[0].filename, '00-00-01-reset.js')
  for (const e of entries) {
    assert.equal(e.sortKey, e.g * 10000 + e.s * 100 + e.n)
    assert.ok(
      e.relativePath.startsWith(`${e.filename.slice(0, 5)}-`),
      e.relativePath
    )
  }
})

test('every migration loads and exports the function contentful-migration runs', () => {
  for (const e of entries) {
    const migration = require(join(distMigrations, e.relativePath))
    assert.equal(typeof migration, 'function', e.relativePath)
  }
})

test('discovery without a build names the missing dist', () => {
  assert.throws(
    () => getMigrationEntries(join(root, 'no-such-dir')),
    /Run npm run build first/
  )
})

const spec = (kind) => ({ name: kind, description: '', fromOption: true, kind })

test('reset runs only 00-00, apply everything else, content-types group 01, demo group 02', () => {
  const reset = selectEntriesToRun(spec('reset'), entries, undefined)
  assert.ok(reset.length > 0)
  assert.ok(reset.every((e) => e.g === 0 && e.s === 0))
  const apply = selectEntriesToRun(spec('apply'), entries, undefined)
  assert.equal(apply.length + reset.length, entries.length)
  assert.equal(
    apply.some((e) => e.g === 0 && e.s === 0),
    false
  )
  assert.ok(
    selectEntriesToRun(spec('content-types'), entries).every((e) => e.g === 1)
  )
  assert.ok(selectEntriesToRun(spec('demo'), entries).every((e) => e.g === 2))
})

test('--from starts at that sort key, and the reset ignores it', () => {
  const from = entries.find((e) => e.g === 1 && e.n > 1).sortKey
  const run = selectEntriesToRun(spec('apply'), entries, from)
  assert.equal(run[0].sortKey, from)
  assert.ok(run.every((e) => e.sortKey >= from))
  assert.deepEqual(
    selectEntriesToRun(spec('reset'), entries, 99999),
    selectEntriesToRun(spec('reset'), entries, undefined)
  )
})

test('--from accepts a non-negative integer only', () => {
  assert.equal(parseFrom({ from: '10104' }), 10104)
  assert.equal(parseFrom({ from: '0' }), 0)
  assert.equal(parseFrom({}), null)
  assert.equal(parseFrom({ from: '' }), null)
  assert.equal(parseFrom({ from: '-1' }), null)
  assert.equal(parseFrom({ from: 'abc' }), null)
})
