#!/usr/bin/env node
/**
 * Sets the repository up for the shop's config, and checks that it is set up.
 *
 *   npm run setup                 for config/shop/shopin.config.ts and config/storefront/storefront.mts
 *   npm run use <category> <integration> [<category> <integration> …]
 *                                 writes the imports and the lines into shopin.config.ts, then setup
 *   npm run use <category> off    takes the category out of shopin.config.ts (not commerce), then setup
 *   npm run use demo [off]        points both files at the SHOPin demo (and back), then setup
 *   npm run use demo remove       deletes demo/ for good (demo off, nothing else depending on it), then setup
 *   npm run config:check          (setup --check) exit 1 when a run of setup would change a tracked file
 *
 * Setup, in order (the last lines name what was installed and the next command):
 *
 *   1. .env: the first run creates it from .env.example with fresh random local keys; an existing .env is kept.
 *      config/locales.json (the shop's locales) is checked and copied to config/constants/src/locales.json.
 *   2. The shop config is read from its sources (TypeScript transpiled in memory, workspace packages from their
 *      src): what defineConfig refuses, a wrong pairing included, stops setup here, before any file changes.
 *      .env gets the variables the configured integrations need and lacks (empty, under a comment naming the
 *      integration and its README); the block of an integration no longer configured is commented out.
 *   3. Packages: the integrations the two files import, with their vendor SDKs (optional peers of the
 *      integration), are written into the package that imports them, and `npm install` runs when that changed:
 *        config/shop        (@shopin/config, the BFF's dependency)        ← the shop config
 *        config/storefront  (@shopin/storefront, the storefront's dependency) ← the storefront slots
 *        config/tools       (@shopin/tools, no app depends on it)          ← tools of the configured integrations
 *      An integration nobody imports is a dormant folder: no SDK, left out by `turbo prune`, never built or bundled.
 *   4. Build (turbo `setup` tasks) of what the BFF and the storefront use, the shop config first.
 *   5. config/storefront/storefront-data.json from the built config: labels, image hosts, variants, the slots the serving
 *      integrations need. The storefront build reads it and never loads the BFF side.
 *
 * The generated files (the config packages' dependencies, the lockfile, storefront-data.json, the locales copy) are
 * committed because `turbo prune` copies only committed files. Setup writes them from the shop's files, so after a
 * merge it rewrites them; it refuses only a config package.json with conflict markers (it cannot read it).
 *
 * --check: the packages, the lockfile and the category folders agree with the two files; the built config is what
 * the sources compile to; storefront-data.json is what the built config gives; the storefront slots fit the config
 * (every required slot provided). It warns (no failure) per locale that lacks texts
 * for SHOPin's message keys (they show in English). It needs a build (setup, or any build of the apps).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdtempSync, rmSync, statSync, realpathSync } from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'
import { foldersOf, partsOf, folderProblem } from './checks/categories.mjs'

const read = (p) => readFileSync(p, 'utf8')
const json = (p) => JSON.parse(read(p))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const text = (value) => JSON.stringify(value, null, 2) + '\n'
const sorted = (value) =>
  value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort()) : (value ?? {})

/** The two files setup reads; the demo is on when they re-export the demo's (`npm run use demo`). */
export const ENTRY = { 'config/shop': 'shopin.config.ts', 'config/storefront': 'storefront.mts' }
const OUT = { 'config/shop': 'dist/shopin.config.js', 'config/storefront': 'dist/storefront.mjs' }
const STOREFRONT_DATA = 'config/storefront/storefront-data.json'
const WIRED = 'config/storefront/wired.mts'
const SOURCES = 'config/storefront/sources.css'
const PACKAGES = ['config/shop', 'config/storefront', 'config/tools']

/** The shop's locales, and the copy @config/constants compiles (every app and integration reads that one list). */
export const LOCALES = 'config/locales.json'
export const LOCALES_COPY = 'config/constants/src/locales.json'

/** config/locales.json as the copy's text, or its problems (each names the entry and the fix). */
export function localesText(root = '.') {
  let table
  try {
    table = json(join(root, LOCALES))
  } catch (error) {
    return { problems: [`${LOCALES}: ${error.code === 'ENOENT' ? 'missing' : error.message}`] }
  }
  const problems = []
  const entries = table && typeof table === 'object' && !Array.isArray(table) ? Object.entries(table) : []
  if (!entries.length) problems.push(`${LOCALES}: list at least one locale ({ "en-US": { … } })`)
  const prefixes = new Map()
  for (const [tag, l] of entries) {
    const at = `${LOCALES} "${tag}"`
    if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})+$/.test(tag)) problems.push(`${at}: not an RFC 5646 tag such as fr-FR`)
    if (!l || typeof l !== 'object') {
      problems.push(`${at}: give urlPrefix, nativeName and currency`)
      continue
    }
    const extra = Object.keys(l).filter((k) => !['urlPrefix', 'nativeName', 'currency'].includes(k))
    if (extra.length)
      problems.push(`${at}: ${extra.join(', ')} is not a locale field (store keys are the commerce integration's option)`)
    if (typeof l.urlPrefix !== 'string' || !/^[a-z0-9-]+$/.test(l.urlPrefix))
      problems.push(`${at}: urlPrefix must be lower-case letters, digits or "-" (e.g. "fr")`)
    else if (prefixes.has(l.urlPrefix)) problems.push(`${at}: urlPrefix "${l.urlPrefix}" is also ${prefixes.get(l.urlPrefix)}'s`)
    else prefixes.set(l.urlPrefix, tag)
    if (typeof l.nativeName !== 'string' || !l.nativeName.trim()) problems.push(`${at}: nativeName is missing`)
    if (typeof l.currency !== 'string' || !/^[A-Z]{3}$/.test(l.currency))
      problems.push(`${at}: currency must be an ISO 4217 code such as EUR`)
  }
  return problems.length ? { problems } : { text: text(table) }
}

/** The leaf keys of a message file that have a text (`cart.title`). */
const textKeys = (messages, prefix = '') =>
  Object.entries(messages ?? {}).flatMap(([k, v]) =>
    v && typeof v === 'object' ? textKeys(v, `${prefix}${k}.`) : typeof v === 'string' && v.trim() ? [`${prefix}${k}`] : [],
  )

// value imports only (`import type` brings no integration in)
const importsOf = (source) =>
  [...source.matchAll(/^\s*(?:import|export)\s+(?!type\b)[^'"]*?from\s*['"]([^'"]+)['"]/gm)].map((m) => m[1])
// every import, types included (a library the shop's own files use must resolve for tsc too), and the lazy
// `typeof import('./x')` of a loader
const allImportsOf = (source) =>
  [
    ...source.matchAll(
      /^\s*(?:import|export)\s+[^'"]*?from\s*['"]([^'"]+)['"]|typeof import\(\s*['"]([^'"]+)['"]\s*\)/gm,
    ),
  ].map((m) => m[1] ?? m[2])
const SOURCE_EXT = ['', '.ts', '.tsx', '.mts', '/index.ts', '/index.tsx']
const FILE_MARK = '//@file '

/**
 * The text of a config package's entry and of every file of the shop's it reaches by a relative import (the
 * shop's own features, components, pages, the demo's files when the entry re-exports them), joined: setup reads
 * the packages they import from it. Each file's text starts with a `//@file <path>` line.
 */
export function sourceOf(dir, file) {
  const seen = new Set()
  const texts = []
  const visit = (path) => {
    if (seen.has(path) || !existsSync(path)) return
    seen.add(path)
    const source = read(path)
    texts.push(`${FILE_MARK}${path}\n${path.endsWith('.tsx') ? `${source}\nimport React from "react";` : source}`)
    for (const spec of allImportsOf(source).filter((s) => s.startsWith('.'))) {
      const base = join(dirname(path), spec.replace(/\.(m?js|jsx)$/, ''))
      const found = SOURCE_EXT.map((ext) => base + ext).find((f) => existsSync(f) && statSync(f).isFile())
      if (found && !found.includes('/node_modules/')) visit(found)
    }
  }
  visit(join(dir, file))
  return texts.join('\n')
}
const packageOf = (spec) =>
  spec
    .split('/')
    .slice(0, spec.startsWith('@') ? 2 : 1)
    .join('/')
/** The file of `sourceOf`'s text that imports `spec`. */
const fileImporting = (source, spec) =>
  source
    .split(FILE_MARK)
    .find((t) => importsOf(t).includes(spec))
    ?.split('\n')[0]

/**
 * Integration packages: name → { dir, manifest }, one per part folder `integrations/<vendor>/<part>`; a part is a
 * category, the vendor's shared `core` or a tool (scripts/checks/categories.mjs). The demo's packages (`demo/*`)
 * are listed too: the shop config imports them while the demo is on.
 */
export function integrationPackages(root = '.') {
  const folders = foldersOf(root)
  const packages = new Map()
  const problems = []
  for (const part of partsOf(root)) {
    const problem = folderProblem(part, folders)
    if (problem) problems.push(problem)
    packages.set(part.manifest.name, { dir: part.dir, manifest: part.manifest })
  }
  // the demo's packages (demo/<package>): installed into the config packages only while the demo is on
  if (existsSync(join(root, 'demo')))
    for (const d of readdirSync(join(root, 'demo'), { withFileTypes: true })) {
      const dir = join('demo', d.name)
      if (d.isDirectory() && existsSync(join(root, dir, 'package.json')))
        packages.set(json(join(root, dir, 'package.json')).name, { dir, manifest: json(join(root, dir, 'package.json')) })
    }
  return { packages, problems }
}

/** The workspace folders of the root package.json (its globs expanded). */
function workspaceDirs(root = '.') {
  return json(join(root, 'package.json')).workspaces.flatMap((glob) => {
    let dirs = ['']
    for (const part of glob.split('/'))
      dirs = dirs.flatMap((d) =>
        part === '*'
          ? existsSync(join(root, d))
            ? readdirSync(join(root, d), { withFileTypes: true })
                .filter((e) => e.isDirectory())
                .map((e) => join(d, e.name))
            : []
          : [join(d, part)],
      )
    return dirs.filter((d) => existsSync(join(root, d, 'package.json')))
  })
}

/** The app each config package belongs to: a library the shop's files import takes the app's version. */
const APP_OF = { 'config/shop': 'apps/bff', 'config/storefront': 'apps/presentation' }

/** Version ranges a config package may take a library from: its app's, and every workspace package (`*`). */
export function rangesFor(root = '.') {
  const workspaces = {}
  for (const area of ['core', 'config'])
    for (const d of readdirSync(join(root, area), { withFileTypes: true }))
      if (d.isDirectory() && existsSync(join(root, area, d.name, 'package.json')))
        workspaces[json(join(root, area, d.name, 'package.json')).name] = '*'
  return Object.fromEntries(
    Object.entries(APP_OF).map(([dir, app]) => {
      const pj = json(join(root, app, 'package.json'))
      return [dir, { ...pj.devDependencies, ...pj.dependencies, ...workspaces }]
    }),
  )
}

/**
 * The dependencies of the three config packages for the given sources ({ 'config/shop': text,
 * 'config/storefront': text }): the imported integrations, their optional peers, the tools whose integrations
 * are all configured, and the libraries the shop's own files import (the version the package already names,
 * else its app's; `existing` and `ranges` from the package files and `rangesFor`).
 */
export function dependenciesFor(sources, packages, { existing = {}, ranges = {} } = {}) {
  const problems = []
  const used = {}
  const libraries = {}
  for (const [dir, source] of Object.entries(sources)) {
    used[dir] = new Set()
    libraries[dir] = {}
    for (const spec of importsOf(source)) {
      const name = packageOf(spec)
      if (packages.has(name)) used[dir].add(name)
      else if (/^@(integrations|demo)\//.test(name)) {
        const file = fileImporting(source, spec) ?? dir
        problems.push(
          `${file} imports ${spec}, but integrations/ has no ${name} (a deleted folder?): remove the import` +
            (name.startsWith('@demo/')
              ? `; it is the demo's: npm run use demo off, then npm run use demo remove`
              : ', or bring the folder back'),
        )
      }
    }
    for (const spec of allImportsOf(source)) {
      const name = packageOf(spec)
      if (
        spec.startsWith('.') ||
        spec.startsWith('node:') ||
        packages.has(name) ||
        /^@(integrations|demo)\//.test(name)
      )
        continue
      if (existing[dir]?.devDependencies?.[name] || name === '@core/integration-kit') continue
      const range = existing[dir]?.dependencies?.[name] ?? ranges[dir]?.[name]
      if (range) libraries[dir][name] = range
      else if (ranges[dir])
        problems.push(`${dir} imports ${name}, which ${APP_OF[dir]} does not use: add it to ${dir}/package.json`)
    }
  }
  // a package the shop config imports may compose integrations itself (the demo's config): they serve too
  const queue = [...(used['config/shop'] ?? [])]
  while (queue.length)
    for (const dep of Object.keys(packages.get(queue.shift())?.manifest.dependencies ?? {}))
      if (packages.has(dep) && !used['config/shop'].has(dep)) queue.push(used['config/shop'].add(dep) && dep)
  used['config/tools'] = new Set(
    [...packages]
      .filter(([, { manifest }]) => {
        const parents = manifest.shopin?.toolOf ?? []
        return parents.length > 0 && parents.every((p) => used['config/shop'].has(p))
      })
      .map(([name]) => name),
  )
  const dependencies = {}
  for (const dir of Object.keys(used)) {
    const deps = { ...(dir === 'config/shop' ? { '@core/integration-kit': '*' } : {}), ...libraries[dir] }
    for (const name of used[dir]) {
      deps[name] = '*'
      const { peerDependencies = {}, peerDependenciesMeta = {} } = packages.get(name).manifest
      for (const [peer, range] of Object.entries(peerDependencies)) {
        if (!peerDependenciesMeta[peer]?.optional) continue
        // the storefront takes a UI package's peers only where the storefront app uses them too (react, next-intl):
        // a package's BFF-side peers (its SDK, sample data) never reach the storefront's dependencies
        if (dir === 'config/storefront' && ranges[dir] && !ranges[dir][peer]) continue
        // and the storefront's own libraries (react, next) never reach the BFF's
        if (dir === 'config/shop' && ranges['config/storefront']?.[peer] && !ranges[dir]?.[peer]) continue
        if (deps[peer] && deps[peer] !== range)
          problems.push(`${peer}: ${name} wants ${range}, another package ${deps[peer]}; align the ranges`)
        deps[peer] = range
      }
    }
    dependencies[dir] = Object.fromEntries(Object.entries(deps).sort())
  }
  return { dependencies, used, problems }
}

const CONFLICT = /^<{7} |^={7}$|^>{7} /m
/** A config package.json with merge conflict markers: setup cannot read it, so it names the file and the fix. */
export function conflictedPackages(root = '.') {
  return PACKAGES.map((dir) => join(dir, 'package.json'))
    .filter((f) => existsSync(join(root, f)) && CONFLICT.test(read(join(root, f))))
    .map(
      (f) =>
        `${f} has merge conflict markers: keep either side's "dependencies" (setup writes them again from the shop's files), remove the markers, then npm run setup`,
    )
}

/**
 * A workspace (outside the config packages, whose dependencies setup writes) that still depends on an integration
 * folder that is gone: npm cannot install it (it is no package on the registry), so setup and config:check name the
 * workspace and the dependency instead of asking for a setup that cannot pass. An integration is an `@integrations/*`
 * name, or a name the lockfile links into integrations/.
 */
/** The integration packages the last install linked: package-lock.json's workspace links into integrations/. */
function linkedIntegrations(root = '.') {
  try {
    return Object.entries(json(join(root, 'package-lock.json')).packages ?? {})
      .filter(([key, entry]) => key.startsWith('node_modules/') && entry.link && entry.resolved?.startsWith('integrations/'))
      .map(([key]) => key.slice('node_modules/'.length))
  } catch {
    return []
  }
}

export function orphanedDependencies(root = '.') {
  const { packages } = integrationPackages(root)
  const linked = linkedIntegrations(root)
  const integration = (name) => name.startsWith('@integrations/') || linked.includes(name)
  const problems = []
  for (const dir of workspaceDirs(root)) {
    if (PACKAGES.includes(dir)) continue
    const pj = json(join(root, dir, 'package.json'))
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'])
      for (const name of Object.keys(pj[field] ?? {}))
        if (integration(name) && !packages.has(name))
          problems.push(
            `${dir}/package.json depends on ${name} (${field}), which integrations/ no longer has: remove it there (with the code that uses it) or bring the folder back${
              dir.startsWith('demo/') ? ', or remove the demo (npm run use demo remove)' : ''
            }; npm run setup cannot install it`,
          )
  }
  return problems
}

/** The config packages' package.json files (path → text): their dependencies follow the two files. */
function packageFiles(packages) {
  const sources = Object.fromEntries(Object.entries(ENTRY).map(([dir, file]) => [dir, sourceOf(dir, file)]))
  sources['config/storefront'] += `\n${sourceOf('config/storefront', basename(WIRED))}`
  const existing = Object.fromEntries(Object.keys(APP_OF).map((dir) => [dir, json(join(dir, 'package.json'))]))
  const problems = Object.entries(ENTRY)
    .filter(([dir, file]) => !existsSync(join(dir, file)))
    .map(([dir, file]) => `${dir}/${file} does not exist`)
  const deps = dependenciesFor(sources, packages, { existing, ranges: rangesFor() })
  const files = {}
  for (const dir of PACKAGES)
    files[join(dir, 'package.json')] = text({ ...json(join(dir, 'package.json')), dependencies: deps.dependencies[dir] })
  files[SOURCES] = sourcesText(
    [...deps.used['config/storefront']].filter((name) =>
      Object.hasOwn(packages.get(name).manifest.exports ?? {}, './sources.css'),
    ),
  )
  return { files, used: deps.used, problems: [...problems, ...deps.problems] }
}

/**
 * config/storefront/sources.css: where Tailwind finds the classes of the storefront's slots, the shop's own files
 * and each UI package the storefront files use, by its exported `sources.css` (no path into another package).
 */
export const sourcesText = (names) =>
  [
    '/* Written by npm run setup (do not edit): the Tailwind sources of the shop\'s files and of the UI packages they use. */',
    '@source "./";',
    ...[...names].sort().map((name) => `@import "${name}/sources.css";`),
  ].join('\n') + '\n'

/** The lockfile's workspace entries agree with the workspaces' package.json files (what `npm ci` requires). */
function lockProblems(lockText, label) {
  let lock
  try {
    lock = JSON.parse(lockText).packages ?? {}
  } catch {
    return [`${label} is not valid JSON (merge conflict markers?): npm install resolves them`]
  }
  const problems = []
  const FIELDS = ['name', 'dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
  const workspaces = new Set(workspaceDirs())
  for (const dir of ['', ...workspaces]) {
    const pj = json(join(dir || '.', 'package.json'))
    const entry = lock[dir]
    if (!entry) {
      problems.push(`${label} has no entry for ${dir}`)
      continue
    }
    for (const f of FIELDS) {
      if (f === 'name' && dir === '') continue
      if (!same(sorted(entry[f]), sorted(pj[f])))
        problems.push(`${label} was written for other ${f} of ${dir || 'the root package.json'}`)
    }
  }
  for (const dir of Object.keys(lock))
    if (dir && !dir.includes('node_modules/') && !workspaces.has(dir))
      problems.push(`${label} lists ${dir}, which is not a workspace`)
  return problems
}

/** config/shop and config/storefront dist: what their entries compile to now (compiled to a temporary folder). */
function builtProblems() {
  const problems = []
  for (const [dir, file] of Object.entries(ENTRY)) {
    const out = join(dir, OUT[dir])
    if (!existsSync(out)) {
      problems.push(`${out} is not built: run npm run setup`)
      continue
    }
    const tmp = mkdtempSync(join(tmpdir(), 'shopin-config-'))
    try {
      const tsc = createRequire(join(process.cwd(), dir, 'package.json')).resolve('typescript/bin/tsc')
      const r = spawnSync(
        process.execPath,
        [tsc, '-p', join(dir, 'tsconfig.json'), '--outDir', tmp, '--declarationDir', join(tmp, 'types')],
        { encoding: 'utf8' },
      )
      const fresh = join(tmp, basename(out))
      if (r.status !== 0 || !existsSync(fresh))
        problems.push(`${dir}/${file} does not compile: ${(r.stdout || r.stderr).trim().split('\n')[0]}`)
      else if (read(fresh) !== read(out)) problems.push(`${out} is older than ${dir}/${file}: run npm run setup`)
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  }
  return problems
}

/** `shopin.config:` errors as plain lines naming the file (`defineConfig` lists one `- …` per problem). */
const configLines = (message, file) => {
  const lines = message.split('\n')
  return lines.length > 1 ? lines.slice(1).map((l) => `${file}: ${l.replace(/^\s*-\s*/, '')}`) : [lines[0]]
}

/** The built shop config, or its problems as plain lines (no stack trace). */
export function builtConfig(root = process.cwd()) {
  const require = createRequire(import.meta.url)
  const shop = join(root, 'config/shop', OUT['config/shop'])
  const kit = join(root, 'core/integration-kit/dist/core.js')
  if (!existsSync(shop) || !existsSync(kit)) return { problems: ['config/shop is not built: run npm run setup'] }
  try {
    return { kit: require(kit), config: require(shop).config }
  } catch (error) {
    const message = String(error?.message ?? error)
    if (!message.startsWith('shopin.config')) throw error
    return { problems: configLines(message, `config/shop/${ENTRY['config/shop']}`) }
  }
}

/**
 * Child process (`setup.mjs --read-config`): loads config/shop/shopin.config.ts from its sources, with no build
 * and no install of what it names. `.ts` is transpiled in memory with the installed TypeScript, and a workspace
 * package resolves to the source of the file its `exports` name (`dist/x.js` → `src/x.ts` or `x.ts`), so an
 * integration's descriptor (`@integrations/<name>/shopin`, pure: only the kit and its own files) loads before
 * anything is installed. Prints { problems } for what defineConfig refuses, else { ids, required }: the
 * integrations of the config and, per integration, the variables the BFF's own rule (`loadPorts`: the serving
 * ports' declared `env`, minus the `optional` ones) requires. { skipped } when it cannot tell (no TypeScript yet,
 * a package that is not installed): the build then reports.
 */
function sourceLoader(root) {
  const req = createRequire(join(root, 'package.json'))
  let ts
  try {
    ts = req('typescript')
  } catch {
    return { skipped: 'TypeScript is not installed yet' }
  }
  const Module = req('node:module')
  const byName = new Map(workspaceDirs(root).map((d) => [json(join(root, d, 'package.json')).name, join(root, d)]))
  const target = (pj, sub) => {
    const exports = typeof pj.exports === 'string' ? { '.': pj.exports } : (pj.exports ?? {})
    const pick = (t) => (typeof t === 'string' ? t : (t?.default ?? t?.require))
    if (exports[sub]) return pick(exports[sub])
    for (const [key, t] of Object.entries(exports))
      if (key.endsWith('*') && sub.startsWith(key.slice(0, -1))) return pick(t)?.replace('*', sub.slice(key.length - 1))
    return sub === '.' ? pj.main : undefined
  }
  const resolveFilename = Module._resolveFilename
  Module._resolveFilename = function (request, ...rest) {
    const name = packageOf(request)
    const dir = byName.get(name)
    const t = dir && target(json(join(dir, 'package.json')), `.${request.slice(name.length)}`)
    if (t) {
      const source = t.replace(/\.js$/, '.ts').replace(/\.mjs$/, '.mts')
      // dist/x.js → src/x.ts or x.ts; dist/<program>/x.js (a package with several programs) → x.ts
      const found = [
        source.replace(/^\.\/dist\//, './src/'),
        source.replace(/^\.\/dist\//, './'),
        source.replace(/^\.\/dist\/[^/]+\//, './'),
      ]
        .map((f) => join(dir, f))
        .find((f) => existsSync(f))
      if (found) return found
    }
    return resolveFilename.call(this, request, ...rest)
  }
  const compilerOptions = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    jsx: ts.JsxEmit.ReactJSX,
  }
  for (const ext of ['.ts', '.mts'])
    Module._extensions[ext] = (module, filename) =>
      module._compile(ts.transpileModule(read(filename), { compilerOptions, fileName: filename }).outputText, filename)
  try {
    req('reflect-metadata')
  } catch {}
  return { req }
}

function readConfig(root, file = ENTRY['config/shop']) {
  const { req, skipped } = sourceLoader(root)
  if (skipped) return { skipped }
  let config
  try {
    config = req(join(root, 'config/shop', file)).config
  } catch (error) {
    const message = String(error?.message ?? error)
    if (message.startsWith('shopin.config')) return { problems: configLines(message, `config/shop/${ENTRY['config/shop']}`) }
    return { skipped: message.split('\n')[0] }
  }
  // the BFF's own list (requiredEnv, what loadPorts checks), conditional variables and their reasons included
  const { requiredEnv, storefrontData } = req('@core/integration-kit/core')
  let locales = []
  try {
    locales = Object.keys(json(join(root, LOCALES)))
  } catch {}
  const { required, reasons, defaults, optional, forms } = requiredEnv(config, locales)
  return {
    ids: config.integrations.map((i) => i.id),
    required,
    reasons,
    defaults,
    optional,
    forms,
    wired: wiredText(storefrontData(config).slots),
  }
}

/** The shop config read from its sources (`readConfig` in a child process, so its require hooks stay there). */
export function configFromSource(root = '.', file) {
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--read-config', ...(file ? [file] : [])], {
    cwd: root,
    encoding: 'utf8',
  })
  try {
    return JSON.parse(r.stdout)
  } catch {
    return { skipped: (r.stderr || r.stdout).trim().split('\n')[0] }
  }
}

/**
 * Child process (`setup.mjs --read-integrations`): every integration's descriptor from its sources, its factory
 * called without options: its id, factory, package, the categories it serves and, per category, what it needs
 * from others (`requires[c].needs`). One that cannot be read so is left out.
 */
function readIntegrations(root) {
  const { req, skipped } = sourceLoader(root)
  if (skipped) return []
  const found = []
  for (const [name, { manifest }] of integrationPackages(root).packages) {
    if (!manifest.exports?.['./shopin']) continue
    try {
      for (const [factory, make] of Object.entries(req(`${name}/shopin`))) {
        if (typeof make !== 'function') continue
        const i = make()
        if (!i?.id || !i.ports) continue
        const needs = Object.fromEntries(Object.entries(i.requires ?? {}).map(([c, r]) => [c, r?.needs ?? {}]))
        found.push({ id: i.id, factory, package: name, categories: Object.keys(i.ports), needs })
      }
    } catch {}
  }
  return found
}

/** The integrations as `readIntegrations` reads them, in a child process (its require hooks stay there). */
export function integrationsFromSource(root = '.') {
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--read-integrations'], {
    cwd: root,
    encoding: 'utf8',
  })
  try {
    return JSON.parse(r.stdout)
  } catch {
    return []
  }
}

/** integrations/<vendor>/<category>/README.md of the integration with this id (its descriptor names the id). */
function readmeOf(id, root = '.') {
  for (const { dir } of integrationPackages(root).packages.values()) {
    const descriptor = join(root, dir, 'src/shopin.ts')
    if (existsSync(descriptor) && new RegExp(`\\bid:\\s*['"]${id}['"]`).test(read(descriptor)))
      return join(dir, 'README.md')
  }
  return 'integrations/README.md'
}

const ON = (id, readme) => `# ${id} (${readme}): variables for the shop config, added by npm run setup`
const OFF = (id, readme) => `# ${id} (${readme}): not in the shop config any more, commented out by npm run setup`
const BLOCK = /^# ([\w@/.-]+) \(([^)]*)\): (variables for the shop config|not in the shop config any more)/

/** A variable line, set or commented out (`NAME=…`, `# NAME=…`), and a note setup writes above one (`#  NAME: why`). */
const VARIABLE = /^(# )?([A-Za-z0-9_]+)=/
const NOTE = /^# {2}([A-Za-z0-9_]+): /

/**
 * .env for the configured integrations. A block of an integration no longer configured is commented out (its values
 * kept). The block of one the config names is written for today's config: each required variable uncommented, under
 * `#  NAME: required` (with why when only this shop needs it), each optional one under why it is optional (as the
 * shop left it, commented out unless set), so no note from an earlier config stays. Every variable that neither .env
 * nor the environment names is appended under a comment naming the integration and its README: a required one empty
 * (or with its default), an optional one commented out.
 */
export function envFor(
  envText,
  { ids, required, defaults = {}, reasons = {}, optional = {}, forms = {} },
  { present = [], readme = readmeOf, exists = existsSync } = {},
) {
  const form = (id, n) => (forms[id]?.[n] ? `; its form: ${forms[id][n]}` : '')
  const note = (id, n) =>
    defaults[id]?.[n]?.includes('{BFF_URL}')
      ? `#  ${n}: {BFF_URL} is the BFF's public URL (BFF_URL, else http://localhost:<PORT>/bff); set another value to override`
      : required[id]?.includes(n)
      ? `#  ${n}: required${reasons[id]?.[n] ? `: ${reasons[id][n]}` : ''}${form(id, n)}`
      : optional[id]?.[n]
        ? `#  ${n}: ${optional[id][n]}${form(id, n)}`
        : undefined
  const lines = envText.split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(BLOCK)
    if (!m) {
      out.push(lines[i])
      continue
    }
    const id = m[1]
    const on = ids.includes(id)
    // an integration deleted from integrations/ (its README's folder is gone): its block goes with it
    const folder = dirname(m[2])
    if (!on && /^integrations\/[^/]+\/[^/]+$/.test(folder) && !exists(folder)) {
      while (i + 1 < lines.length && (VARIABLE.test(lines[i + 1]) || NOTE.test(lines[i + 1]))) i++
      if (out.at(-1) === '' && (lines[i + 1] === '' || i + 1 >= lines.length)) out.pop()
      continue
    }
    out.push((on ? ON : OFF)(id, m[2]))
    for (; i + 1 < lines.length && (VARIABLE.test(lines[i + 1]) || NOTE.test(lines[i + 1])); i++) {
      const line = lines[i + 1]
      if (!on) {
        // not configured: its values kept, commented out; the notes of the config that used it go with it
        if (!NOTE.test(line)) out.push(line.replace(/^(?!# )/, '# '))
        continue
      }
      if (NOTE.test(line)) continue // written again below, for today's config
      const name = line.match(VARIABLE)[2]
      const now = note(id, name)
      if (now) out.push(now)
      const keep = required[id]?.includes(name) || defaults[id]?.[name] !== undefined
      out.push(keep ? line.replace(/^# /, '') : line)
    }
  }
  let text = out.join('\n')
  const listed = new Set([
    ...Object.keys(parseEnv(text)),
    ...text.split('\n').flatMap((l) => (l.match(VARIABLE) ? [l.match(VARIABLE)[2]] : [])),
    ...present,
  ])
  for (const id of new Set([...Object.keys(required), ...Object.keys(defaults), ...Object.keys(optional)])) {
    const names = [...new Set([...(required[id] ?? []), ...Object.keys(defaults[id] ?? {})])]
    const missing = names.filter((n) => !listed.has(n))
    const missingOptional = Object.keys(optional[id] ?? {}).filter((n) => !listed.has(n) && !names.includes(n))
    if (missing.length || missingOptional.length)
      text = `${text.replace(/\n*$/, '\n')}\n${ON(id, readme(id))}\n${[
        ...missing.map((n) => `${note(id, n) ? `${note(id, n)}\n` : ''}${n}=${defaults[id]?.[n] ?? ''}\n`),
        ...missingOptional.map((n) => `${note(id, n)}\n# ${n}=\n`),
      ].join('')}`
  }
  return text
}

/** [set name, wanted name, integration]: .env sets a name nothing reads, close to one an integration reads and lacks. */
function nearMissPairs(envText, { required = {}, optional = {}, defaults = {} }) {
  const set = parseEnv(envText)
  const wanted = new Map()
  for (const [id, names] of Object.entries(required)) for (const n of names) wanted.set(n, id)
  for (const [id, names] of Object.entries(optional)) for (const n of Object.keys(names)) wanted.set(n, id)
  for (const [id, names] of Object.entries(defaults)) for (const n of Object.keys(names)) wanted.set(n, id)
  const unknown = Object.keys(set).filter((n) => !wanted.has(n))
  const near = (a, b) => a.startsWith(`${b}_`) || b.startsWith(`${a}_`) || distance(a, b) <= 2
  return [...wanted]
    .filter(([n]) => !set[n]?.trim())
    .flatMap(([n, id]) => unknown.filter((u) => near(u, n)).map((u) => [u, n, id]))
}

/**
 * Variables the configured integrations read that .env leaves unset while it sets a name close to them
 * (`CONTENTFUL_SPACE_ID` for `CONTENTFUL_SPACE`): one line each, names only (never a value).
 */
export function envNearMisses(envText, config) {
  return nearMissPairs(envText, config).map(
    ([u, n, id]) => `.env sets ${u}, which nothing reads: did you mean ${n} (${id})?`,
  )
}

/**
 * The required variables of the configured integrations that are still empty: in neither .env nor the environment
 * (`present`, e.g. CI secrets). Setup names them in its last lines, so `npm run dev` is not started on a part that
 * cannot serve yet.
 */
export function emptyRequired(envText, { required = {} }, present = []) {
  const values = parseEnv(envText)
  return [...new Set(Object.values(required).flat())].filter((n) => !values[n] && !present.includes(n))
}

/**
 * .env with each such misspelled name renamed in place to the one the integration reads (its value kept, a note
 * above it), so setup adds no second, empty line for it. Only a name close to exactly one wanted name is renamed.
 */
export function renameNearMisses(envText, config) {
  const pairs = nearMissPairs(envText, config)
  const once = pairs.filter(([u]) => pairs.filter(([v]) => v === u).length === 1)
  let text = envText
  for (const [from, to] of once)
    text = text.replace(new RegExp(`^${from}=`, 'm'), `#  ${to}: renamed from ${from} by npm run setup\n${to}=`)
  return { text, renamed: once }
}

/**
 * config/storefront/wired.mts: the storefront slots the serving integrations fill (`storefrontData(config).slots`,
 * from their descriptors' `storefront.slots`), one re-export per slot.
 */
export const wiredText = (slots = {}) =>
  [
    '// Written by npm run setup from the integrations shopin.config.ts names (do not edit): the storefront slots',
    "// they fill; a slot storefront.mts sets itself wins.",
    ...Object.entries(slots)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slot, { from, name, by }]) => `export { ${name} as ${slot} } from "${from}"; // ${by}`),
    ...(Object.keys(slots).length ? [] : ['export {};']),
  ].join('\n') + '\n'

/** storefront-data.json and wired.mts from the built config. */
function storefrontData() {
  const built = builtConfig()
  if (built.problems) return { problems: built.problems }
  const data = built.kit.storefrontData(built.config)
  return { text: text(data), wired: wiredText(data.slots), problems: [] }
}

function envInit() {
  if (existsSync('.env') || !existsSync('.env.example')) return
  const KEYS =
    /^(JWT_ENCRYPTION_KEY|JWT_SIGNING_KEY|CSRF_TOKEN_ENCRYPTION_KEY|CSRF_TOKEN_SIGNING_KEY|NEXT_DRAFT_MODE_SECRET)=$/
  const env = read('.env.example')
    .split('\n')
    .map((line) => (KEYS.test(line) ? line + randomBytes(32).toString('base64') : line))
    .join('\n')
  writeFileSync('.env', env, { mode: 0o600 })
  console.log('setup: created .env with random local keys (from .env.example)')
}

/** Why setup stops: its lines, printed by the command (so `npm run use` can undo its writes first). */
class Stop extends Error {
  constructor(problems, status = 1) {
    super(problems.join('\n'))
    this.problems = problems
    this.status = status
  }
}
/** While `npm run use` puts things back: no command output and no summary, only what failed. */
let quiet = false
/** Required variables still empty after this run of setup (printed with its last lines). */
let stillEmpty = []
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8' })
  if (r.status !== 0) throw new Stop([`${cmd} ${args.join(' ')} failed (exit ${r.status ?? 'signal'})`], r.status ?? 1)
}
const fail = (problems) => {
  throw new Stop(problems)
}

function check() {
  const problems = conflictedPackages()
  if (problems.length) fail(problems)
  const { packages, problems: p1 } = integrationPackages()
  problems.push(...p1)
  // a workspace that depends on a deleted integration: setup cannot fix it, so say which one (not "run setup")
  const orphaned = orphanedDependencies()
  if (orphaned.length) fail([...problems, ...orphaned])
  const { files, used, problems: p2 } = packageFiles(packages)
  problems.push(...p2)
  // a package the config uses that does not resolve (its workspace link is gone): tsc says only TS2307
  for (const name of unlinked('.', usedNames(used)))
    problems.push(`node_modules/${name} is missing (its workspace link): run npm run setup, which installs it again`)
  for (const [name, of] of unresolvedModules('.', packages, used))
    if (!problems.some((p) => p.startsWith(`node_modules/${name} `)))
      problems.push(`node_modules/${name} is missing (a dependency of ${of}): run npm run setup, which installs it again`)
  const locales = localesText()
  if (locales.problems) problems.push(...locales.problems)
  else if (!existsSync(LOCALES_COPY) || read(LOCALES_COPY) !== locales.text)
    problems.push(`${LOCALES_COPY} differs from ${LOCALES}: run npm run setup`)
  for (const [f, content] of Object.entries(files))
    if ((existsSync(f) ? read(f) : '') !== content)
      problems.push(`${f} differs from what the shop's files need: run npm run setup`)
  if (existsSync('package-lock.json'))
    problems.push(...lockProblems(read('package-lock.json'), 'package-lock.json').map((p) => `${p}: run npm run setup`))
  else problems.push('no package-lock.json: run npm run setup')
  const built = builtProblems()
  problems.push(...built)
  // storefront data and slot rules come from the built shop config: only when it is current
  if (!built.some((p) => p.startsWith('config/shop/'))) {
    const data = storefrontData()
    problems.push(...data.problems)
    if (data.text && (!existsSync(STOREFRONT_DATA) || read(STOREFRONT_DATA) !== data.text))
      problems.push(`${STOREFRONT_DATA} is out of date with the shop config: run npm run setup`)
    if (data.wired && (!existsSync(WIRED) || read(WIRED) !== data.wired))
      problems.push(`${WIRED} is out of date with the shop config: run npm run setup`)
  }
  if (problems.length) fail(problems)
  const names = new Set(workspaceDirs().map((d) => json(join(d, 'package.json')).name))
  const dead = deadScripts('.', names).map(([script, w]) => `the root script "${script}" runs ${w}, which is not a workspace: npm run setup removes it`)
  for (const w of [...orphanedTools(packages), ...dead]) console.warn(`config: warning: ${w}`)
  console.log(`config: ok (${demoOn() ? 'the SHOPin demo' : Object.values(ENTRY).join(', ')})`)
}

/** Reads the config from its sources: its problems stop setup; .env follows its integrations. False when skipped. */
function configAndEnv() {
  const config = configFromSource()
  if (config.problems) fail(config.problems)
  if (config.skipped) return false
  const original = existsSync('.env') ? read('.env') : ''
  // a misspelled name (CONTENTFUL_SAPCE) is renamed where it stands, not listed a second time
  const { text: before, renamed } = renameNearMisses(original, config)
  for (const [from, to, id] of renamed) console.log(`setup: .env: renamed ${from} to ${to} (what ${id} reads)`)
  // a tool the config installs (config/tools) lists the variables it reads (its package.json "shopin".env)
  const { packages } = integrationPackages()
  const tools = [...(packageFiles(packages).used['config/tools'] ?? [])]
  const toolEnv = Object.fromEntries(
    tools.flatMap((name) => {
      const env = packages.get(name)?.manifest.shopin?.env
      return Array.isArray(env) && env.length ? [[name, env]] : []
    }),
  )
  const readme = (id) => (packages.has(id) ? join(packages.get(id).dir, 'README.md') : readmeOf(id))
  // a tool's variables are optional for the shop (the BFF never reads them): listed, commented out, with the tool
  const toolOptional = Object.fromEntries(
    Object.entries(toolEnv).map(([name, env]) => [
      name,
      Object.fromEntries(env.map((n) => [n, `optional: only the tool ${name} reads it (its README)`])),
    ]),
  )
  const after = envFor(
    before,
    { ...config, ids: [...config.ids, ...Object.keys(toolEnv)], optional: { ...config.optional, ...toolOptional } },
    { present: Object.keys(process.env), readme },
  )
  stillEmpty = emptyRequired(after, config, Object.keys(process.env))
  if (after !== original) {
    writeFileSync('.env', after, { mode: 0o600 })
    if (!quiet)
      console.log(
        `setup: .env lists the variables of the configured integrations${stillEmpty.length ? `; fill in: ${stillEmpty.join(', ')}` : ''}`,
      )
  }
  for (const w of envNearMisses(after, config)) console.warn(`config: warning: ${w}`)
  if (config.wired && (!existsSync(WIRED) || read(WIRED) !== config.wired)) writeFileSync(WIRED, config.wired)
  return true
}

/** Writes the config packages' dependencies and installs when they or the lockfile changed. Returns what is used. */
/** A tool whose integration is gone (deleted from integrations/): name it, so it goes too. */
export function orphanedTools(packages) {
  return [...packages].flatMap(([name, { dir, manifest }]) =>
    (manifest.shopin?.toolOf ?? [])
      .filter((parent) => !packages.has(parent))
      .map((parent) => `${dir} (${name}) is a tool of ${parent}, which integrations/ no longer has: npm run setup deletes it`),
  )
}

/** A root script that runs a workspace that is not there (`npm run migrate -w @integrations/x`): [name, workspace]. */
function deadScripts(root, names) {
  const scripts = json(join(root, 'package.json')).scripts ?? {}
  return Object.entries(scripts).flatMap(([script, command]) =>
    [...command.matchAll(/(?:-w|--workspace)[= ](\S+)|--filter=([^.\s]+)/g)]
      .map((m) => (m[1] ?? m[2]).replace(/^["']|["']$/g, ''))
      .filter((w) => w.startsWith('@') && !w.includes('*') && !names.has(w))
      .slice(0, 1)
      .map((w) => [script, w]),
  )
}

/**
 * After an integration is deleted, in the same run: its tool packages are deleted and every root script that runs a
 * workspace no longer there goes. Returns what it removed, one line each. A folder is deleted only when it is an
 * integration package that declares itself a tool (`shopin.toolOf`) of integrations that are all gone now and were
 * all installed before this run (linked in package-lock.json, which this run's install has not rewritten yet). A
 * tool of an integration never installed here (a fresh clone, a typo) or of one still there is left alone;
 * config:check names it.
 */
export function removeOrphans(root = '.') {
  const removed = []
  const { packages } = integrationPackages(root)
  const installed = new Set(linkedIntegrations(root))
  for (const [name, { dir, manifest }] of packages) {
    const parents = manifest.shopin?.toolOf ?? []
    const gone = parents.filter((p) => !packages.has(p))
    if (!dir.startsWith('integrations/') || !gone.length || gone.length < parents.length) continue
    if (!gone.every((p) => installed.has(p))) continue
    rmSync(join(root, dir), { recursive: true, force: true })
    removed.push(`deleted ${dir} (${name}): a tool of ${gone.join(', ')}, which integrations/ no longer has`)
  }
  const names = new Set(workspaceDirs(root).map((d) => json(join(root, d, 'package.json')).name))
  const dead = deadScripts(root, names)
  if (dead.length) {
    const pj = json(join(root, 'package.json'))
    for (const [script, w] of dead) {
      removed.push(`removed the root script "${script}" (${pj.scripts[script]}): no workspace ${w}`)
      delete pj.scripts[script]
    }
    writeFileSync(join(root, 'package.json'), text(pj))
  }
  return removed
}

/** The workspace packages setup's config packages use, with the config packages themselves. */
const usedNames = (used) => [
  ...PACKAGES.map((dir) => (existsSync(join(dir, 'package.json')) ? json(join(dir, 'package.json')).name : undefined)).filter(Boolean),
  ...Object.values(used).flatMap((set) => [...set]),
]

/**
 * Every package the configured integrations need that does not resolve: the config packages' dependencies (the
 * integrations, their SDKs, the shop's libraries) and each used integration's own dependencies, looked up in the
 * root node_modules or the package's own. Each as [name, whose]: a deleted SDK is caught here, not at the BFF's start.
 */
export function unresolvedModules(root, packages, used) {
  const has = (dir, name) =>
    existsSync(join(root, 'node_modules', name, 'package.json')) || existsSync(join(root, dir, 'node_modules', name, 'package.json'))
  const missing = new Map()
  for (const dir of PACKAGES) {
    const file = join(root, dir, 'package.json')
    if (!existsSync(file)) continue
    const pj = json(file)
    if (!has(dir, pj.name)) missing.set(pj.name, 'the workspace link')
    for (const name of Object.keys(pj.dependencies ?? {})) if (!has(dir, name)) missing.set(name, pj.name)
  }
  for (const name of Object.values(used).flatMap((set) => [...set])) {
    const pkg = packages.get(name)
    if (!pkg) continue
    for (const dep of Object.keys(pkg.manifest.dependencies ?? {}))
      if (!has(pkg.dir, dep) && !missing.has(dep)) missing.set(dep, name)
  }
  return [...missing]
}

/** Of these package names, those with no `node_modules/<name>` (a workspace link deleted or never made). */
export function unlinked(root, names) {
  return [...new Set(names)].filter((name) => !existsSync(join(root, 'node_modules', name, 'package.json')))
}

/**
 * The lockfile's dev/optional flags in one form, whatever install wrote them: npm keeps flags from the lockfile it
 * started from, so a switch and back flipped `dev` and `devOptional` on hundreds of entries. npm's own Arborist
 * (the npm that runs setup) recomputes them from the dependency graph, so the same packages give the same lockfile.
 * Skipped (unchanged) when npm's Arborist cannot be found.
 */
export function normaliseLock(root = '.') {
  // the npm next to this node (its usual place), or the one running this script
  const arborist = [
    join(dirname(process.execPath), '../lib/node_modules/npm'),
    process.env.npm_execpath && dirname(dirname(process.env.npm_execpath)),
  ]
    .filter(Boolean)
    .map((npm) => join(npm, 'node_modules/@npmcli/arborist'))
    .find((a) => existsSync(join(a, 'lib/calc-dep-flags.js')))
  if (!arborist) return false
  const code = `
    const A = require(${JSON.stringify(arborist)});
    const reset = require(${JSON.stringify(join(arborist, 'lib/reset-dep-flags.js'))});
    const calc = require(${JSON.stringify(join(arborist, 'lib/calc-dep-flags.js'))});
    new A({ path: process.cwd() }).loadVirtual().then((tree) => {
      reset(tree); calc(tree);
      require('node:fs').writeFileSync('package-lock.json', tree.meta.toString());
    }).catch((e) => { console.error(e.message); process.exit(1) });`
  const r = spawnSync(process.execPath, ['-e', code], { cwd: root, encoding: 'utf8' })
  if (r.status !== 0) throw new Stop([`normalising package-lock.json failed: ${r.stderr.trim()}`])
  return true
}

function install(packages) {
  const { files, used, problems } = packageFiles(packages)
  if (problems.length) fail(problems)
  let changed = false
  for (const [f, content] of Object.entries(files))
    if ((existsSync(f) ? read(f) : '') !== content) {
      writeFileSync(f, content)
      changed ||= f.endsWith('package.json')
    }
  const flags = ['--no-audit', '--no-fund']
  // a configured package whose node_modules link is gone is installed again, not left to a TS2307 in the build
  if (
    changed ||
    !existsSync('package-lock.json') ||
    lockProblems(read('package-lock.json'), 'lock').length ||
    (existsSync('node_modules') &&
      (unlinked('.', usedNames(used)).length || unresolvedModules('.', packages, used).length))
  ) {
    run('npm', ['install', ...flags])
    normaliseLock()
  } else if (!existsSync('node_modules')) run('npm', ['ci', ...flags]) // a fresh clone: exactly the lockfile
  return used
}

function setup() {
  envInit()
  const conflicts = conflictedPackages()
  if (conflicts.length) fail(conflicts)
  const locales = localesText()
  if (locales.problems) fail(locales.problems)
  if (integrationPackages().problems.length) fail(integrationPackages().problems)
  const orphaned = orphanedDependencies()
  if (orphaned.length) fail(orphaned)
  // a deleted integration's tools and the root scripts that ran them go in this same run
  for (const r of removeOrphans()) console.log(`setup: ${r}`)
  const { packages } = integrationPackages()
  // the config's own mistakes (a wrong pairing included) stop setup here, before a package file or the lockfile
  // changes; it also wires the slots the integrations fill (wired.mts), whose packages the storefront then installs
  const checked = configAndEnv()
  if (!existsSync(LOCALES_COPY) || read(LOCALES_COPY) !== locales.text) writeFileSync(LOCALES_COPY, locales.text)
  let used = install(packages)
  // a fresh clone: TypeScript is installed only now, so the config is read here
  if (!checked) {
    configAndEnv()
    used = install(packages)
  }
  // what the BFF and the storefront use, the shop config first: its problems stop setup before the apps are built
  run('npx', ['turbo', 'run', 'setup', '--filter=@shopin/config...'])
  const built = builtConfig()
  if (built.problems) fail(built.problems)
  run('npx', ['turbo', 'run', 'setup', '--filter=@apps/bff...', '--filter=@apps/presentation...'])
  const data = storefrontData()
  if (data.problems.length) fail(data.problems)
  if (!existsSync(STOREFRONT_DATA) || read(STOREFRONT_DATA) !== data.text) writeFileSync(STOREFRONT_DATA, data.text)
  // the summary last, where the reader looks (not while a failed `npm run use` is put back)
  if (quiet) return
  const all = new Set(Object.values(used).flatMap((s) => [...s]))
  console.log(`config: ${demoOn() ? 'the SHOPin demo (npm run use demo off: your own files)' : Object.values(ENTRY).join(', ')}`)
  console.log('installed and built:', [...all].sort().join(' ') || '—')
  console.log('not installed:', [...packages.keys()].filter((n) => !all.has(n) && !n.startsWith('@demo/')).sort().join(' ') || '—')
  if (stillEmpty.length) console.log(`next: fill in .env: ${stillEmpty.join(', ')} (each integration's README says where to find them), then npm run dev`)
  else console.log('next: npm run dev')
}

// ------------------------------------------------------------------------------------------- npm run use
// the BFF and the storefront see the config's own types (ShopinConfig), never the demo package's
const DEMO = {
  'config/shop': [
    'import type { ShopinConfig } from "@core/integration-kit";',
    'import { config as demo } from "@demo/shop/config";',
    'export const config: ShopinConfig = demo;',
  ].join('\n'),
  'config/storefront': 'export * from "@demo/storefront/storefront";',
}
const DEMO_MARK = '// The SHOPin demo is on; `npm run use demo off` restores the lines below.'
const KEPT = '//| '
const entryPath = (dir, root = '.') => join(root, dir, ENTRY[dir])
const demoOn = (root = '.') => read(entryPath('config/shop', root)).startsWith(DEMO_MARK)

/**
 * `npm run use demo remove`: deletes demo/ for good (a shop's repository keeps none of the SHOPin demo); setup then
 * installs without it. Refused while the demo is on, and while a workspace outside demo/ still depends on a demo
 * package (named, so the shop removes that first): nothing is deleted then.
 */
export function removeDemo(root = '.') {
  if (!existsSync(join(root, 'demo'))) return ['there is no demo/ to remove (already removed)']
  if (demoOn(root)) return ['the SHOPin demo is on: npm run use demo off first, then npm run use demo remove']
  const users = []
  for (const dir of workspaceDirs(root)) {
    if (dir === 'demo' || dir.startsWith('demo/')) continue
    const pj = json(join(root, dir, 'package.json'))
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'])
      for (const name of Object.keys(pj[field] ?? {}))
        if (name.startsWith('@demo/')) users.push(`${dir}/package.json depends on ${name} (${field})`)
  }
  if (users.length) return [...users, 'remove those dependencies (and the code that uses them) first; demo/ is unchanged']
  rmSync(join(root, 'demo'), { recursive: true, force: true })
  console.log('setup: deleted demo/ (the SHOPin demo); git restores it if you need it again')
  return []
}

/** Points the two files at the demo (`on`), keeping their lines as comments, or restores them. */
export function useDemo(on, root = '.') {
  if (on && !existsSync(join(root, 'demo/shop/package.json')))
    return ['the SHOPin demo was removed from this repository (demo/ is gone)']
  for (const dir of Object.keys(ENTRY)) {
    const file = entryPath(dir, root)
    const source = read(file)
    const isOn = source.startsWith(DEMO_MARK)
    if (on && !isOn)
      writeFileSync(
        file,
        [DEMO_MARK, DEMO[dir], ...source.replace(/\n$/, '').split('\n').map((l) => (KEPT + l).trimEnd())].join('\n') +
          '\n',
      )
    if (!on && isOn)
      writeFileSync(
        file,
        source
          .split('\n')
          .slice(1 + DEMO[dir].split('\n').length)
          .map((l) => l.replace(/^\/\/\| ?/, ''))
          .join('\n'),
      )
  }
  return []
}

/** The id an integration's descriptor declares (`id: 'algolia'`): the key `npm run use` takes. */
const idOf = (dir, root = '.') => {
  const descriptor = join(root, dir, 'src/shopin.ts')
  return existsSync(descriptor) ? read(descriptor).match(/^\s*id:\s*['"]([\w-]+)['"]/m)?.[1] : undefined
}

/** The factory an integration's descriptor exports: its first exported arrow function (`export const algolia = (`). */
const factoryOf = (dir, root = '.') => {
  const descriptor = join(root, dir, 'src/shopin.ts')
  return existsSync(descriptor)
    ? read(descriptor).match(/^export const (\w+)\s*=\s*\(/m)?.[1]
    : undefined
}

/** Edit distance of two keys (a misspelled key's closest one). */
function distance(a, b) {
  const row = [...Array(b.length + 1).keys()]
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const was = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = was
    }
  }
  return row[b.length]
}

/** The name `use` gives one instance several categories share (`const sharedCommercetools = commercetools();`). */
const sharedName = (factory) => `shared${factory[0].toUpperCase()}${factory.slice(1)}`

/**
 * shopin.config.ts with `category` served by the integration named `name` (its id, vendor folder, package or factory
 * name; of a vendor's parts, which share the id, the part that serves `category`): the import line added, the category's line set to `factory()`, an import nothing uses any more removed.
 * Several categories on one integration share one instance, as the docs teach: an instance the file already binds
 * (`const ct = commercetools({ … })`) is used, else `use` writes `const sharedX = x();`. `integrations` (from
 * `integrationsFromSource`) lets a wrong key be answered with that category's keys and the closest one.
 */
export function useIntegration(category, name, root = '.', given, integrations = integrationsFromSource(root)) {
  if (demoOn(root)) return { problems: ['the SHOPin demo is on: npm run use demo off first (or edit demo/shop/config/shopin.config.ts)'] }
  if (name === 'off') return useOff(category, root, given, integrations)
  const packages = [...integrationPackages(root).packages]
  const named = packages.filter(
    ([pkg, { dir }]) =>
      idOf(dir, root) === name || basename(dirname(dir)) === name || pkg === name || factoryOf(dir, root) === name,
  )
  // a vendor's parts share its id (mock: commerce, cms, psp): the one whose descriptor serves the category
  const parts = named.filter(([pkg]) => integrations.some((i) => i.package === pkg && i.categories.includes(category)))
  const candidates =
    named.length > 1 ? (parts.length ? parts : named.filter(([, { dir }]) => factoryOf(dir, root)).slice(0, 1)) : named
  const factory = candidates.length === 1 && factoryOf(candidates[0][1].dir, root)
  const serving = integrations.filter((i) => i.categories.includes(category))
  const known = integrations.find((i) => i.factory === factory && i.package === candidates[0]?.[0])
  // a category no integration serves is a misspelled key: the config check names it (`unknown key`)
  if (!factory || (known && serving.length && !known.categories.includes(category))) {
    const keys = serving.length
      ? serving.map((i) => i.id)
      : packages.map(([, { dir }]) => idOf(dir, root) ?? factoryOf(dir, root)).filter(Boolean)
    const close = keys
      .map((k) => [k, distance(name.toLowerCase(), k.toLowerCase())])
      .filter(([k, d]) => d <= Math.max(2, Math.floor(k.length / 3)))
      .sort((a, b) => a[1] - b[1])[0]?.[0]
    const what = known ? `"${name}" does not serve ${category}` : `no integration "${name}"${serving.length ? ` for ${category}` : ''}`
    return {
      problems: [
        `${what} (${serving.length ? `${category} takes` : 'one of'}: ${[...new Set(keys)].sort().join(', ')})${close && close !== name ? `; did you mean "${close}"?` : ''}`,
      ],
    }
  }
  let source = given ?? read(entryPath('config/shop', root))
  const bound = (f) => source.match(new RegExp(`^const (\\w+)\\s*=\\s*${f}\\(`, 'm'))?.[1]
  const line = new RegExp(`^(\\s*${category}:\\s*)[^\\n]*?,?$`, 'm')
  const call = `${factory}()`
  source = line.test(source) ? source.replace(line, `$1${call},`) : addCategoryLine(source, category, call, root)
  // one instance for every category the integration serves: the file's own binding, or for two bare `factory()` a
  // shared one
  const bare = new RegExp(`^(\\s*\\w+:\\s*)${factory}\\(\\),?$`, 'gm')
  let shared = bound(factory)
  if (!shared && (source.match(bare) ?? []).length > 1) {
    shared = sharedName(factory)
    source = source.replace(/^export const config\b/m, `const ${shared} = ${factory}();\n$&`)
  }
  if (shared) source = source.replace(bare, `$1${shared},`)
  const importLine = `import { ${factory} } from "${candidates[0][0]}/shopin";\n`
  if (!source.includes(importLine)) {
    // in the order of the module names (as the shop file keeps them), so a switch and back leaves the file as it was
    const imports = [...source.matchAll(/^import [^;]+?from "([^"]+)";\n/gm)]
    const after = imports.find((m) => m[1] > `${candidates[0][0]}/shopin`)
    const at = after ? after.index : imports.length ? imports.at(-1).index + imports.at(-1)[0].length : 0
    source = source.slice(0, at) + importLine + source.slice(at)
  }
  return { problems: [], line: `${category}: ${factory}()`, source: dropUnused(source) }
}

/**
 * A new category's line in the kit's category order (commerce, search, cms, psp, auth): after the last line of a
 * category before it, else first; so `use <category> off` and back leaves the file as it was.
 */
function addCategoryLine(source, category, call, root) {
  const kit = join(root, 'core/integration-kit/src/categories.json')
  const order = existsSync(kit) ? json(kit) : []
  // only one-line entries (`cms: mockCms(),`): never inside a factory call written over several lines
  const earlier = order.includes(category) ? order.slice(0, order.indexOf(category)) : []
  const lines = earlier.length ? [...source.matchAll(new RegExp(`^[ \\t]*(${earlier.join('|')}):[^\\n]*,[ \\t]*\\n`, 'gm'))] : []
  const at = lines.length ? lines.at(-1).index + lines.at(-1)[0].length : source.search(/defineConfig\(\{\n/) + 'defineConfig({\n'.length
  return source.slice(0, at) + `  ${category}: ${call},\n` + source.slice(at)
}

/** A shared instance `use` wrote that no category uses any more goes, then an integration import nothing uses. */
function dropUnused(source) {
  source = source.replace(/^const (shared\w+) = \w+\(\);\n/gm, (all, v) =>
    new RegExp(`\\b${v}\\b`).test(source.split(all).join('')) ? all : '',
  )
  return source.replace(/^import \{ (\w+) \} from "@integrations\/[^"]+";\n/gm, (all, id) =>
    new RegExp(`\\b${id}\\s*\\(`).test(source.split(all).join('')) ? all : '',
  )
}

/**
 * `npm run use <category> off`: the category's line goes, with an import or shared instance nothing uses any more.
 * Commerce cannot go (every shop has one: switch it instead); a category another one needs is refused by the config
 * check that follows, with the whole command.
 */
function useOff(category, root, given, integrations) {
  if (!integrations.some((i) => i.categories.includes(category)))
    return { problems: [`unknown category "${category}" (one of: ${[...new Set(integrations.flatMap((i) => i.categories))].sort().join(', ')})`] }
  if (category === 'commerce')
    return { problems: ['every shop has commerce: switch it instead, e.g. npm run use commerce mock'] }
  const source = given ?? read(entryPath('config/shop', root))
  return {
    problems: [],
    line: `no ${category}`,
    source: dropUnused(source.replace(new RegExp(`^[ \\t]*${category}:[^\\n]*\\n`, 'm'), '')),
  }
}

/**
 * `npm run use <category> <integration> …`: the new shopin.config.ts is read and checked before it is written (a
 * copy next to it, removed after); a refused config leaves the file as it was. When a category needs another one's
 * provider, the problem comes with the whole command.
 */
export function useCommand(args, root = '.') {
  const integrations = integrationsFromSource(root)
  const check = (pairs) => {
    let source
    const lines = []
    for (const [category, name] of pairs) {
      const r = useIntegration(category, name, root, source, integrations)
      if (r.problems.length) return { problems: r.problems }
      source = r.source
      lines.push(r.line)
    }
    const candidate = '.use-check.shopin.config.ts'
    writeFileSync(join(root, 'config/shop', candidate), source)
    try {
      const { problems } = configFromSource(root, candidate)
      return {
        problems: problems?.map((p) => p.replace(candidate, ENTRY['config/shop'])),
        source,
        lines,
      }
    } finally {
      rmSync(join(root, 'config/shop', candidate), { force: true })
    }
  }
  // `Cms Contentful` is `cms contentful`: categories and keys as the config and the descriptors spell them
  const kit = join(root, 'core/integration-kit/src/categories.json')
  const categories = [...new Set([...(existsSync(kit) ? json(kit) : []), ...integrations.flatMap((i) => i.categories)])]
  const spelled = (word, words) => words.find((w) => w.toLowerCase() === word?.toLowerCase()) ?? word
  const keysOf = (c) =>
    integrations
      .filter((i) => i.categories.includes(c))
      .map((i) => i.id)
      .sort()
      .join(', ')
  // a category without its key (`npm run use cms`, `cms search algolia`): that category's keys, nothing written
  const isCategory = (w) => categories.some((c) => c.toLowerCase() === w?.toLowerCase())
  for (let i = 0; i < args.length; i += 2)
    if (args[i + 1] === undefined || (isCategory(args[i]) && isCategory(args[i + 1]) && !keysOf(spelled(args[i], categories)).split(', ').includes(args[i + 1]))) {
      const c = spelled(args[i], categories)
      return [
        `npm run use ${args.join(' ')}: "${args[i]}" has no key after it${keysOf(c) ? ` (${c} takes: ${keysOf(c)})` : ''}; name one key after each category, e.g. npm run use ${c} ${keysOf(c).split(', ')[0] || '<key>'}`,
      ]
    }
  const asked = []
  for (let i = 0; i < args.length; i += 2)
    asked.push([spelled(args[i], categories), spelled(args[i + 1], integrations.map((x) => x.id))])
  // one key per category: `cms contentful cms mock` is refused before anything is written or installed
  const twice = [...new Set(asked.map(([c]) => c).filter((c, i, all) => all.indexOf(c) !== i))]
  if (twice.length)
    return twice.map(
      (c) => `${c} is named more than once (${asked.filter(([x]) => x === c).map(([, k]) => k).join(', ')}): name each category once`,
    )
  const first = check(asked)
  if (!first.problems && first.source === read(entryPath('config/shop', root))) {
    console.log(`setup: config/shop/shopin.config.ts already serves ${first.lines.join(', ')}: nothing to change (after an edit by hand: npm run setup)`)
    return Object.defineProperty([], 'noop', { value: true })
  }
  if (!first.problems) {
    writeFileSync(entryPath('config/shop', root), first.source)
    for (const line of first.lines) console.log(`setup: config/shop/shopin.config.ts serves ${line}`)
    return []
  }
  // the integration that serves `category` next to `value` in `other`: the same one, else one that needs exactly it
  // (mock data's sign-in), else one that needs nothing there
  const follow = (category, other, value) => {
    const rank = (i) => (i.id === value ? 0 : i.needs[category]?.[other] === value ? 1 : 2)
    return integrations
      .filter((i) => i.categories.includes(category) && (i.needs[category]?.[other] ?? value) === value)
      .sort((a, b) => rank(a) - rank(b))[0]?.id
  }
  // a category that needs another one's provider: add it and check again, until the config holds (or stops changing);
  // moving forward (commerce to commercetools) and back (to mock) alike
  let pairs = new Map(asked)
  for (let round = 0, problems = first.problems; problems && round < 5; round++) {
    let changed = false
    for (const [, category, other, id] of problems.join('\n').matchAll(/as (\w+) needs (\w+) "([\w-]+)"/g)) {
      // the category it needs is not chosen yet: choose that provider; it is (another one): this category follows it
      if (!pairs.has(other)) changed = Boolean(pairs.set(other, id))
      else if (pairs.get(other) !== id && !asked.some(([c]) => c === category)) {
        const next = follow(category, other, pairs.get(other)) ?? pairs.get(other)
        changed ||= pairs.get(category) !== next
        pairs.set(category, next)
      }
    }
    if (!changed) break
    problems = check([...pairs]).problems
    if (!problems) {
      return [
        ...first.problems,
        `together: npm run use ${[...pairs].flat().join(' ')}`,
        'shopin.config.ts is unchanged',
      ]
    }
  }
  return [...first.problems, 'shopin.config.ts is unchanged']
}

/** `npm run use demo [off]`, or `npm run use <category> <integration> [<category> <integration> …]`, then setup. */
/** Every file `npm run use` and the setup after it may write: kept before, put back when anything fails. */
const USE_WRITES = () => [
  ...Object.keys(ENTRY).map((dir) => entryPath(dir)),
  '.env',
  // its scripts: setup drops a root script whose workspace is gone (removeOrphans)
  'package.json',
  ...PACKAGES.map((dir) => join(dir, 'package.json')),
  'package-lock.json',
  WIRED,
  SOURCES,
  STOREFRONT_DATA,
  LOCALES_COPY,
]

/**
 * `npm run use …` is all or nothing: when the change or the setup after it fails (a refused config, npm install, a
 * build), every file it wrote is put back as it was, the install follows the restored package files, and setup
 * runs again for the config the shop had; then it says what failed.
 */
function use(args) {
  const kept = new Map(USE_WRITES().map((f) => [f, existsSync(f) ? read(f) : null]))
  try {
    // already so: nothing written, no setup
    if (change(args)) return
    setup()
  } catch (error) {
    const changed = [...kept].filter(([f, before]) => (existsSync(f) ? read(f) : null) !== before).map(([f]) => f)
    for (const f of changed) {
      const before = kept.get(f)
      if (before === null) rmSync(f, { force: true })
      else writeFileSync(f, before, f === '.env' ? { mode: 0o600 } : undefined)
    }
    const problems = error instanceof Stop ? error.problems : [String(error?.stack ?? error)]
    if (changed.length) {
      console.error(`setup: npm run use failed; put back as they were: ${changed.join(', ')}`)
      // the install and the builds follow the restored files (best effort: what still fails is printed)
      quiet = true
      try {
        if (changed.some((f) => f.endsWith('package.json') || f === 'package-lock.json'))
          run('npm', ['install', '--no-audit', '--no-fund'])
        setup()
      } catch (again) {
        problems.push(`restoring the previous setup failed too: ${again instanceof Stop ? again.problems.join('; ') : again}`)
      } finally {
        quiet = false
        // byte for byte: the reinstall may have rewritten the lockfile's flags, the setup again the root scripts
        for (const f of ['package-lock.json', 'package.json']) {
          const before = kept.get(f)
          if (before !== null) writeFileSync(f, before)
        }
      }
    }
    throw new Stop(problems, error instanceof Stop ? error.status : 1)
  }
}

function change(args) {
  if (args[0] === 'demo') {
    const problems = args[1] === 'remove' ? removeDemo() : useDemo(args[1] !== 'off')
    if (problems.length) fail(problems)
  } else {
    if (!args.length)
      fail(['npm run use <category> <integration> [<category> <integration> …] (e.g. npm run use cms contentful, npm run use auth off), or npm run use demo [off|remove]'])
    const problems = useCommand(args)
    if (problems.length) fail(problems)
    return problems.noop === true
  }
  return false
}

// run as a script (real paths: macOS links /tmp to /private/tmp), not imported by a test
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  try {
    if (args[0] === '--read-config') process.stdout.write(JSON.stringify(readConfig(process.cwd(), args[1])))
    else if (args[0] === '--read-integrations') process.stdout.write(JSON.stringify(readIntegrations(process.cwd())))
    else if (args[0] === '--check') check()
    else if (args[0] === 'use') use(args.slice(1))
    else setup()
  } catch (error) {
    if (!(error instanceof Stop)) throw error
    for (const p of error.problems) console.error(`setup: ${p}`)
    process.exit(error.status)
  }
}
