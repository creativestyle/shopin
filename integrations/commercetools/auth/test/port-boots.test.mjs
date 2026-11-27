import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { PortOptions, TokenVault } from '@core/integration-kit'
import { PinoLogger } from 'nestjs-pino'
import authModule from '../dist/commercetools-auth.module.js'

const authPort = authModule.default

/**
 * The BFF compiles the port's providers at start. A helper function among them (a re-export of the vendor core's
 * scope or predicate helpers) made Nest throw "metatype is not a constructor" and the BFF never started.
 */
describe('commercetools auth port', () => {
  it('registers only classes and provider objects as providers', () => {
    const helpers = authPort.providers.filter(
      (p) =>
        typeof p === 'function' &&
        !/^class\s/.test(Function.prototype.toString.call(p))
    )
    assert.deepEqual(
      helpers.map((p) => p.name),
      []
    )
  })

  it('boots: the providers compile and the factory gives the auth port', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ...authPort.providers,
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
    const deps = authPort.inject.map((token) => moduleRef.get(token))
    const auth = authPort.useFactory(...deps)
    const keys = Object.keys(auth)
    for (const name of ['signIn', 'signUp', 'signOut', 'refresh']) {
      assert.ok(keys.includes(name), `auth port lacks ${name}`)
    }
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
  const answering = (scope) => async () =>
    new Response(JSON.stringify({ scope }), {
      status: 200,
    })

  it('starts with manage_customers (sign-up creates customers, sign-in and the re-check read them)', async () => {
    globalThis.fetch = answering('manage_customers:p manage_my_profile:p')
    assert.equal(await authPort.probe({}, OPTIONS), undefined)
  })

  it('stops and names manage_customers when the API client has shopper scopes only', async () => {
    globalThis.fetch = answering(
      'view_published_products:p manage_my_profile:p'
    )
    await assert.rejects(
      authPort.probe({}, OPTIONS),
      /creates and reads customers with the API client, but the API client \(COMMERCETOOLS_CLIENT_ID\) lacks the scopes: manage_customers\./
    )
  })
})
