/**
 * Setup: what it installs per category (swapping one category changes only that category's packages), what it
 * refuses before it changes a file, the variables it lists in .env, `npm run use`, and the files it writes.
 * Every integration here is a fixture (`fx-*`), never one SHOPin ships: a shop may delete any of those.
 *
 *   node --test scripts/*.test.mjs   (part of npm test)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  cpSync,
  symlinkSync,
  realpathSync,
  existsSync,
  readdirSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import {
  integrationPackages,
  dependenciesFor,
  builtConfig,
  sourceOf,
  rangesFor,
  localesText,
  conflictedPackages,
  envFor,
  wiredText,
  useDemo,
  removeDemo,
  useIntegration,
  useCommand,
  orphanedDependencies,
  configFromSource,
  integrationsFromSource,
  envNearMisses,
  emptyRequired,
  normaliseLock,
  renameNearMisses,
  unlinked,
  orphanedTools,
  unresolvedModules,
  removeOrphans,
} from './setup.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
/** A test of these integrations is skipped once a shop deleted one of them (setup, config:check and tests still pass). */
const without = (...dirs) => {
  const gone = dirs.filter((d) => !existsSync(join(ROOT, d)))
  return gone.length ? `deleted from this repository: ${gone.join(', ')}` : false
}
const SETUP = join(ROOT, 'scripts/setup.mjs')

const temp = (name, run) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), `shopin-${name}-`)))
  try {
    return run(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
const put = (root, f, value) => {
  mkdirSync(dirname(join(root, f)), { recursive: true })
  writeFileSync(join(root, f), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n')
}

// ------------------------------------------------------------------------------------------------ fixtures
/** Fixture integration packages as integrationPackages returns them: name → { dir, manifest }. */
const fixture = (name, dir, manifest = {}) => [name, { dir, manifest: { name, ...manifest } }]
const optional = (...peers) => ({
  peerDependencies: Object.fromEntries(peers.map((p) => [p, '^1.0.0'])),
  peerDependenciesMeta: Object.fromEntries(peers.map((p) => [p, { optional: true }])),
})
const packages = new Map([
  fixture('@integrations/fx-mock', 'integrations/fx-mock/commerce'),
  fixture('@integrations/fx-identity', 'integrations/fx-identity/auth'),
  fixture('@integrations/fx-shop', 'integrations/fx-shop/commerce', optional('fx-shop-sdk')),
  fixture('@integrations/fx-index', 'integrations/fx-index/search', optional('fx-index-sdk')),
  fixture('@integrations/fx-cms', 'integrations/fx-cms/cms', optional('fx-cms-sdk', 'fx-rich-text')),
  fixture('@integrations/fx-index-sync', 'integrations/fx-index-sync/search', {
    ...optional('fx-index-sdk'),
    shopin: { toolOf: ['@integrations/fx-index', '@integrations/fx-shop'] },
  }),
  fixture('@demo/fx-payment-page', 'integrations/fx-payment-page/psp'),
])
const shop = `import { defineConfig } from "@core/integration-kit";
import { fxMock } from "@integrations/fx-mock/shopin";
import { fxIdentity } from "@integrations/fx-identity/shopin";
export const config = defineConfig({
  commerce: fxMock(),
  search: fxMock(),
  cms: fxMock(),
  psp: fxMock(),
  auth: fxIdentity(),
});
`
const storefront = `import { PaymentPage } from "@demo/fx-payment-page";
export const PaymentStep = PaymentPage;
`
const SERVING = {
  commerce: '@integrations/fx-mock',
  search: '@integrations/fx-mock',
  cms: '@integrations/fx-mock',
  psp: '@integrations/fx-mock',
  auth: '@integrations/fx-identity',
}
const SWAPS = [
  { category: 'commerce', to: '@integrations/fx-shop', factory: 'fxShop' },
  { category: 'search', to: '@integrations/fx-index', factory: 'fxIndex' },
  { category: 'cms', to: '@integrations/fx-cms', factory: 'fxCms' },
  { category: 'auth', to: '@integrations/fx-shop', factory: 'fxShop' },
]

/** A package with its optional peers (vendor SDKs) and the tools of it, as installed in the config packages. */
function installed(dependencies, name) {
  const { peerDependencies = {}, peerDependenciesMeta = {} } = packages.get(name).manifest
  const names = [name, ...Object.keys(peerDependencies).filter((p) => peerDependenciesMeta[p]?.optional)]
  const tools = [...packages].filter(([, p]) => p.manifest.shopin?.toolOf?.includes(name)).map(([n]) => n)
  return {
    shop: Object.fromEntries(names.map((n) => [n, dependencies['config/shop'][n]])),
    tools: Object.fromEntries(tools.map((n) => [n, dependencies['config/tools'][n]])),
  }
}

/** The shop config with one category swapped as `npm run use` writes it (on disk in a fixture repository). */
const swapped = (source, { category, to, factory }) =>
  temp('use', (dir) => {
    const name = to.split('/')[1]
    put(dir, `integrations/${name}/commerce/package.json`, { name: to })
    put(dir, `integrations/${name}/commerce/src/shopin.ts`, `export const ${factory} = () => defineIntegration({});\n`)
    put(dir, 'config/shop/shopin.config.ts', source)
    const r = useIntegration(category, name, dir)
    assert.deepEqual(r.problems, [])
    return r.source
  })

// ------------------------------------------------------------------------------------------------ installs
test('the mock shop installs only the integrations it imports', () => {
  const { dependencies, problems } = dependenciesFor({ 'config/shop': shop, 'config/storefront': storefront }, packages)
  assert.deepEqual(problems, [])
  assert.deepEqual(
    Object.keys(dependencies['config/shop']).filter((n) => packages.has(n)),
    ['@integrations/fx-identity', '@integrations/fx-mock'],
  )
  assert.deepEqual(dependencies['config/tools'], {})
})

for (const s of SWAPS) {
  test(`swapping ${s.category} to ${s.to} leaves the other categories' packages as they were`, () => {
    const before = dependenciesFor({ 'config/shop': shop, 'config/storefront': storefront }, packages).dependencies
    const after = dependenciesFor({ 'config/shop': swapped(shop, s), 'config/storefront': storefront }, packages)
    assert.deepEqual(after.problems, [])
    for (const [category, name] of Object.entries(SERVING)) {
      if (category === s.category) continue
      assert.deepEqual(installed(after.dependencies, name), installed(before, name), `${category} (${name})`)
    }
    // the swapped category gets its integration with every vendor SDK it declares
    for (const [name, range] of Object.entries(installed(after.dependencies, s.to).shop))
      assert.ok(range, `${name} installed for ${s.category}`)
    assert.deepEqual(after.dependencies['config/storefront'], before['config/storefront'])
  })
}

test('a tool is installed once every integration it serves is configured; an unused package is not', () => {
  const both = swapped(swapped(shop, SWAPS[0]), SWAPS[1])
  const { dependencies } = dependenciesFor({ 'config/shop': both, 'config/storefront': storefront }, packages)
  assert.deepEqual(dependencies['config/tools'], { '@integrations/fx-index-sync': '*', 'fx-index-sdk': '^1.0.0' })
  const auth = dependenciesFor({ 'config/shop': swapped(shop, SWAPS[3]), 'config/storefront': storefront }, packages)
  assert.equal(auth.dependencies['config/shop']['@integrations/fx-identity'], undefined)
  assert.equal(auth.dependencies['config/shop']['@integrations/fx-mock'], '*')
})

test('a deleted integration folder: setup names the file that imports it, and for the deleted demo how to drop it', () =>
  temp('deleted', (dir) => {
    put(dir, 'config/shop/shopin.config.ts', 'export { config } from "@demo/fx-gone-shop/config";\n')
    const { problems } = dependenciesFor({ 'config/shop': sourceOf(join(dir, 'config/shop'), 'shopin.config.ts') }, packages)
    assert.equal(problems.length, 1)
    assert.match(problems[0], /shopin\.config\.ts imports @demo\/fx-gone-shop\/config, but integrations\/ has no @demo\/fx-gone-shop/)
    assert.match(problems[0], /npm run use demo off, then npm run use demo remove/)
    put(dir, 'config/shop/shopin.config.ts', 'import { fxGone } from "@integrations/fx-gone/shopin";\n')
    const own = dependenciesFor({ 'config/shop': sourceOf(join(dir, 'config/shop'), 'shopin.config.ts') }, packages)
    assert.match(own.problems[0], /shopin\.config\.ts imports .*: remove the import, or bring the folder back$/)
  }))

// ------------------------------------------------------------------------------------------------ refusals
test('a config problem reads as a plain list naming the file, without a stack trace', () =>
  temp('built', (dir) => {
    const kit = join(ROOT, 'core/integration-kit/dist')
    put(dir, 'core/integration-kit/dist/core.js', `module.exports = require(${JSON.stringify(join(kit, 'core.js'))})`)
    put(
      dir,
      'config/shop/dist/shopin.config.js',
      `const { defineConfig } = require(${JSON.stringify(join(kit, 'index.js'))})
const shop = { id: 'shop', ports: { commerce: () => ({}) } }
exports.config = defineConfig({ commerce: shop, serach: shop })`,
    )
    const { problems } = builtConfig(dir)
    assert.equal(problems.length, 1)
    assert.match(problems[0], /^config\/shop\/shopin\.config\.ts: unknown key "serach"/)
  }))

test('a config package.json with merge conflict markers is refused, naming the file and the fix', () =>
  temp('conflict', (dir) => {
    put(dir, 'config/shop/package.json', '{\n  "dependencies": {\n<<<<<<< HEAD\n    "a": "*"\n=======\n    "b": "*"\n>>>>>>> v2\n  }\n}\n')
    put(dir, 'config/storefront/package.json', { dependencies: {} })
    assert.deepEqual(conflictedPackages(dir), [
      `config/shop/package.json has merge conflict markers: keep either side's "dependencies" (setup writes them again from the shop's files), remove the markers, then npm run setup`,
    ])
    put(dir, 'config/shop/package.json', { dependencies: { a: '*' } })
    assert.deepEqual(conflictedPackages(dir), [])
  }))

/**
 * A copy of the repository (node_modules linked, not copied, dist left out) with fixture integrations whose
 * descriptors are not built, and a fake npm and npx that record their calls.
 */
function repository(dir) {
  const skip = new Set(['node_modules', '.next', '.turbo', '.git', 'dist', 'test-results', '.env'])
  cpSync(ROOT, dir, { recursive: true, filter: (src) => !skip.has(src.split('/').pop()) || src === ROOT })
  symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'))
  const integration = (folder, name, factory, body, manifest = {}) => {
    put(dir, `integrations/${folder}/package.json`, { name, exports: { './shopin': './dist/shopin.js' }, ...manifest })
    put(
      dir,
      `integrations/${folder}/src/shopin.ts`,
      `import { defineIntegration } from "@core/integration-kit";\nexport const ${factory} = ${body};\n`,
    )
  }
  integration(
    'fx-shop/commerce',
    '@integrations/fx-shop',
    'fxShop',
    `() => defineIntegration({ id: "fx-shop", label: { en: "Fixture shop" }, ports: { commerce: () => require("./bff") }, env: { commerce: { key: { env: "FX_SHOP_KEY" }, region: { env: "FX_SHOP_REGION", optional: true } } } })`,
  )
  integration(
    'fx-index/search',
    '@integrations/fx-index',
    'fxIndex',
    `(fedFrom: string) => defineIntegration({ id: "fx-index", label: { en: "Fixture index" }, requires: { search: { needs: { commerce: fedFrom }, reason: { en: "the index is fed from " + fedFrom } } }, ports: { search: () => require("./bff") }, env: { search: { key: { env: "FX_INDEX_KEY" } } } })`,
    optional('fx-index-sdk'),
  )
  const bin = join(dir, '.fake-bin')
  for (const tool of ['npm', 'npx'])
    put(dir, `.fake-bin/${tool}`, `#!/bin/sh\necho "${tool} $*" >> "${join(dir, '.calls')}"\n`)
  spawnSync('chmod', ['+x', join(bin, 'npm'), join(bin, 'npx')])
  const config = (search) =>
    put(
      dir,
      'config/shop/shopin.config.ts',
      `import { defineConfig } from "@core/integration-kit";
import { fxShop } from "@integrations/fx-shop/shopin";
import { fxIndex } from "@integrations/fx-index/shopin";
export const config = defineConfig({ commerce: fxShop(), search: ${search} });
`,
    )
  const run = (...args) =>
    spawnSync(process.execPath, [join(dir, 'scripts/setup.mjs'), ...args], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    })
  const file = (f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : '')
  return { config, run, file }
}

test('a wrong pairing stops setup in about a second, before any package file, lockfile or install changes', () =>
  temp('pairing', (dir) => {
    const { config, run, file } = repository(dir)
    config('fxIndex("fx-elsewhere")')
    const before = [file('config/shop/package.json'), file('package-lock.json')]
    const t = Date.now()
    const r = run()
    const seconds = (Date.now() - t) / 1000
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stderr, /setup: config\/shop\/shopin\.config\.ts: "fx-index" as search needs commerce "fx-elsewhere"/)
    assert.doesNotMatch(r.stderr, /^\s+at /m)
    assert.deepEqual([file('config/shop/package.json'), file('package-lock.json')], before, 'no package file changed')
    assert.equal(file('.calls'), '', 'no npm install, no build')
    assert.ok(seconds < 5, `${seconds} s to the first error`)
    console.log(`wrong pairing: ${seconds} s to the first error`)
    // a typo in a key, the same way
    config('fxIndex("fx-shop"), serach: fxShop()')
    assert.match(run().stderr, /setup: config\/shop\/shopin\.config\.ts: unknown key "serach"/)
  }))

test('setup lists the variables the configured integrations require in .env (by the BFF rule), then installs quietly', () =>
  temp('variables', (dir) => {
    const { config, run, file } = repository(dir)
    config('fxIndex("fx-shop")')
    // the BFF's rule: the serving ports' declared variables, without the optional ones
    const { ids, required } = JSON.parse(run('--read-config').stdout)
    assert.deepEqual(ids, ['fx-shop', 'fx-index'])
    assert.deepEqual(required, { 'fx-shop': ['FX_SHOP_KEY'], 'fx-index': ['FX_INDEX_KEY'] })
    run()
    assert.match(
      file('.env'),
      /\n# fx-shop \(integrations\/fx-shop\/commerce\/README\.md\): variables for the shop config, added by npm run setup\n# {2}FX_SHOP_KEY: required\nFX_SHOP_KEY=\n/,
    )
    assert.match(file('.env'), /\nFX_INDEX_KEY=\n/)
    // an optional one is listed commented out, with why: nothing to fill in
    assert.doesNotMatch(file('.env'), /^FX_SHOP_REGION=/m)
    assert.match(file('.env'), /^#  FX_SHOP_REGION: optional.*\n# FX_SHOP_REGION=$/m)
    // the integration and its SDK are written into the shop's package; npm installs without audit or fund noise
    const deps = JSON.parse(file('config/shop/package.json')).dependencies
    assert.equal(deps['@integrations/fx-index'], '*')
    assert.equal(deps['fx-index-sdk'], '^1.0.0')
    const calls = file('.calls').split('\n')
    assert.equal(calls[0], 'npm install --no-audit --no-fund')
    assert.equal(calls[1], 'npx turbo run setup --filter=@shopin/config...')
  }))

test('setup ends by naming the required variables still empty, instead of "next: npm run dev"', () =>
  temp('still-empty', (dir) => {
    const { config, run, file } = repository(dir)
    config('fxIndex("fx-shop")')
    // the fixture's builds are fakes, so setup stops before its summary: the .env line names them as it writes
    assert.match(run().stdout, /^setup: \.env lists the variables of the configured integrations; fill in: FX_SHOP_KEY, FX_INDEX_KEY$/m)
  }))

test('emptyRequired: a variable set in .env or in the environment (CI secrets) is not empty', () => {
  const required = { 'fx-shop': ['FX_SHOP_KEY', 'FX_SHOP_TOKEN'], 'fx-index': ['FX_SHOP_KEY'] }
  assert.deepEqual(emptyRequired('FX_SHOP_KEY=\nFX_SHOP_TOKEN=t\n', { required }), ['FX_SHOP_KEY'])
  assert.deepEqual(emptyRequired('FX_SHOP_KEY=\n', { required }, ['FX_SHOP_KEY']), ['FX_SHOP_TOKEN'])
  assert.deepEqual(emptyRequired('FX_SHOP_KEY=k\nFX_SHOP_TOKEN=t\n', { required }), [], 'all filled in: nothing to name')
})

test('.env: a block of an integration no longer configured is commented out, and restored when it comes back', () => {
  const required = { 'fx-cms': ['FX_CMS_TOKEN', 'FX_CMS_SPACE'] }
  const readme = (id) => `integrations/${id}/cms/README.md`
  const exists = () => true // the folder is still there
  const on = envFor('LOG_LEVEL=info\nFX_CMS_SPACE=\n', { ids: ['fx-cms'], required }, { readme })
  assert.equal(
    on,
    'LOG_LEVEL=info\nFX_CMS_SPACE=\n\n# fx-cms (integrations/fx-cms/cms/README.md): variables for the shop config, added by npm run setup\n#  FX_CMS_TOKEN: required\nFX_CMS_TOKEN=\n',
  )
  // a variable the environment sets is not added
  assert.equal(envFor('', { ids: ['fx-cms'], required }, { readme, present: ['FX_CMS_TOKEN', 'FX_CMS_SPACE'] }), '')
  const filled = on.replace('FX_CMS_TOKEN=', 'FX_CMS_TOKEN=secret')
  const off = envFor(filled, { ids: [], required: {} }, { readme, exists })
  assert.match(off, /\n# fx-cms \(integrations\/fx-cms\/cms\/README\.md\): not in the shop config any more, commented out by npm run setup\n# FX_CMS_TOKEN=secret\n/)
  assert.doesNotMatch(off, /^FX_CMS_TOKEN/m)
  assert.equal(envFor(off, { ids: ['fx-cms'], required }, { readme }), filled)
})

test('wired.mts re-exports each slot the serving integrations fill, under the slot name', () => {
  const slots = { PaymentStep: { from: '@demo/fx-payment-page', name: 'PaymentPage', by: 'fx-mock (psp)' } }
  assert.match(wiredText(slots), /^export \{ PaymentPage as PaymentStep \} from "@demo\/fx-payment-page"; \/\/ fx-mock \(psp\)$/m)
  assert.match(wiredText({}), /^export \{\};$/m)
})

// ------------------------------------------------------------------------------------------------ npm run use
test('npm run use <category> <integration>: the import and the line are written, an unused import goes', () =>
  temp('use-line', (dir) => {
    put(dir, 'integrations/fx-index/search/package.json', { name: '@integrations/fx-index' })
    put(dir, 'integrations/fx-index/search/src/shopin.ts', 'export const fxIndex = (o: { fedFrom: string }) =>\n  defineIntegration({})\n')
    put(dir, 'integrations/fx-mock/commerce/package.json', { name: '@integrations/fx-mock' })
    put(dir, 'integrations/fx-mock/commerce/src/shopin.ts', 'export const fxMock = () => defineIntegration({})\n')
    // a comment that names an integration does not keep its import
    put(dir, 'config/shop/shopin.config.ts', shop.replace('export const', '/** Was on fxMock, fx-mock. */\nexport const'))
    const before = readFileSync(join(dir, 'config/shop/shopin.config.ts'), 'utf8')
    const first = useIntegration('search', 'fx-index', dir)
    assert.deepEqual([first.problems, first.line], [[], 'search: fxIndex()'])
    // nothing is written yet: npm run use checks the new config first (useCommand)
    assert.equal(readFileSync(join(dir, 'config/shop/shopin.config.ts'), 'utf8'), before)
    assert.match(first.source, /^import \{ fxIndex \} from "@integrations\/fx-index\/shopin";$/m)
    assert.match(first.source, /^ {2}search: fxIndex\(\),$/m)
    // by factory name too; switching every category off fx-mock drops its import
    let source = first.source
    for (const c of ['commerce', 'cms', 'psp', 'search']) source = useIntegration(c, 'fxIndex', dir, source).source
    assert.doesNotMatch(source, /^import .*fx-mock/m)
    assert.match(useIntegration('cms', 'fx-nothing', dir).problems[0], /^no integration "fx-nothing" \(one of: fxIndex, fxMock\)/)
  }))

test('npm run use demo remove: refused while the demo is on or still depended on; otherwise demo/ is gone', () =>
  temp('demo-remove', (dir) => {
    put(dir, 'package.json', { name: 'shop', workspaces: ['apps/*', 'config/*', 'demo/*'] })
    put(dir, 'config/shop/shopin.config.ts', shop)
    put(dir, 'config/storefront/storefront.mts', storefront)
    put(dir, 'demo/shop/package.json', { name: '@demo/shop' })
    put(dir, 'demo/demo-disclaimer/package.json', { name: '@demo/demo-disclaimer' })
    // on: refused, nothing deleted
    useDemo(true, dir)
    assert.match(removeDemo(dir)[0], /the SHOPin demo is on: npm run use demo off first/)
    assert.ok(existsSync(join(dir, 'demo')))
    useDemo(false, dir)
    // a workspace outside demo/ still depends on a demo package: named, nothing deleted
    put(dir, 'apps/web/package.json', { name: '@apps/web', dependencies: { '@demo/demo-disclaimer': '*' } })
    const refused = removeDemo(dir)
    assert.equal(refused[0], 'apps/web/package.json depends on @demo/demo-disclaimer (dependencies)')
    assert.match(refused.at(-1), /demo\/ is unchanged/)
    assert.ok(existsSync(join(dir, 'demo')))
    // nothing depends on it: gone; a second run says so
    put(dir, 'apps/web/package.json', { name: '@apps/web' })
    assert.deepEqual(removeDemo(dir), [])
    assert.ok(!existsSync(join(dir, 'demo')))
    assert.match(removeDemo(dir)[0], /there is no demo\/ to remove/)
  }))

test('npm run use demo points both files at the demo, keeping their lines; off restores them exactly', () =>
  temp('use-demo', (dir) => {
    put(dir, 'config/shop/shopin.config.ts', shop)
    put(dir, 'demo/shop/package.json', { name: '@demo/shop' })
    put(dir, 'config/storefront/storefront.mts', storefront)
    assert.deepEqual(useDemo(true, dir), [])
    useDemo(true, dir) // twice is once
    const on = readFileSync(join(dir, 'config/shop/shopin.config.ts'), 'utf8')
    assert.match(on, /^\/\/ The SHOPin demo is on.*\n(.*\n)*export const config: ShopinConfig = demo;\n\/\/\| import/)
    assert.match(on, /^import \{ config as demo \} from "@demo\/shop\/config";$/m)
    assert.match(readFileSync(join(dir, 'config/storefront/storefront.mts'), 'utf8'), /^export \* from "@demo\/storefront\/storefront";$/m)
    // what setup reads now is the demo package: a commented line imports nothing
    assert.doesNotMatch(sourceOf(join(dir, 'config/shop'), 'shopin.config.ts'), /^import .*@integrations/m)
    assert.match(useIntegration('cms', 'fx', dir).problems[0], /the SHOPin demo is on/)
    useDemo(false, dir)
    assert.equal(readFileSync(join(dir, 'config/shop/shopin.config.ts'), 'utf8'), shop)
    assert.equal(readFileSync(join(dir, 'config/storefront/storefront.mts'), 'utf8'), storefront)
    rmSync(join(dir, 'demo'), { recursive: true })
    assert.match(useDemo(true, dir)[0], /the SHOPin demo was removed/)
  }))

// ------------------------------------------------------------------------------------------------ files
test("locales are the shop's file: config/locales.json becomes the copy @config/constants reads; a bad entry names the fix", () =>
  temp('locales', (dir) => {
    const write = (table) => put(dir, 'config/locales.json', table)
    write({
      'en-US': { urlPrefix: 'en', nativeName: 'English', currency: 'USD' },
      'fr-FR': { urlPrefix: 'fr', nativeName: 'Français', currency: 'EUR' },
    })
    const { text, problems } = localesText(dir)
    assert.equal(problems, undefined)
    assert.deepEqual(Object.keys(JSON.parse(text)), ['en-US', 'fr-FR'])
    write({
      'en-US': { urlPrefix: 'en', nativeName: 'English', currency: 'USD', ctStoreKey: 'us-store' },
      'fr-FR': { urlPrefix: 'en', nativeName: 'Français', currency: 'euro' },
    })
    assert.deepEqual(localesText(dir).problems, [
      'config/locales.json "en-US": ctStoreKey is not a locale field (store keys are the commerce integration\'s option)',
      'config/locales.json "fr-FR": urlPrefix "en" is also en-US\'s',
      'config/locales.json "fr-FR": currency must be an ISO 4217 code such as EUR',
    ])
  }))

test('the copy of the locales in @config/constants is what setup writes from config/locales.json', () => {
  assert.equal(readFileSync(join(ROOT, 'config/constants/src/locales.json'), 'utf8'), localesText(ROOT).text)
})

test('integration packages are read from the vendor folders (integrations/<vendor>/<part>), the demo from demo/', () => {
  const { packages: real, problems } = integrationPackages(ROOT)
  assert.deepEqual(problems, [])
  for (const [name, { dir }] of real)
    assert.match(dir, name.startsWith('@demo/') ? /^demo\/[^/]+$/ : /^integrations\/[^/]+\/[^/]+$/)
  assert.equal(real.get('@integrations/commercetools-auth')?.dir, 'integrations/commercetools/auth')
})

test('a part folder is a category, the vendor core or a tool; anything else stops setup', () =>
  temp('parts', (dir) => {
    put(dir, 'integrations/fx/commerce/package.json', { name: '@integrations/fx-commerce' })
    put(dir, 'integrations/fx/core/package.json', { name: '@integrations/fx-core' })
    put(dir, 'integrations/fx/sync/package.json', { name: '@integrations/fx-sync', shopin: { toolOf: ['@integrations/fx-commerce'] } })
    put(dir, 'integrations/fx/rules/package.json', { name: '@integrations/fx-rules', shopin: { category: 'rules' } })
    assert.deepEqual(integrationPackages(dir).problems, [])
    put(dir, 'integrations/fx/helpers/package.json', { name: '@integrations/fx-helpers' })
    assert.match(integrationPackages(dir).problems.join('\n'), /^integrations\/fx\/helpers\/ is not a category folder/)
  }))

test('npm run use refuses before it writes: a pairing comes with the whole command, a misspelled category with the keys', { skip: without('integrations/algolia/search', 'integrations/commercetools/commerce') }, () =>
  temp('use-refused', (dir) => {
    // the repository's integrations (their sources) and node_modules; the shop file is the mock shop
    cpSync(join(ROOT, 'integrations'), join(dir, 'integrations'), {
      recursive: true,
      filter: (src) => !/\/(node_modules|dist)$/.test(src),
    })
    symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'))
    put(dir, 'package.json', JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')))
    put(dir, 'config/shop/package.json', JSON.parse(readFileSync(join(ROOT, 'config/shop/package.json'), 'utf8')))
    const mockShop = [
      'import { defineConfig } from "@core/integration-kit";',
      'import { mockIdentity } from "@integrations/mock-auth/shopin";',
      'import { mockCms } from "@integrations/mock-cms/shopin";',
      'import { mock } from "@integrations/mock-commerce/shopin";',
      'import { mockPsp } from "@integrations/mock-psp/shopin";',
      'export const config = defineConfig({',
      '  commerce: mock(),',
      '  cms: mockCms(),',
      '  psp: mockPsp(),',
      '  auth: mockIdentity(),',
      '});',
      '',
    ].join('\n')
    put(dir, 'config/shop/shopin.config.ts', mockShop)
    const pairing = useCommand(['search', 'algolia'], dir)
    assert.match(pairing[0], /"algolia" as search needs commerce "commercetools"/)
    assert.ok(pairing.includes('together: npm run use search algolia commerce commercetools auth commercetools'), pairing.join('\n'))
    assert.match(useCommand(['serach', 'mock'], dir)[0], /unknown key "serach"/)
    assert.equal(readFileSync(join(dir, 'config/shop/shopin.config.ts'), 'utf8'), mockShop)
    assert.equal(existsSync(join(dir, 'config/shop/.use-check.shopin.config.ts')), false)
  }))

test('.env: a variable with a default is listed with it, next to the ones to fill in', () => {
  const required = { 'fx-cms': ['FX_TOKEN'] }
  const out = envFor('', { ids: ['fx-cms'], required, defaults: { 'fx-cms': { FX_ENVIRONMENT: 'master' } } }, { readme: () => 'README.md' })
  assert.match(out, /^FX_TOKEN=$/m)
  assert.match(out, /^FX_ENVIRONMENT=master$/m)
})

test(".env: a variable only this shop needs comes with why; a tool's variables have their block; switching away comments them out", () => {
  const readme = () => 'README.md'
  const config = {
    ids: ['fx-shop', '@integrations/fx-sync'],
    required: { 'fx-shop': ['FX_KEY', 'FX_LINK'], '@integrations/fx-sync': ['FX_WRITE_KEY'] },
    reasons: { 'fx-shop': { FX_LINK: 'sign-in is through "idp": set it to 1' } },
  }
  const on = envFor('', config, { readme })
  assert.match(on, /^#  FX_LINK: required: sign-in is through "idp": set it to 1\nFX_LINK=$/m)
  assert.match(on, /^# @integrations\/fx-sync \(README\.md\): variables for the shop config/m)
  assert.match(on, /^FX_WRITE_KEY=$/m)
  const off = envFor(on, { ids: [], required: {} }, { readme })
  assert.match(off, /^# FX_LINK=$/m)
  // the notes of the config that used it go with it
  assert.doesNotMatch(off, /^#  FX_LINK:/m)
  assert.match(off, /^# FX_WRITE_KEY=$/m)
})

test('a workspace that depends on a deleted integration is named, with the dependency, instead of "run npm run setup"', () =>
  temp('orphaned', (dir) => {
    put(dir, 'package.json', { name: 'root', workspaces: ['config/*', 'integrations/*/*', 'test/*'] })
    put(dir, 'integrations/fx-sign-in/auth/package.json', { name: '@integrations/fx-sign-in' })
    put(dir, 'test/fx-scenarios/package.json', { name: '@test/fx-scenarios', devDependencies: { '@integrations/fx-sign-in': '*' } })
    // setup writes the config packages' dependencies itself: a stale one there is setup's to fix
    put(dir, 'config/shop/package.json', { name: '@shopin/config', dependencies: { '@integrations/fx-gone': '*' } })
    assert.deepEqual(orphanedDependencies(dir), [])
    rmSync(join(dir, 'integrations/fx-sign-in/auth'), { recursive: true })
    assert.deepEqual(orphanedDependencies(dir), [
      'test/fx-scenarios/package.json depends on @integrations/fx-sign-in (devDependencies), which integrations/ no longer has: remove it there (with the code that uses it) or bring the folder back; npm run setup cannot install it',
    ])
    // a package of another scope under integrations/, known from the lockfile's link
    put(dir, 'package-lock.json', { packages: { 'node_modules/@fx/switch': { resolved: 'integrations/fx/switch', link: true } } })
    put(dir, 'test/fx-scenarios/package.json', { name: '@test/fx-scenarios', devDependencies: { '@fx/switch': '*' } })
    assert.match(orphanedDependencies(dir)[0], /^test\/fx-scenarios\/package\.json depends on @fx\/switch/)
    // a demo package that uses it: deleting the demo is the other way out
    put(dir, 'demo/fx-shop/package.json', { name: '@demo/fx-shop', dependencies: { '@integrations/fx-sign-in': '*' } })
    put(dir, 'package.json', { name: 'root', workspaces: ['config/*', 'integrations/*/*', 'demo/*', 'test/*'] })
    assert.ok(
      orphanedDependencies(dir).includes(
        'demo/fx-shop/package.json depends on @integrations/fx-sign-in (dependencies), which integrations/ no longer has: remove it there (with the code that uses it) or bring the folder back, or remove the demo (npm run use demo remove); npm run setup cannot install it',
      ),
      orphanedDependencies(dir).join('\n'),
    )
  }))

// shopin's demo notice and tracking tags stay in the storefront (decision DQ-M6, 2026-11-24)
const STOREFRONT_DEMO_UI = new Set(['apps/presentation → @demo/demo-disclaimer', 'apps/presentation → @demo/mock-tracking-tags'])
test("outside integrations/ and config/ no workspace depends on an integration a shop may delete (only mock-* ones)", () => {
  const { packages: real } = integrationPackages(ROOT)
  const used = []
  for (const area of ['apps', 'core', 'test', 'tools'].filter((a) => existsSync(join(ROOT, a))))
    for (const d of readdirSync(join(ROOT, area), { withFileTypes: true })) {
      const file = join(ROOT, area, d.name, 'package.json')
      if (!d.isDirectory() || !existsSync(file)) continue
      const pj = JSON.parse(readFileSync(file, 'utf8'))
      for (const name of Object.keys({ ...pj.dependencies, ...pj.devDependencies, ...pj.peerDependencies }))
        if (real.has(name) && !/\/mock-[^/]+$/.test(real.get(name).dir) && !STOREFRONT_DEMO_UI.has(`${area}/${d.name} → ${name}`))
          used.push(`${area}/${d.name} → ${name}`)
    }
  assert.deepEqual(used, [], "a framework test uses fixtures; an integration's own scenarios live in its package")
})

test('.env: an optional variable is listed commented out under why; it stays so when its block comes back, and is listed once', () => {
  const readme = () => 'README.md'
  const config = {
    ids: ['fx-idp'],
    required: { 'fx-idp': ['FX_ISSUER'] },
    optional: { 'fx-idp': { FX_SECRET: 'optional (its README says when to set it)' } },
  }
  const on = envFor('', config, { readme })
  assert.match(on, /^FX_ISSUER=\n#  FX_SECRET: optional \(its README says when to set it\)\n# FX_SECRET=$/m)
  assert.equal(envFor(on, config, { readme }), on, 'a second run adds nothing')
  const off = envFor(on, { ids: [], required: {} }, { readme })
  assert.match(off, /^# FX_ISSUER=$/m)
  const back = envFor(off, config, { readme })
  assert.match(back, /^FX_ISSUER=$/m)
  assert.match(back, /^# FX_SECRET=$/m)
  assert.equal(back, on)
})

/** The mock shop as config/shop/shopin.config.ts ships it (that file may point at the demo while tests run). */
const MOCK_SHOP = [
  'import { defineConfig } from "@core/integration-kit";',
  'import { mockIdentity } from "@integrations/mock-auth/shopin";',
  'import { mockCms } from "@integrations/mock-cms/shopin";',
  'import { mock } from "@integrations/mock-commerce/shopin";',
  'import { mockPsp } from "@integrations/mock-psp/shopin";',
  'export const config = defineConfig({',
  '  commerce: mock(),',
  '  cms: mockCms(),',
  '  psp: mockPsp(),',
  '  auth: mockIdentity(),',
  '});',
  '',
].join('\n')

/** The repository's integrations and demo (their sources, no dist: as in a fresh clone) and node_modules, with a shop file. */
function sources(dir, shopFile) {
  for (const top of ['integrations', 'demo'])
    cpSync(join(ROOT, top), join(dir, top), {
      recursive: true,
      filter: (src) => !/\/(node_modules|dist)$/.test(src),
    })
  symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'))
  put(dir, 'package.json', JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')))
  put(dir, 'config/shop/package.json', JSON.parse(readFileSync(join(ROOT, 'config/shop/package.json'), 'utf8')))
  cpSync(join(ROOT, 'config/locales.json'), join(dir, 'config/locales.json'))
  put(dir, 'config/shop/shopin.config.ts', shopFile)
}

test('npm run use demo: the vendors the demo switches between get their blocks, commented out, under their README (a fresh clone, nothing built)', { skip: without('demo/shop', 'integrations/commercetools/commerce', 'integrations/contentful/cms') }, () =>
  temp('demo-env', (dir) => {
    sources(dir, shop)
    put(dir, 'config/storefront/storefront.mts', storefront)
    // the copy has no build of the demo's config (as in a fresh clone): what setup reads is the source
    assert.equal(existsSync(join(dir, 'demo/shop/dist')), false)
    assert.deepEqual(useDemo(true, dir), [])
    const read = configFromSource(dir)
    assert.equal(read.skipped, undefined, `the demo config reads from its sources: ${read.skipped}`)
    assert.deepEqual([...read.ids].sort(), ['commercetools', 'contentful', 'mock', 'mock-identity', 'switch'])
    assert.deepEqual(read.required, {}, 'mock data serves without a variable')
    const env = envFor('', read, { readme: (id) => `README of ${id}` })
    for (const [id, name] of [
      ['commercetools', 'COMMERCETOOLS_PROJECT_KEY'],
      ['contentful', 'CONTENTFUL_ACCESS_TOKEN'],
    ]) {
      assert.match(env, new RegExp(`^# ${id} \\(README of ${id}\\): variables for the shop config`, 'm'))
      assert.match(env, new RegExp(`^#  ${name}: optional: without it "${id}" is unavailable.*\\n# ${name}=$`, 'm'))
    }
    assert.doesNotMatch(env, /^[A-Z_]+=$/m, 'nothing the demo starts without is left to fill in')
  }))

test("npm run use: forward into a pairing and back out print the whole command alike; a vendor's parts are imported per category", { skip: without('integrations/commercetools/commerce', 'integrations/commercetools/auth') }, () =>
  temp('use-back', (dir) => {
    sources(dir, MOCK_SHOP)
    const file = () => readFileSync(join(dir, 'config/shop/shopin.config.ts'), 'utf8')
    const forward = useCommand(['commerce', 'commercetools'], dir)
    assert.ok(forward.includes('together: npm run use commerce commercetools auth commercetools'), forward.join('\n'))
    assert.deepEqual(useCommand(['commerce', 'commercetools', 'auth', 'commercetools'], dir), [])
    // one key, two parts (integrations/commercetools/commerce and …/auth): each category imports the part serving it
    assert.match(file(), /^import \{ commercetools \} from "@integrations\/commercetools-commerce\/shopin";$/m)
    assert.match(file(), /^import \{ commercetoolsAuth \} from "@integrations\/commercetools-auth\/shopin";$/m)
    assert.match(file(), /^ {2}commerce: commercetools\(\),$/m)
    assert.match(file(), /^ {2}auth: commercetoolsAuth\(\),$/m)
    const after = file()
    const back = useCommand(['commerce', 'mock'], dir)
    assert.ok(back.includes('together: npm run use commerce mock auth mock-identity'), back.join('\n'))
    assert.equal(file(), after, 'refused: unchanged')
    assert.deepEqual(useCommand(['commerce', 'mock', 'auth', 'mock-identity'], dir), [])
    assert.match(file(), /^ {2}commerce: mock\(\),$/m)
    assert.doesNotMatch(file(), /commercetools/)
    assert.equal(file(), MOCK_SHOP, 'the round trip leaves the file byte for byte as it was')
  }))

test('npm run use <category> off: the line and its import go, commerce stays, and back again leaves the file as it was', () =>
  temp('use-off', (dir) => {
    sources(dir, MOCK_SHOP)
    // the kit's category order, as in the repository: a category that comes back gets its place again
    put(dir, 'core/integration-kit/src/categories.json', JSON.parse(readFileSync(join(ROOT, 'core/integration-kit/src/categories.json'), 'utf8')))
    const file = () => readFileSync(join(dir, 'config/shop/shopin.config.ts'), 'utf8')
    assert.deepEqual(useCommand(['auth', 'off'], dir), [])
    assert.doesNotMatch(file(), /auth:|mockIdentity|mock-auth/)
    assert.match(file(), /^ {2}commerce: mock\(\),$/m, 'the other categories are untouched')
    // nothing configured: nothing to write
    assert.ok(useCommand(['auth', 'off'], dir).noop)
    // commerce cannot go; an unknown category is named with the ones there are
    const before = file()
    assert.match(useCommand(['commerce', 'off'], dir)[0], /^every shop has commerce: switch it instead/)
    assert.match(useCommand(['serch', 'off'], dir)[0], /unknown/)
    assert.equal(file(), before, 'refused: unchanged')
    assert.deepEqual(useCommand(['auth', 'mock-identity'], dir), [])
    assert.equal(file(), MOCK_SHOP, 'off and back leaves the file byte for byte as it was')
    // a factory call over several lines is never split: the new line goes after a one-line entry or first
    const multi = MOCK_SHOP.replace('  commerce: mock(),\n', '  commerce: mock({\n    seed: 1,\n  }),\n').replace('  cms: mockCms(),\n', '')
    const back = useIntegration('cms', 'mock', dir, multi).source
    assert.match(back, /defineConfig\(\{\n {2}cms: mockCms\(\),\n {2}commerce: mock\(\{\n {4}seed: 1,\n {2}\}\),\n/)
  }))

test('npm run use: a wrong key lists only the keys of that category, with the closest one', () =>
  temp('use-keys', (dir) => {
    sources(dir, MOCK_SHOP)
    // the keys come from the descriptors: mock data's are always there, a vendor's while its folder is
    const keys = (category) => integrationsFromSource(dir).filter((i) => i.categories.includes(category)).map((i) => i.id).sort().join(', ')
    assert.deepEqual(useCommand(['cms', 'mokc'], dir).slice(0, 1), [
      `no integration "mokc" for cms (cms takes: ${keys('cms')}); did you mean "mock"?`,
    ])
    assert.match(keys('cms'), /\bmock\b/)
    assert.doesNotMatch(keys('cms'), /mock-identity|commercetools/, 'only the keys of that category')
    assert.deepEqual(useCommand(['commerce', 'mock-identity'], dir).slice(0, 1), [
      `"mock-identity" does not serve commerce (commerce takes: ${keys('commerce')})`,
    ])
    assert.match(useCommand(['serch', 'mock'], dir)[0], /unknown key "serch" \(did you mean "search"\?\)/)
    assert.deepEqual(useCommand(['auth', 'mock-identiy'], dir).slice(0, 1), [
      `no integration "mock-identiy" for auth (auth takes: ${keys('auth')}); did you mean "mock-identity"?`,
    ])
  }))

test('.env: a misspelled variable is named with the one the integration reads (names only, never a value)', () => {
  const config = { required: { contentful: ['CONTENTFUL_SPACE', 'CONTENTFUL_ACCESS_TOKEN'] }, optional: {}, defaults: {} }
  const env = 'CONTENTFUL_SPACE_ID=secret-space\nCONTENTFUL_ACCESS_TOKEN=t\nLOG_LEVEL=info\n'
  assert.deepEqual(envNearMisses(env, config), [
    '.env sets CONTENTFUL_SPACE_ID, which nothing reads: did you mean CONTENTFUL_SPACE (contentful)?',
  ])
  assert.deepEqual(envNearMisses('CONTENTFUL_SPACE=s\nCONTENTFUL_SPACE_ID=x\n', config), [], 'set: nothing to say')
  assert.doesNotMatch(envNearMisses(env, config).join(''), /secret-space/)
})

test('.env: the block of a configured integration follows today\'s config: required ones uncommented and marked, no stale note', () => {
  const readme = () => 'README.md'
  // written while the demo served commercetools through its switch: optional, commented out
  const demo = envFor(
    '',
    { ids: ['switch', 'commercetools'], required: {}, optional: { commercetools: { CT_KEY: 'optional: without it "commercetools" is unavailable and "switch" serves without it' } } },
    { readme },
  )
  assert.match(demo, /^#  CT_KEY: optional: .*"switch" serves without it\n# CT_KEY=$/m)
  // the demo is gone; the shop names commercetools itself: the variable is required now
  const shop = envFor(demo, { ids: ['commercetools'], required: { commercetools: ['CT_KEY'] } }, { readme })
  assert.match(shop, /^#  CT_KEY: required\nCT_KEY=$/m)
  assert.doesNotMatch(shop, /switch/)
  assert.equal(envFor(shop, { ids: ['commercetools'], required: { commercetools: ['CT_KEY'] } }, { readme }), shop)
})

test('npm run use is all or nothing: a build that fails after the install puts back every file it wrote', () =>
  temp('use-atomic', (dir) => {
    const { run, file } = repository(dir)
    put(
      dir,
      'config/shop/shopin.config.ts',
      `import { defineConfig } from "@core/integration-kit";
import { fxShop } from "@integrations/fx-shop/shopin";
export const config = defineConfig({
  commerce: fxShop(),
});
`,
    )
    put(dir, '.env', 'LOG_LEVEL=info\n')
    put(dir, 'integrations/fx-cms/cms/package.json', { name: '@integrations/fx-cms', exports: { './shopin': './dist/shopin.js' } })
    put(
      dir,
      'integrations/fx-cms/cms/src/shopin.ts',
      'import { defineIntegration } from "@core/integration-kit";\nexport const fxCms = () => defineIntegration({ id: "fx-cms", ports: { cms: () => require("./bff") }, env: { cms: { token: { env: "FX_CMS_TOKEN" } } } });\n',
    )
    // npm installs (recorded); the turbo build fails, as a broken integration would
    put(
      dir,
      '.fake-bin/npx',
      `#!/bin/sh\necho "npx $*" >> "${join(dir, '.calls')}"\n[ -f "${join(dir, '.fail-turbo')}" ] && case "$*" in *turbo*) exit 3;; esac\nexit 0\n`,
    )
    // npm rewrites the lockfile on every install, each time otherwise (as the real one flips flags when the packages
    // change): here it counts its installs in the lockfile
    const bump = join(dir, '.fake-bin/bump.cjs')
    put(
      dir,
      '.fake-bin/bump.cjs',
      `const fs = require('fs'), f = ${JSON.stringify(join(dir, 'package-lock.json'))}, l = JSON.parse(fs.readFileSync(f, 'utf8'));
l.installs = (l.installs || 0) + 1;
fs.writeFileSync(f, JSON.stringify(l, null, 2) + '\\n');
`,
    )
    put(
      dir,
      '.fake-bin/npm',
      `#!/bin/sh\necho "npm $*" >> "${join(dir, '.calls')}"\ncase "$1" in install) "${process.execPath}" "${bump}"; echo "added 1 package";; esac\nexit 0\n`,
    )
    // the shop's files as its own setup writes them (the fake build makes nothing, so that setup stops at the
    // config check: its files are written by then), then the build starts failing
    run()
    put(dir, '.fail-turbo', '')
    put(dir, '.calls', '')
    // a root script of a workspace that is gone: the setup inside npm run use drops it, the put-back restores it
    const root = JSON.parse(file('package.json'))
    root.scripts['fx-migrate'] = 'npm run migrate -w @integrations/fx-gone'
    put(dir, 'package.json', root)
    const watched = ['config/shop/shopin.config.ts', '.env', 'config/shop/package.json', 'package-lock.json', 'config/storefront/wired.mts', 'package.json']
    const before = watched.map(file)
    const r = run('use', 'cms', 'fx-cms')
    assert.notEqual(r.status, 0, 'the failure is reported')
    assert.match(r.stderr, /setup: npm run use failed; put back as they were: .*config\/shop\/shopin\.config\.ts/)
    assert.match(r.stderr, /npx turbo run setup .* failed \(exit 3\)/)
    assert.deepEqual(watched.map(file), before, 'every file as it was, the lockfile byte for byte')
    // only the failure and the put-back: no summary of a setup that did not happen
    assert.doesNotMatch(r.stdout, /installed and built|next: npm run dev/)
    assert.equal((r.stdout.match(/added 1 package/g) ?? []).length, 1, 'the put-back install prints nothing')
    // it wrote and installed first (so there was something to undo), then installed again for the restored files
    assert.match(file('.calls'), /npm install[\s\S]*npm install/)
  }))

test("the lockfile's dev flags do not depend on the install's history: a switch and back gives the same lockfile", () =>
  temp('lock-flags', (dir) => {
    // the repository's manifests and lockfile, without node_modules (the lockfile is the tree)
    const pj = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    put(dir, 'package.json', pj)
    for (const glob of pj.workspaces) {
      const [a, b] = glob.split('/')
      for (const x of readdirSync(join(ROOT, a), { withFileTypes: true }).filter((e) => e.isDirectory()))
        for (const y of b === '*' && glob.split('/').length === 3
          ? readdirSync(join(ROOT, a, x.name), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `${x.name}/${e.name}`)
          : [x.name]) {
          const f = join(a, y, 'package.json')
          if (existsSync(join(ROOT, f))) put(dir, f, readFileSync(join(ROOT, f), 'utf8'))
        }
    }
    const lock = readFileSync(join(ROOT, 'package-lock.json'), 'utf8')
    // what an install after a switch leaves: the same packages, other flags
    const flipped = lock.replace(/"dev": true/g, '"devOptional": true')
    assert.notEqual(flipped, lock)
    put(dir, 'package-lock.json', flipped)
    assert.equal(normaliseLock(dir), true, "npm's Arborist is found")
    assert.equal(readFileSync(join(dir, 'package-lock.json'), 'utf8'), lock, 'the committed lockfile is the normal form')
  }))

test('.env: a misspelled name is renamed where it stands (value kept), and no second block lists the right one', () => {
  const config = { ids: ['contentful'], required: { contentful: ['CONTENTFUL_SPACE', 'CONTENTFUL_ACCESS_TOKEN'] } }
  const env = 'LOG_LEVEL=info\nCONTENTFUL_SAPCE=my-space\nCONTENTFUL_ACCESS_TOKEN=t\n'
  const { text, renamed } = renameNearMisses(env, config)
  assert.deepEqual(renamed, [['CONTENTFUL_SAPCE', 'CONTENTFUL_SPACE', 'contentful']])
  assert.match(text, /^#  CONTENTFUL_SPACE: renamed from CONTENTFUL_SAPCE by npm run setup\nCONTENTFUL_SPACE=my-space$/m)
  const after = envFor(text, config, { readme: () => 'README.md' })
  assert.equal(after.match(/^CONTENTFUL_SPACE=/gm).length, 1, 'listed once')
  assert.doesNotMatch(after, /CONTENTFUL_SAPCE=/)
})

test('.env: every setup rewrites the notes of a commented-out block too (no note of the config that used it)', () => {
  const readme = () => 'README.md'
  const demo = envFor(
    '',
    { ids: ['switch', 'ct'], required: {}, optional: { ct: { CT_KEY: 'optional: without it "ct" is unavailable and "switch" serves without it' } } },
    { readme },
  )
  assert.match(demo, /"switch" serves without it/)
  // the demo is off: ct is not configured any more
  const off = envFor(demo, { ids: [], required: {} }, { readme })
  assert.match(off, /^# ct \(README\.md\): not in the shop config any more/m)
  assert.match(off, /^# CT_KEY=$/m)
  assert.doesNotMatch(off, /switch/)
})

test('npm run use: an already-configured key runs no setup (no install, no build)', () =>
  temp('use-noop', (dir) => {
    const { run, file } = repository(dir)
    put(
      dir,
      'config/shop/shopin.config.ts',
      `import { defineConfig } from "@core/integration-kit";
import { fxShop } from "@integrations/fx-shop/shopin";
export const config = defineConfig({
  commerce: fxShop(),
});
`,
    )
    const r = run('use', 'commerce', 'FX-SHOP')
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stdout, /already serves commerce: fxShop\(\): nothing to change/)
    assert.equal(file('.calls'), '', 'no npm, no turbo')
  }))

test("npm run use: a category without its key lists that category's keys; a category named twice is refused, nothing written", () =>
  temp('use-pairs', (dir) => {
    sources(dir, MOCK_SHOP)
    const before = readFileSync(join(dir, 'config/shop/shopin.config.ts'), 'utf8')
    const keys = (c) =>
      integrationsFromSource(dir)
        .filter((i) => i.categories.includes(c))
        .map((i) => i.id)
        .sort()
        .join(', ')
    assert.deepEqual(useCommand(['cms'], dir), [
      `npm run use cms: "cms" has no key after it (cms takes: ${keys('cms')}); name one key after each category, e.g. npm run use cms ${keys('cms').split(', ')[0]}`,
    ])
    assert.match(useCommand(['auth', 'search', 'mock'], dir)[0], /^npm run use auth search mock: "auth" has no key after it \(auth takes: /)
    assert.deepEqual(useCommand(['cms', 'mock', 'cms', 'mock'], dir), ['cms is named more than once (mock, mock): name each category once'])
    assert.equal(readFileSync(join(dir, 'config/shop/shopin.config.ts'), 'utf8'), before)
  }))

test("a configured package whose node_modules link is gone: config:check names it and the fix (not a bare TS2307)", () =>
  temp('unlinked', (dir) => {
    const { config, run } = repository(dir)
    config('fxIndex("fx-shop")')
    // the fixture integrations are workspaces npm has not linked in this copy
    const r = run('--check')
    assert.notEqual(r.status, 0)
    assert.match(r.stderr, /node_modules\/@integrations\/fx-shop is missing \(its workspace link\): run npm run setup/)
    put(dir, 'nm/node_modules/@x/a/package.json', { name: '@x/a' })
    assert.deepEqual(unlinked(join(dir, 'nm'), ['@x/a', '@x/b']), ['@x/b'])
  }))

test('removing an integration removes its .env block (not only commenting it) and names a tool that belongs to it', () => {
  const readme = (id) => `integrations/${id}/cms/README.md`
  const config = { ids: ['fx-cms'], required: { 'fx-cms': ['FX_CMS_TOKEN'] } }
  const on = envFor('LOG_LEVEL=info\n', config, { readme }).replace('FX_CMS_TOKEN=', 'FX_CMS_TOKEN=t')
  // switched away, the folder still there: commented out, values kept
  const off = envFor(on, { ids: [], required: {} }, { readme, exists: () => true })
  assert.match(off, /^# FX_CMS_TOKEN=t$/m)
  // the folder deleted: the block goes
  assert.equal(envFor(off, { ids: [], required: {} }, { readme, exists: () => false }), 'LOG_LEVEL=info\n')
  const packages = new Map([
    fixture('@integrations/fx-migrate', 'integrations/fx-migrate/cms', { shopin: { toolOf: ['@integrations/fx-cms'] } }),
  ])
  assert.deepEqual(orphanedTools(packages), [
    'integrations/fx-migrate/cms (@integrations/fx-migrate) is a tool of @integrations/fx-cms, which integrations/ no longer has: npm run setup deletes it',
  ])
  packages.set(...fixture('@integrations/fx-cms', 'integrations/fx-cms/cms'))
  assert.deepEqual(orphanedTools(packages), [])
})

test('npm run use: a switch and back leaves shopin.config.ts byte for byte as it was (imports in their order)', () =>
  temp('use-order', (dir) => {
    for (const [folder, name, factory] of [
      ['fx-a/commerce', '@integrations/fx-a', 'fxA'],
      ['fx-b/auth', '@integrations/fx-b', 'fxB'],
      ['fx-c/auth', '@integrations/fx-c', 'fxC'],
    ]) {
      put(dir, `integrations/${folder}/package.json`, { name })
      put(dir, `integrations/${folder}/src/shopin.ts`, `export const ${factory} = () => defineIntegration({})\n`)
    }
    const shopFile = [
      'import { defineConfig } from "@core/integration-kit";',
      'import { fxA } from "@integrations/fx-a/shopin";',
      'import { fxB } from "@integrations/fx-b/shopin";',
      'import { contracts } from "@shopin/contracts";',
      '',
      'export const config = defineConfig({',
      '  commerce: fxA(),',
      '  auth: fxB(),',
      '  contracts,',
      '});',
      '',
    ].join('\n')
    put(dir, 'config/shop/shopin.config.ts', shopFile)
    const away = useIntegration('auth', 'fxC', dir, undefined, []).source
    assert.match(away, /fx-a\/shopin";\nimport \{ fxC \} from "@integrations\/fx-c\/shopin";\nimport \{ contracts \}/)
    assert.equal(useIntegration('auth', 'fxB', dir, away, []).source, shopFile)
  }))

test('a deleted SDK of a configured integration is named (with whose it is), not left to the BFF', () =>
  temp('unresolved', (dir) => {
    put(dir, 'config/shop/package.json', { name: '@shopin/config', dependencies: { '@integrations/fx-a': '*', 'fx-sdk': '^1.0.0' } })
    put(dir, 'node_modules/@shopin/config/package.json', { name: '@shopin/config' })
    put(dir, 'node_modules/@integrations/fx-a/package.json', { name: '@integrations/fx-a' })
    put(dir, 'node_modules/fx-sdk/package.json', { name: 'fx-sdk' })
    const packages = new Map([fixture('@integrations/fx-a', 'integrations/fx-a/commerce', { dependencies: { 'fx-client': '1' } })])
    put(dir, 'integrations/fx-a/commerce/node_modules/fx-client/package.json', { name: 'fx-client' })
    const used = { 'config/shop': new Set(['@integrations/fx-a']) }
    assert.deepEqual(unresolvedModules(dir, packages, used), [])
    rmSync(join(dir, 'node_modules/fx-sdk'), { recursive: true })
    rmSync(join(dir, 'integrations/fx-a/commerce/node_modules/fx-client'), { recursive: true })
    assert.deepEqual(unresolvedModules(dir, packages, used), [
      ['fx-sdk', '@shopin/config'],
      ['fx-client', '@integrations/fx-a'],
    ])
  }))

test('CI runs npm run config:check after the install and after building the config packages it compares', () => {
  const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8')
  const steps = [...ci.matchAll(/^\s+run: (.+)$/gm)].map((m) => m[1].trim())
  const at = (command) => steps.findIndex((s) => s.startsWith(command))
  assert.notEqual(at('npm run config:check'), -1, 'no CI step runs npm run config:check')
  assert.ok(at('npm ci') !== -1 && at('npm ci') < at('npm run config:check'), 'config:check runs before npm ci')
  const build = steps.findIndex((s) => s.includes('--filter=@shopin/config') && s.includes('--filter=@shopin/storefront'))
  assert.ok(build !== -1 && build < at('npm run config:check'), 'the config packages are not built before config:check')
})

test('deleting an integration, one setup also deletes its tool and the root script that ran the tool, and says so', () =>
  temp('orphans', (dir) => {
    put(dir, 'package.json', {
      name: 'root',
      workspaces: ['integrations/*/*'],
      scripts: { migrate: 'npm run migrate -w @integrations/fx-migrate', dev: 'turbo run dev --filter=@integrations/fx-other' },
    })
    put(dir, 'integrations/fx-migrate/cms/package.json', { name: '@integrations/fx-migrate', shopin: { toolOf: ['@integrations/fx-cms'] } })
    put(dir, 'integrations/fx-other/cms/package.json', { name: '@integrations/fx-other' })
    // the last install linked @integrations/fx-cms, whose folder is gone now
    put(dir, 'package-lock.json', { packages: { 'node_modules/@integrations/fx-cms': { resolved: 'integrations/fx-cms/cms', link: true } } })
    assert.deepEqual(removeOrphans(dir), [
      'deleted integrations/fx-migrate/cms (@integrations/fx-migrate): a tool of @integrations/fx-cms, which integrations/ no longer has',
      'removed the root script "migrate" (npm run migrate -w @integrations/fx-migrate): no workspace @integrations/fx-migrate',
    ])
    assert.equal(existsSync(join(dir, 'integrations/fx-migrate/cms')), false)
    assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).scripts), ['dev'])
    assert.deepEqual(removeOrphans(dir), [], 'nothing left to remove')
  }))

test('removeOrphans never deletes a folder it was not asked to: a tool of an integration never installed, or of one still there, stays', () =>
  temp('orphans-kept', (dir) => {
    put(dir, 'package.json', { name: 'root', workspaces: ['integrations/*/*'] })
    // fx-cms was installed and is gone; fx-search was never installed here (no link: a fresh clone, a typo)
    put(dir, 'package-lock.json', { packages: { 'node_modules/@integrations/fx-cms': { resolved: 'integrations/fx-cms/cms', link: true } } })
    put(dir, 'integrations/fx-sync/search/package.json', { name: '@integrations/fx-sync', shopin: { toolOf: ['@integrations/fx-search'] } })
    // a tool of two integrations, one of them still there
    put(dir, 'integrations/fx-both/cms/package.json', { name: '@integrations/fx-both', shopin: { toolOf: ['@integrations/fx-cms', '@integrations/fx-other'] } })
    put(dir, 'integrations/fx-other/cms/package.json', { name: '@integrations/fx-other' })
    // a package that names no parent
    put(dir, 'integrations/fx-plain/cms/package.json', { name: '@integrations/fx-plain' })
    assert.deepEqual(removeOrphans(dir), [])
    for (const kept of ['fx-sync/search', 'fx-both/cms', 'fx-other/cms', 'fx-plain/cms'])
      assert.ok(existsSync(join(dir, 'integrations', kept)), `integrations/${kept} was deleted`)
  }))
