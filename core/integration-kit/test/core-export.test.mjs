/**
 * Who may use the framework internals, `@core/integration-kit/core` (story criterion 36). Today the gate is on the
 * types only: the `./core` export gives its types under the `shopin-framework` condition, which the BFF, the
 * storefront and the scenario tests compile with; an integration compiled with the shared
 * `@core/typescript-config/nestjs.json` gets no types for it and does not compile. Its JavaScript resolves for any
 * package: gating it too would need the condition at run time in the BFF's start, the setup script, the storefront's
 * bundler and every jest config. When that happens, the last test here fails and is turned around.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const tsc = createRequire(join(ROOT, 'package.json')).resolve(
  'typescript/bin/tsc'
)

const CORE_IMPORT =
  "import * as core from '@core/integration-kit/core'\nexport const internals = core\n"

/**
 * Compiles `source` as one file of an integration package (the shared `@core/typescript-config/nestjs.json`, as the
 * integrations' own tsconfigs extend it), with these extra options.
 */
function compile(compilerOptions = {}, source = CORE_IMPORT) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'kit-core-export-')))
  try {
    symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'), 'dir')
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        extends: join(ROOT, 'core/typescript-config/nestjs.json'),
        compilerOptions: { noEmit: true, types: [], ...compilerOptions },
        files: ['part.ts'],
      })
    )
    writeFileSync(join(dir, 'part.ts'), source)
    const r = spawnSync(process.execPath, [tsc, '-p', dir], {
      encoding: 'utf8',
    })
    return { status: r.status, output: `${r.stdout}${r.stderr}` }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('an integration (no shopin-framework condition) does not compile against @core/integration-kit/core', () => {
  const { status, output } = compile()
  assert.notEqual(status, 0, output)
  assert.match(output, /TS(7016|2307)\b.*@core\/integration-kit\/core/)
})

test('framework code (the shopin-framework condition) compiles against it', () => {
  const { status, output } = compile({ customConditions: ['shopin-framework'] })
  assert.equal(status, 0, output)
})

test('an integration builds against the author API alone (no shopin-framework condition)', () => {
  // a descriptor, a port with a credentials check and an error mapping, and a service reading what the BFF hands a
  // port: everything an integration writes, from `.` only
  const { status, output } = compile(
    {},
    `import {
  checkEndpoint,
  CustomerContext,
  defineIntegration,
  port,
  PortOptions,
  RequestContext,
  TokenVault,
  type Port,
  type PortError,
} from '@core/integration-kit'

const env = { token: { env: 'FX_TOKEN' }, region: { env: 'FX_REGION', optional: true } } as const
type Options = PortOptions.Of<typeof env>

class Pages {
  constructor(
    private readonly options: Options,
    private readonly request: RequestContext,
    private readonly vault: TokenVault,
    private readonly customer: CustomerContext
  ) {}
  async page(): Promise<string> {
    const tokens = await this.vault.get()
    return [this.options.token, this.request.language, tokens?.accessToken, await this.customer.customerId()].join()
  }
}

const errors = (error: unknown): PortError | undefined =>
  (error as { status?: number }).status === 404 ? { status: 404 } : undefined

export const cmsPort = port('cms', {
  inject: [PortOptions, RequestContext, TokenVault, CustomerContext],
  useFactory: (o: Options, r: RequestContext, v: TokenVault, c: CustomerContext): Port<'cms'> => {
    void new Pages(o, r, v, c)
    return {} as Port<'cms'>
  },
  probe: (_port, options) =>
    checkEndpoint('https://fx.example/health', { headers: { authorization: options.token ?? '' } }, { credentials: 'FX_TOKEN' }),
  errors,
})

export const fxCms = () =>
  defineIntegration({
    id: 'fx-cms',
    label: 'Fixture CMS',
    description: { en: 'Pages from fixtures', de: 'Seiten aus Fixtures' },
    env: { cms: env },
    ports: { cms: () => cmsPort },
  })
`
  )
  assert.equal(status, 0, output)
})

test('the gate is on the types only: the JavaScript of ./core resolves for any package', () => {
  const fromIntegration = createRequire(
    join(ROOT, 'integrations/any/part/package.json')
  )
  assert.match(
    fromIntegration.resolve('@core/integration-kit/core'),
    /integration-kit[/\\]dist[/\\]core\.js$/
  )
})
