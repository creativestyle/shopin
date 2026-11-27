import { randomBytes } from 'node:crypto'
import {
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'

// this request: commerce "shop", sign-in through "idp" (a test may make sign-in the shop's own: auth "shop")
const mockProviders: { commerce: string; auth?: string } = {
  commerce: 'shop',
  auth: 'idp',
}
// a category whose credentials check failed at boot is not among the providers, it is unavailable (with why)
const mockUnavailable: { auth?: string } = {}
jest.mock('../../data-source/providers', () => ({
  keyOf: (id: string) => id,
  // the platform's own sign-in (the descriptor rule itself is tested in test/category-split)
  isOwnSignIn: () => mockProviders.auth === mockProviders.commerce,
  currentProviders: () => ({
    providers: mockProviders,
    unavailable: mockUnavailable,
  }),
}))
// the session check needs only the serving auth port (no shop config is loaded)
jest.mock('../../data-source/ports.module', () => ({ Ports: class {} }))

import { loadEnvFile } from '../env/env-file'
import { TokenEncryptionService } from '../token-management/token-encryption.service'
import {
  readSession,
  revocations,
  SessionService,
  SESSION_COOKIE,
  SESSION_IDLE_MS,
  SESSION_MAX_AGE_MS,
  SESSION_RECHECK_MS,
  SESSION_REFRESH_GRACE_MS,
} from './session.service'
import { SessionCheckMiddleware } from './session-check.middleware'
import { VaultService } from '../vault/vault.service'

const key = () => randomBytes(32).toString('base64')
Object.assign(process.env, {
  SHOPIN_IGNORE_ENV_FILE: '1',
  JWT_ENCRYPTION_KEY: key(),
  JWT_SIGNING_KEY: key(),
})
loadEnvFile()
const logger = { setContext() {}, error() {}, warn() {}, debug() {} }
const encryption = new TokenEncryptionService(logger as never)

const DAY = 24 * 60 * 60 * 1000
const identity = {
  provider: 'idp',
  subject: 'u-1',
  email: 'ann@example.com',
  emailVerified: true,
}

type Jar = Record<string, string>
/** One request of one browser: the request object, its cookie jar, the cookie options written. */
function request(jar: Jar) {
  const options: Record<string, { maxAge?: number }> = {}
  const req = {
    cookies: { ...jar },
    res: {
      cookie: (name: string, value: string, o: { maxAge?: number }) => {
        jar[name] = value
        options[name] = o
      },
      clearCookie: (name: string) => void delete jar[name],
    },
  }
  const cookies = {
    setCookie: (name: string, value: string, o: { maxAge?: number }) =>
      req.res.cookie(name, value, o),
    getCookie: (name: string) => req.cookies[name as keyof typeof req.cookies],
    clearCookie: (name: string) => req.res.clearCookie(name),
    createCookieOptions: (maxAge: number) => ({ maxAge }),
    getAllCookieNames: () => Object.keys(req.cookies),
  }
  const language = { getCurrentLanguage: () => 'en-US' }
  const session = new SessionService(
    cookies as never,
    encryption,
    language as never,
    req
  )
  return { req, session, options }
}

async function signedIn(): Promise<Jar> {
  const jar: Jar = {}
  await request(jar).session.signIn(identity, 'c-1')
  return jar
}

/** The session check as it runs before every handler, with this auth port. */
async function check(jar: Jar, refresh: () => Promise<unknown>) {
  const r = request(jar)
  const middleware = new SessionCheckMiddleware(
    { auth: { refresh } } as never,
    encryption
  )
  await new Promise<void>((resolve, reject) =>
    middleware.use(r.req as never, r.req.res as never, (e?: unknown) =>
      e ? reject(e) : resolve()
    )
  )
  return { r, identity: await r.session.identity() }
}

beforeEach(() =>
  jest.useFakeTimers({
    now: new Date('2026-11-20T10:00:00Z'),
    doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
  })
)
afterEach(() => jest.useRealTimers())

describe('the identity is re-checked with its provider while the session is in use', () => {
  it('signs the shopper out when the provider no longer confirms the identity', async () => {
    const jar = await signedIn()
    const refresh = jest.fn(async () => {
      throw new UnauthorizedException('user deleted')
    })
    // within the interval: no call, still signed in
    expect((await check(jar, refresh)).identity).toEqual(identity)
    expect(refresh).not.toHaveBeenCalled()
    jest.advanceTimersByTime(SESSION_RECHECK_MS + 1)
    const after = await check(jar, refresh)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(after.identity).toBeUndefined()
    expect(await after.r.session.linkedCustomer()).toBeUndefined()
    expect(SESSION_COOKIE in jar).toBe(false)
  })

  it('keeps the shopper signed in, with the confirmed identity, when the provider confirms it', async () => {
    const jar = await signedIn()
    jest.advanceTimersByTime(SESSION_RECHECK_MS + 1)
    const refresh = jest.fn(async () => ({
      ...identity,
      provider: 'spoofed',
      email: 'ann@new.example',
    }))
    const { identity: now } = await check(jar, refresh)
    // the provider stays the one the BFF stamped, never the port's word
    expect(now).toEqual({ ...identity, email: 'ann@new.example' })
    // re-checked: the next request within the interval does not call the provider again
    await check(jar, refresh)
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})

describe('the identity provider cannot be reached during the re-check', () => {
  const confirm = async () => identity
  const outages: [string, () => Promise<unknown>][] = [
    [
      'a network error',
      async () => {
        throw new TypeError('fetch failed')
      },
    ],
    [
      'a 5xx',
      async () => {
        throw new ServiceUnavailableException()
      },
    ],
    [
      "an SDK's 503",
      async () => {
        throw Object.assign(new Error('upstream'), { statusCode: 503 })
      },
    ],
    [
      "an SDK's 401 (the BFF's own API client: rotated secret)",
      async () => {
        throw Object.assign(new Error('invalid_client'), { statusCode: 401 })
      },
    ],
    [
      "an SDK's 403 (the BFF's own API client: missing scope)",
      async () => {
        throw Object.assign(new Error('insufficient_scope'), {
          statusCode: 403,
        })
      },
    ],
  ]

  it.each(outages)(
    'keeps the shopper signed in on %s and tries again on the next request',
    async (_, fail) => {
      const jar = await signedIn()
      jest.advanceTimersByTime(SESSION_RECHECK_MS + 1)
      const refresh = jest.fn(fail)
      expect((await check(jar, refresh)).identity).toEqual(identity)
      expect((await check(jar, refresh)).identity).toEqual(identity)
      expect(refresh).toHaveBeenCalledTimes(2)
      // back again: confirmed, re-issued, not asked again within the interval
      const ok = jest.fn(confirm)
      expect((await check(jar, ok)).identity).toEqual(identity)
      await check(jar, ok)
      expect(ok).toHaveBeenCalledTimes(1)
    }
  )

  it('keeps the shopper signed in when the provider does not answer in time', async () => {
    const jar = await signedIn()
    jest.advanceTimersByTime(SESSION_RECHECK_MS + 1)
    const hangs = jest.fn(() => new Promise(() => {}))
    const pending = check(jar, hangs)
    // the re-check starts after the cookie is opened (real crypto): then the provider's time runs out
    while (!hangs.mock.calls.length) {
      await new Promise((r) => setImmediate(r))
    }
    await jest.advanceTimersByTimeAsync(10_000)
    expect((await pending).identity).toEqual(identity)
  })

  it('signs out once the outage outlasts the grace since the last confirmation', async () => {
    const jar = await signedIn()
    const down = jest.fn(outages[0]![1])
    jest.advanceTimersByTime(SESSION_REFRESH_GRACE_MS - 1000)
    expect((await check(jar, down)).identity).toEqual(identity)
    jest.advanceTimersByTime(2000)
    expect((await check(jar, down)).identity).toBeUndefined()
    expect(SESSION_COOKIE in jar).toBe(false)
  })

  it('a definite refusal still signs out at once', async () => {
    for (const refusal of [
      new NotFoundException('no such customer'),
      Object.assign(new Error('gone'), { statusCode: 404 }),
    ]) {
      const jar = await signedIn()
      jest.advanceTimersByTime(SESSION_RECHECK_MS + 1)
      const refused = async () => {
        throw refusal
      }
      expect((await check(jar, refused)).identity).toBeUndefined()
    }
  })
})

describe('absolute lifetime', () => {
  it('a session signed in more than 90 days ago is dead, even when used and confirmed every day', async () => {
    expect(SESSION_MAX_AGE_MS).toBe(90 * DAY)
    const jar = await signedIn()
    const refresh = jest.fn(async () => identity)
    for (let day = 1; day <= 90; day++) {
      jest.advanceTimersByTime(DAY)
      expect((await check(jar, refresh)).identity).toEqual(identity)
    }
    jest.advanceTimersByTime(DAY)
    expect((await check(jar, refresh)).identity).toBeUndefined()
  })
})

describe('idle lifetime', () => {
  it('a session unused for longer than the idle lifetime (30 days) is dead, cookie and token', async () => {
    const jar: Jar = {}
    const first = request(jar)
    await first.session.signIn(identity, 'c-1')
    expect(SESSION_IDLE_MS).toBeLessThanOrEqual(30 * DAY)
    expect(first.options[SESSION_COOKIE]!.maxAge).toBe(SESSION_IDLE_MS)
    jest.advanceTimersByTime(SESSION_IDLE_MS + 1000)
    // a cookie kept past its max-age (or replayed) is rejected by the token's own expiry
    expect(await readSession(request(jar).req, encryption)).toEqual({})
  })
})

describe('server-side revocation', () => {
  it('logout revokes the session: a copy of the cookie no longer signs anyone in', async () => {
    const jar = await signedIn()
    const copy = { ...jar }
    const r = request(jar)
    expect(await r.session.identity()).toEqual(identity)
    r.session.signOut()
    expect(await request(copy).session.identity()).toBeUndefined()
  })

  it('a password change revokes every other session of the identity, and keeps this one', async () => {
    const here = await signedIn()
    const elsewhere = await signedIn()
    jest.advanceTimersByTime(1000)
    await request(here).session.revokeOtherSessions()
    expect(await request(elsewhere).session.identity()).toBeUndefined()
    expect(await request(here).session.identity()).toEqual(identity)
  })
})

describe('cart and wishlist id cookies are sealed by the core', () => {
  const GUEST_CART = 'cart-guest.shop-USD'
  const LOGGED_CART = 'cart-logged.shop-USD'
  // an identity of its own: earlier cases revoke the shared one at clock times far ahead, which would make these
  // cases run signed out without noticing
  const own = { ...identity, subject: 'u-cart-cookies' }
  const signedIn = async (): Promise<Jar> => {
    const jar: Jar = {}
    await request(jar).session.signIn(own, 'c-1')
    expect(await request(jar).session.linkedCustomer()).toBe('c-1')
    return jar
  }

  it('the browser holds the id encrypted; the session reads it back', async () => {
    const jar: Jar = {}
    await request(jar).session.setCartId(true, 'cart-1')
    await request(jar).session.setWishlistId(true, 'wl-1')
    expect(jar[GUEST_CART]).not.toContain('cart-1')
    expect(jar[GUEST_CART]!.split('.')).toHaveLength(5)
    expect(await request(jar).session.getCartId(true)).toBe('cart-1')
    expect(await request(jar).session.getWishlistId(true)).toBe('wl-1')
  })

  it('a planted platform id, a tampered value or an expired one reads as no cart, and is dropped', async () => {
    for (const value of [
      'cart-of-someone-else',
      tamper(await sealedGuestCart()),
    ]) {
      const jar: Jar = { [GUEST_CART]: value }
      expect(await request(jar).session.getCartId(true)).toBeUndefined()
      expect(GUEST_CART in jar).toBe(false)
    }
    const jar: Jar = { [GUEST_CART]: await sealedGuestCart() }
    jest.advanceTimersByTime(31 * DAY)
    expect(await request(jar).session.getCartId(true)).toBeUndefined()
  })

  it('a sealed id fits only its own cookie (another currency, guest vs customer, cart vs wishlist)', async () => {
    const sealed = await sealedGuestCart()
    for (const name of [
      'cart-guest.shop-EUR',
      'cart-guest.other-USD',
      'wishlist-guest.shop',
    ]) {
      const jar: Jar = { [name]: sealed }
      const s = request(jar).session
      const read = name.startsWith('wishlist')
        ? await s.getWishlistId(true)
        : await s.getCartId(true)
      // read with this request's provider and currency (shop, USD): only the exact cookie name opens it
      expect(read).toBeUndefined()
    }
    const jar = await signedIn()
    jar[LOGGED_CART] = sealed
    expect(await request(jar).session.getCartId(false)).toBeUndefined()
  })

  it("a signed-in shopper's cart cookie of another customer reads as no cart", async () => {
    const jar = await signedIn()
    await request(jar).session.setCartId(false, 'cart-of-c-1')
    expect(await request(jar).session.getCartId(false)).toBe('cart-of-c-1')
    const other: Jar = {}
    await request(other).session.signIn(
      { ...identity, subject: 'u-cart-cookies-2', email: 'bo@example.com' },
      'c-2'
    )
    expect(await request(other).session.linkedCustomer()).toBe('c-2')
    other[LOGGED_CART] = jar[LOGGED_CART]!
    expect(await request(other).session.getCartId(false)).toBeUndefined()
    expect(LOGGED_CART in other).toBe(false)
  })

  /** Flips one character in the middle of the ciphertext. */
  function tamper(sealed: string): string {
    const parts = sealed.split('.')
    const c = parts[3]!
    const i = Math.floor(c.length / 2)
    parts[3] = c.slice(0, i) + (c[i] === 'A' ? 'B' : 'A') + c.slice(i + 1)
    return parts.join('.')
  }

  async function sealedGuestCart(): Promise<string> {
    const jar: Jar = {}
    await request(jar).session.setCartId(true, 'cart-1')
    return jar[GUEST_CART]!
  }
})

describe("the payment return's order is remembered for this session only", () => {
  const PAID = 'shopin-paid-order.shop'
  const own = { ...identity, subject: 'u-paid-order' }
  const paid = { cartId: 'cart-1', orderId: 'order-1', status: 'paid' as const }

  it("a guest's reload reads it back for that cart only; the browser holds it encrypted", async () => {
    const jar: Jar = {}
    await request(jar).session.setPaidOrder(paid)
    expect(jar[PAID]).not.toContain('order-1')
    expect(await request(jar).session.paidOrder('cart-1')).toEqual(paid)
    expect(await request(jar).session.paidOrder('cart-2')).toBeUndefined()
  })

  it("another session's record (a copied cookie) is never returned, and is dropped", async () => {
    const alice: Jar = {}
    await request(alice).session.signIn(own, 'c-1')
    await request(alice).session.setPaidOrder(paid)
    expect(await request(alice).session.paidOrder('cart-1')).toEqual(paid)

    // another customer's session
    const bob: Jar = {}
    await request(bob).session.signIn(
      { ...own, subject: 'u-paid-order-2', email: 'bo@example.com' },
      'c-2'
    )
    bob[PAID] = alice[PAID]!
    expect(await request(bob).session.paidOrder('cart-1')).toBeUndefined()
    expect(PAID in bob).toBe(false)

    // the same customer in another session (another device, a new sign-in)
    const aliceElsewhere: Jar = {}
    await request(aliceElsewhere).session.signIn(own, 'c-1')
    aliceElsewhere[PAID] = alice[PAID]!
    expect(
      await request(aliceElsewhere).session.paidOrder('cart-1')
    ).toBeUndefined()

    // a guest browser
    const guest: Jar = { [PAID]: alice[PAID]! }
    expect(await request(guest).session.paidOrder('cart-1')).toBeUndefined()
  })

  it('expires with the guest order (GUEST_ORDER_MS)', async () => {
    const jar: Jar = {}
    await request(jar).session.setPaidOrder(paid)
    jest.advanceTimersByTime(61 * 60 * 1000)
    expect(await request(jar).session.paidOrder('cart-1')).toBeUndefined()
  })
})

describe('a failing revocation store never undoes what the shopper asked for', () => {
  afterEach(() => jest.restoreAllMocks())
  // an identity of its own: earlier cases revoke the shared one at clock times far ahead
  const own = { ...identity, subject: 'u-store-failure' }
  const signedIn = async (): Promise<Jar> => {
    const jar: Jar = {}
    await request(jar).session.signIn(own, 'c-1')
    return jar
  }
  const failing = () => {
    jest.spyOn(revocations, 'revoke').mockImplementation(() => {
      throw new Error('EROFS: read-only file system')
    })
    jest.spyOn(revocations, 'revokeIdentity').mockImplementation(() => {
      throw new Error('EROFS: read-only file system')
    })
  }

  it('sign-out still clears the session cookie', async () => {
    const jar = await signedIn()
    failing()
    const { session } = request(jar)
    await session.identity()
    expect(() => session.signOut()).not.toThrow()
    expect(jar['shopin-session']).toBeUndefined()
    expect(await session.identity()).toBeUndefined()
  })

  it('a password change fails closed: other sessions not cut off is an error, never a silent success', async () => {
    const jar = await signedIn()
    const before = jar['shopin-session']
    failing()
    await expect(request(jar).session.revokeOtherSessions()).rejects.toThrow(
      /EROFS/
    )
    // this device stays signed in on its current session
    expect(jar['shopin-session']).toBe(before)
  })

  it('a new sign-in over a signed-in session still signs in', async () => {
    const jar = await signedIn()
    failing()
    await expect(
      request(jar).session.signIn(own, 'c-2')
    ).resolves.toBeUndefined()
    expect(await request(jar).session.linkedCustomer()).toBe('c-2')
  })
})

describe("the commerce platform's own sign-in: the session lives only with the customer's commerce token", () => {
  afterEach(() => {
    mockProviders.auth = 'idp'
  })
  const own = { ...identity, provider: 'shop', subject: 'u-native' }
  const nativeSignedIn = async (withToken: string | undefined) => {
    mockProviders.auth = 'shop'
    const jar: Jar = {}
    const r = request(jar)
    await r.session.signIn(own, 'c-native')
    if (withToken) {
      await VaultService.forRequest(r.req as never, encryption).set(
        'commerce',
        'shop',
        { accessToken: 'a', refreshToken: 'r', expiresIn: 3600 },
        true,
        withToken
      )
    }
    return jar
  }

  it("with the customer's token: still signed in", async () => {
    const jar = await nativeSignedIn('c-native')
    expect((await check(jar, async () => own)).identity).toMatchObject({
      subject: 'u-native',
    })
  })

  it('without it (a dead refresh token cleared it, or the vault no longer trusts it): signed out, not half signed-in', async () => {
    const jar = await nativeSignedIn(undefined)
    expect((await check(jar, async () => own)).identity).toBeUndefined()
    expect(SESSION_COOKIE in jar).toBe(false)
  })

  it('another identity provider keeps the session without a commerce token (the master-key path)', async () => {
    mockProviders.auth = 'idp'
    const other = { ...identity, subject: 'u-external' }
    const jar: Jar = {}
    await request(jar).session.signIn(other, 'c-1')
    expect((await check(jar, async () => other)).identity).toEqual(other)
  })
})

describe('the re-check signs out when the identity no longer holds', () => {
  afterEach(() => {
    mockProviders.auth = 'idp'
  })
  const own = { ...identity, subject: 'u-recheck' }
  const signedInOwn = async () => {
    const jar: Jar = {}
    await request(jar).session.signIn(own, 'c-1')
    jest.advanceTimersByTime(SESSION_RECHECK_MS + 1)
    return jar
  }
  beforeEach(() =>
    jest.useFakeTimers({
      now: Date.now(),
      doNotFake: ['setImmediate', 'nextTick'],
    })
  )
  afterEach(() => jest.useRealTimers())

  it('the provider answers for another subject: signed out', async () => {
    const jar = await signedInOwn()
    const other = jest.fn(async () => ({ ...own, subject: 'someone-else' }))
    expect((await check(jar, other)).identity).toBeUndefined()
    expect(SESSION_COOKIE in jar).toBe(false)
  })

  it("the session's sign-in provider is no longer configured: signed out without asking anyone", async () => {
    const jar = await signedInOwn()
    mockProviders.auth = 'another-idp'
    const refresh = jest.fn(async () => own)
    expect((await check(jar, refresh)).identity).toBeUndefined()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('sign-in unavailable since start (its credentials check failed): an outage, the session is kept within the grace', async () => {
    const jar = await signedInOwn()
    delete mockProviders.auth
    mockUnavailable.auth = 'the credentials check failed'
    try {
      const refresh = jest.fn(async () => own)
      expect((await check(jar, refresh)).identity).toEqual(own)
      expect(SESSION_COOKIE in jar).toBe(true)
      expect(refresh).not.toHaveBeenCalled()
      // the grace still ends it: an outage that outlasts it signs out
      jest.advanceTimersByTime(SESSION_REFRESH_GRACE_MS)
      expect((await check(jar, refresh)).identity).toBeUndefined()
    } finally {
      delete mockUnavailable.auth
    }
  })
})
