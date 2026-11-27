/**
 * The commerce port's guest session (commercetools' `me` API needs an anonymous token for guest carts,
 * whichever identity provider is chosen) and commercetools' own sign-in as an auth port: the OAuth calls it
 * makes and how a commercetools customer becomes the identity the BFF links. fetch and the API clients are
 * fakes; no network.
 */
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import core from '@integrations/commercetools-core'
import identity from '../dist/identity.js'
import loginService from '../dist/services/login.service.js'
import errorMatcher from '../dist/utils/commercetools-error-matcher.js'
import {
  FakeMeClient,
  FakeProjectClient,
  fakeOAuthFetch,
} from './fake-client.mjs'

const { CommercetoolsGuestSessionService, OAuthTokenService } = core
const { CommercetoolsIdentityProvider } = identity
const { CommercetoolsLoginService } = loginService
const { CommercetoolsErrorMatcher } = errorMatcher

const OPTIONS = {
  projectKey: 'proj',
  clientId: 'id',
  clientSecret: 'secret',
  apiUrl: 'https://api.fake.invalid',
  authUrl: 'https://auth.fake.invalid',
  storeKeys: undefined,
}
const BASIC = `Basic ${Buffer.from('id:secret').toString('base64')}`
const SCOPE =
  'view_published_products:proj manage_my_payments:proj manage_my_orders:proj manage_my_profile:proj manage_my_shopping_lists:proj'

const realFetch = global.fetch
afterEach(() => {
  global.fetch = realFetch
})

const token = (prefix) => ({
  status: 200,
  body: {
    access_token: `${prefix}-access`,
    refresh_token: `${prefix}-refresh`,
    expires_in: 3600,
    scope: SCOPE,
  },
})

describe('commercetools guest session', () => {
  it('creates an anonymous session with the client credentials and the shopper scopes', async () => {
    const requests = []
    global.fetch = fakeOAuthFetch(requests, () => token('anon'))
    const session = new CommercetoolsGuestSessionService(
      new OAuthTokenService(OPTIONS)
    )
    assert.deepEqual(await session.createGuestSession(), {
      accessToken: 'anon-access',
      refreshToken: 'anon-refresh',
      expiresIn: 3600,
    })
    assert.deepEqual(requests, [
      {
        method: 'POST',
        url: 'https://auth.fake.invalid/oauth/proj/anonymous/token',
        authorization: BASIC,
        form: { grant_type: 'client_credentials', scope: SCOPE },
      },
    ])
  })

  it('refreshes with the refresh token it is given, at the token endpoint', async () => {
    const requests = []
    // as commercetools answers a refresh_token grant: a new access token, no refresh token
    const { refresh_token: _none, ...noRefresh } = token('renewed').body
    global.fetch = fakeOAuthFetch(requests, () => ({
      status: 200,
      body: noRefresh,
    }))
    const session = new CommercetoolsGuestSessionService(
      new OAuthTokenService(OPTIONS)
    )
    assert.deepEqual(await session.refresh('anon-refresh'), {
      accessToken: 'renewed-access',
      // the refresh token given stays valid and is handed back, so the vault keeps it
      refreshToken: 'anon-refresh',
      expiresIn: 3600,
    })
    assert.deepEqual(requests, [
      {
        method: 'POST',
        url: 'https://auth.fake.invalid/oauth/token',
        authorization: BASIC,
        form: { grant_type: 'refresh_token', refresh_token: 'anon-refresh' },
      },
    ])
  })

  it('an OAuth error surfaces with its status, no tokens', async () => {
    global.fetch = fakeOAuthFetch([], () => ({
      status: 400,
      body: { error: 'invalid_grant' },
    }))
    const session = new CommercetoolsGuestSessionService(
      new OAuthTokenService(OPTIONS)
    )
    await assert.rejects(session.refresh('spent'), (e) => {
      assert.equal(e.statusCode, 400)
      assert.equal(e.body.error, 'invalid_grant')
      return true
    })
  })
})

describe('commercetools sign-in (auth port)', () => {
  function provider() {
    const server = new FakeProjectClient()
    const meCalls = []
    const customers = server.customers_
    const serverClient = { getClient: () => server }
    // the customer token the password flow returns acts as that customer at me()
    const user = {
      forToken: (t) =>
        new FakeMeClient(
          t,
          {
            carts: new Set(),
            customer: customers.find((c) => c.id === 'ct-alice'),
          },
          meCalls
        ),
    }
    const oauth = new OAuthTokenService(OPTIONS)
    const login = new CommercetoolsLoginService(
      oauth,
      new CommercetoolsErrorMatcher(),
      OPTIONS,
      serverClient,
      user
    )
    const idp = new CommercetoolsIdentityProvider(
      login,
      {},
      {},
      serverClient,
      user
    )
    return { idp, server, customers, meCalls }
  }

  it('maps the customer the password flow authenticated: subject = customer id; its token is the commerce session', async () => {
    const { idp, server, customers, meCalls } = provider()
    customers.push({
      id: 'ct-alice',
      version: 1,
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Example',
      isEmailVerified: true,
      authenticationMode: 'Password',
    })
    const requests = []
    global.fetch = fakeOAuthFetch(requests, () => token('customer'))
    const result = await idp.signIn({
      email: 'Alice@Example.com',
      password: 'pw',
    })
    assert.deepEqual(result, {
      identity: {
        subject: 'ct-alice',
        email: 'alice@example.com',
        emailVerified: true,
        name: 'Alice Example',
      },
      commerceSession: {
        accessToken: 'customer-access',
        refreshToken: 'customer-refresh',
        expiresIn: 3600,
      },
    })
    // e-mail verification checked first (server client), then the password flow, then me() with its token
    assert.deepEqual(server.calls, [
      'GET customers where lowercaseEmail="alice@example.com"',
    ])
    assert.deepEqual(requests, [
      {
        method: 'POST',
        url: 'https://auth.fake.invalid/oauth/proj/customers/token',
        authorization: BASIC,
        form: {
          grant_type: 'password',
          username: 'Alice@Example.com',
          password: 'pw',
          scope: SCOPE,
        },
      },
    ])
    assert.deepEqual(meCalls, ['customer-access GET me'])
  })

  it("with the guest's anonymous token, signs in through me/login first: commercetools merges the guest cart (as before the migration)", async () => {
    const { idp, customers, meCalls } = provider()
    customers.push({
      id: 'ct-alice',
      version: 1,
      email: 'alice@example.com',
      isEmailVerified: true,
    })
    const requests = []
    global.fetch = fakeOAuthFetch(requests, () => token('customer'))
    await idp.signIn(
      { email: 'alice@example.com', password: 'pw' },
      { commerceAccessToken: 'guest-anon' }
    )
    // me/login with the guest token before the password flow; then me() with the customer's token
    assert.deepEqual(meCalls, [
      'guest-anon POST me/login alice@example.com',
      'customer-access GET me',
    ])
    assert.equal(requests.length, 1)
  })

  it('without a guest session there is nothing to merge: no me/login', async () => {
    const { idp, customers, meCalls } = provider()
    customers.push({ id: 'ct-alice', version: 1, email: 'alice@example.com' })
    global.fetch = fakeOAuthFetch([], () => token('customer'))
    await idp.signIn({ email: 'alice@example.com', password: 'pw' })
    assert.deepEqual(meCalls, ['customer-access GET me'])
  })

  it('an unverified e-mail is refused before the password flow', async () => {
    const { idp, customers } = provider()
    customers.push({
      id: 'ct-alice',
      version: 1,
      email: 'alice@example.com',
      isEmailVerified: false,
    })
    const requests = []
    global.fetch = fakeOAuthFetch(requests, () => token('customer'))
    await assert.rejects(
      idp.signIn({ email: 'alice@example.com', password: 'pw' }),
      (e) => {
        assert.equal(e.status, 403)
        return true
      }
    )
    assert.deepEqual(requests, [])
  })

  it('wrong credentials are 401', async () => {
    const { idp } = provider()
    global.fetch = fakeOAuthFetch([], () => ({
      status: 400,
      body: { error: 'invalid_customer_account_credentials' },
    }))
    await assert.rejects(
      idp.signIn({ email: 'nobody@example.com', password: 'pw' }),
      (e) => {
        assert.equal(e.status, 401)
        return true
      }
    )
  })

  it('refresh re-reads the same customer by id, never another with the same e-mail', async () => {
    const { idp, server, customers } = provider()
    customers.push(
      { id: 'ct-alice', version: 2, email: 'alice@example.com' },
      { id: 'ct-alice-2', version: 1, email: 'alice@example.com' }
    )
    assert.deepEqual(
      await idp.refresh({
        subject: 'ct-alice',
        email: 'alice@example.com',
        emailVerified: true,
      }),
      {
        subject: 'ct-alice',
        email: 'alice@example.com',
        emailVerified: true,
        name: 'alice@example.com',
      }
    )
    assert.deepEqual(server.calls, ['GET customers/ct-alice'])
  })
})
