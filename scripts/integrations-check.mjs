#!/usr/bin/env node
/**
 * Lint, format, type-check and test every integration package that is installed here: the ones the shop's
 * config uses (and their tools), plus those with no third-party packages at all. A dormant integration (its
 * vendor SDK not installed) is listed and skipped: checking it needs its SDK, which this shop does not install.
 * With the demo on (`npm run use demo`) every integration is installed, so nothing is skipped.
 *
 *   node scripts/integrations-check.mjs [turbo args]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const checked = []
const skipped = []
for (const folder of readdirSync('integrations', { withFileTypes: true })) {
  if (!folder.isDirectory() || folder.name.startsWith('.')) continue
  for (const p of readdirSync(join('integrations', folder.name), { withFileTypes: true })) {
    const manifest = join('integrations', folder.name, p.name, 'package.json')
    if (!existsSync(manifest)) continue
    const { name, peerDependencies = {}, peerDependenciesMeta = {} } = JSON.parse(readFileSync(manifest, 'utf8'))
    const missing = Object.keys(peerDependencies).filter(
      (d) => peerDependenciesMeta[d]?.optional && !existsSync(join('node_modules', d, 'package.json'))
    )
    if (missing.length) skipped.push(`${name} (not installed: ${missing.join(', ')})`)
    else checked.push({ name, dependencies: Object.keys(JSON.parse(readFileSync(manifest, 'utf8')).dependencies ?? {}) })
  }
}
// a package built on a dormant one (the demo's shop on the vendors) is dormant too: its tasks would run the other's
for (let changed = true; changed; ) {
  changed = false
  for (const [i, { name, dependencies }] of checked.entries()) {
    const dormant = dependencies.filter((d) => skipped.some((s) => s.startsWith(`${d} `)))
    if (dormant.length) {
      skipped.push(`${name} (built on ${dormant.join(', ')})`)
      checked.splice(i, 1)
      changed = true
      break
    }
  }
}
console.log(`integrations: checking ${checked.length}; dormant, skipped: ${skipped.length ? '\n  ' + skipped.join('\n  ') : 'none'}`)
const r = spawnSync(
  'npx',
  ['turbo', 'run', 'lint', 'format:check', 'check-types', 'test', ...checked.map(({ name }) => `--filter=${name}`), ...process.argv.slice(2)],
  { stdio: 'inherit' }
)
process.exit(r.status ?? 1)
