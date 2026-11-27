import {
  CustomerContext,
  PortOptions,
  RequestContext,
  TokenVault,
  type Category,
  type Port,
  type PortDefinition,
  type VaultEntry,
} from '../index'

const PORT = Symbol('port under test')

/** The part of `@nestjs/testing` used here. */
interface NestTesting {
  Test: {
    createTestingModule(metadata: object): {
      compile(): Promise<{ get(token: unknown): unknown }>
    }
  }
}

/** An in-memory token vault: what the BFF's encrypted cookie holds, for one test. */
class MemoryVault extends TokenVault {
  private entry?: VaultEntry
  async get() {
    return this.entry
  }
  async set(tokens: Omit<VaultEntry, 'customer'>, customer: boolean) {
    this.entry = { ...tokens, customer }
  }
  clear() {
    this.entry = undefined
  }
}

/**
 * Builds a port as the BFF does: its own Nest providers and imports, `PortOptions`, an in-memory `TokenVault`, a
 * `CustomerContext` (a guest unless `customerId` is given) and an en-US/USD `RequestContext` (`locales` sets the
 * shop's locales it lists). `providers` adds or
 * replaces providers (a fake API client, a logger). Needs `@nestjs/testing`.
 */
export async function buildPort<C extends Category>(
  definition: PortDefinition<C>,
  setup: {
    /** The storefront's base URL the port sees (`RequestContext.storefrontUrl`), e.g. for a payment return link. */
    storefrontUrl: string
    options?: Record<string, string | undefined>
    providers?: unknown[]
    customerId?: string
    /** The shop's locales the port sees (`RequestContext.locales`), the first is the default; en-US alone if not given. */
    locales?: readonly string[]
  }
): Promise<Port<C>> {
  // required when called, and typed here: the kit also builds where @nestjs/testing is not installed (storefront)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Test } = require('@nestjs/testing') as NestTesting
  const context: RequestContext = {
    language: 'en-US',
    currency: 'USD',
    header: () => undefined,
    storefrontUrl: setup.storefrontUrl,
    getCurrentLanguage: () => 'en-US',
    locales: setup.locales ?? ['en-US'],
  }
  // what the BFF provides to every port (a global module there too)
  const given = [
    { provide: PortOptions, useValue: Object.freeze({ ...setup.options }) },
    { provide: TokenVault, useClass: MemoryVault },
    {
      provide: CustomerContext,
      useValue: { customerId: async () => setup.customerId },
    },
    { provide: RequestContext, useValue: context },
  ]
  const module = await Test.createTestingModule({
    imports: [
      {
        module: class PortContext {},
        global: true,
        providers: given,
        exports: given.map((g) => g.provide),
      },
      ...((definition.imports ?? []) as never[]),
    ],
    providers: [
      ...((definition.providers ?? []) as never[]),
      ...((setup.providers ?? []) as never[]),
      {
        provide: PORT,
        inject: (definition.inject ?? []) as never[],
        useFactory: definition.useFactory,
      },
    ],
  }).compile()
  return module.get(PORT) as Port<C>
}
