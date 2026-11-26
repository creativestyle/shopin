/**
 * The one list of part folders under integrations/<vendor>/ (D-59: `integrations/<vendor>/<category>`, package
 * `@integrations/<vendor>-<category>`): the kit's categories (core/integration-kit/src/categories.json, the list the
 * kit's `CATEGORIES` is), `core` for the code a vendor's parts share (the only way they share code), and the shop's
 * own kinds of port. A part is a shop kind when its package.json says so (`"shopin": { "category": "<folder>" }`,
 * the same key as its config key). A tool of an integration (`"shopin": { "toolOf": [...] }`, a sync or a
 * migration) may sit in any folder of its vendor. Any other folder stops `npm run setup`, `config:check` and the
 * category check.
 */
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const KIT_CATEGORIES = JSON.parse(
  readFileSync(new URL('../../core/integration-kit/src/categories.json', import.meta.url), 'utf8'),
)
/** The folder of a vendor's shared code (`@integrations/<vendor>-core`): no descriptor, no category. */
export const SHARED = 'core'
export const FOLDERS = new Set(KIT_CATEGORIES)

const manifestOf = (dir) => {
  const m = join(dir, 'package.json')
  return existsSync(m) ? JSON.parse(readFileSync(m, 'utf8')) : undefined
}

/** Every part of every vendor: { vendor, part, dir, manifest } (folders with a package.json). */
export function partsOf(root = '.') {
  const parts = []
  const base = join(root, 'integrations')
  for (const vendor of readdirSync(base)) {
    const vdir = join(base, vendor)
    if (vendor.startsWith('.') || !statSync(vdir).isDirectory()) continue
    for (const part of readdirSync(vdir)) {
      const dir = join(vdir, part)
      if (part.startsWith('.') || !statSync(dir).isDirectory()) continue
      const manifest = manifestOf(dir)
      if (manifest) parts.push({ vendor, part, dir: join('integrations', vendor, part), manifest })
    }
  }
  return parts
}

/** FOLDERS plus the shop kinds found under `<root>/integrations/<vendor>/`. */
export function foldersOf(root = '.') {
  const kinds = partsOf(root)
    .filter(({ part, manifest }) => !FOLDERS.has(part) && part !== SHARED && manifest.shopin?.category === part)
    .map(({ part }) => part)
  return new Set([...FOLDERS, ...kinds])
}

/** Why a part's folder is not allowed, or undefined. */
export function folderProblem({ vendor, part, manifest }, folders) {
  if (folders.has(part) || part === SHARED || manifest.shopin?.toolOf) return undefined
  return `integrations/${vendor}/${part}/ is not a category folder (${[...folders].join(', ')}), not ${SHARED} (the vendor's shared code) and not a tool ("shopin": { "toolOf": [...] })`
}
