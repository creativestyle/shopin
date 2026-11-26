import type { Provider } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PortOptions, TokenVault } from '@core/integration-kit'
import { PinoLogger } from 'nestjs-pino'
import authPort from '../src/commercetools-auth.module'

/**
 * The BFF compiles the port's providers at start. A helper function among them (a re-export of the vendor core's
 * scope or predicate helpers) made Nest throw "metatype is not a constructor" and the BFF never started.
 */
describe('commercetools auth port', () => {
  it('registers only classes and provider objects as providers', () => {
    const helpers = authPort.providers!.filter(
      (p) =>
        typeof p === 'function' &&
        !/^class\s/.test(Function.prototype.toString.call(p))
    )
    expect(helpers.map((p) => (p as { name: string }).name)).toEqual([])
  })

  it('boots: the providers compile and the factory gives the auth port', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ...(authPort.providers as Provider[]),
        // supplied by the BFF to every port; the boot needs only the token
        { provide: TokenVault, useValue: {} },
        { provide: PinoLogger, useValue: { setContext() {} } },
        {
          provide: PortOptions,
          useValue: {
            projectKey: 'test-project',
            clientId: 'test-client',
            clientSecret: 'test-secret',
            apiUrl: 'https://api.example.invalid',
            authUrl: 'https://auth.example.invalid',
          },
        },
      ],
    }).compile()
    const deps = authPort.inject!.map((token) => moduleRef.get(token as never))
    const auth = (authPort.useFactory as (...a: unknown[]) => unknown)(...deps)
    expect(Object.keys(auth as object)).toEqual(
      expect.arrayContaining(['signIn', 'signUp', 'signOut', 'refresh'])
    )
  })
})

describe('commercetools sign-in: API client scopes at start', () => {
  const real = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = real
  })
  const OPTIONS = {
    projectKey: 'p',
    clientId: 'c',
    clientSecret: 's',
    apiUrl: 'https://api.example.invalid',
    authUrl: 'https://auth.example.invalid',
  }
  const answering = (scope: string) =>
    (async () =>
      new Response(JSON.stringify({ scope }), {
        status: 200,
      })) as unknown as typeof fetch

  it('starts with manage_customers (sign-up creates customers, sign-in and the re-check read them)', async () => {
    globalThis.fetch = answering('manage_customers:p manage_my_profile:p')
    await expect(
      authPort.probe!({} as never, OPTIONS as never)
    ).resolves.toBeUndefined()
  })

  it('stops and names manage_customers when the API client has shopper scopes only', async () => {
    globalThis.fetch = answering(
      'view_published_products:p manage_my_profile:p'
    )
    await expect(
      authPort.probe!({} as never, OPTIONS as never)
    ).rejects.toThrow(
      /creates and reads customers with the API client, but the API client \(COMMERCETOOLS_CLIENT_ID\) lacks the scopes: manage_customers\./
    )
  })
})
