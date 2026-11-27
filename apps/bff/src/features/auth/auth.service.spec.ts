import type { CustomerStore } from './customer-link'

// this request: commerce "shop", sign-in through another integration "idp" (a test may switch auth to "shop")
const providers = { commerce: 'shop', auth: 'idp' }
jest.mock('../../data-source/providers', () => ({
  keyOf: (id: string) => id,
  // the platform's own sign-in (the descriptor rule itself is tested in test/category-split)
  isOwnSignIn: () => providers.auth === providers.commerce,
  currentProviders: () => ({ providers, unavailable: {} }),
}))
import { AuthService } from './auth.service'
import { revocations } from '../../common/session/session.service'

describe('AuthService.login: the BFF names the identity provider', () => {
  it('ignores the provider a part reports and stamps the integration serving auth', async () => {
    // a part claims to be the commerce platform's own sign-in, with a victim's customer id as subject
    const spoofed = {
      provider: 'shop',
      subject: 'victim-customer',
      email: 'eve@example.com',
      emailVerified: true,
    }
    const lookups: string[] = []
    const customers: CustomerStore = {
      findByExternalId: async (x) => (lookups.push(x), undefined),
      findByEmail: async () => undefined,
      setExternalId: async () => undefined,
      create: async () => 'eve-customer',
    }
    const ports = {
      commerce: { customers },
      auth: { signIn: async () => ({ identity: spoofed }) },
    }
    const signIns: [{ provider: string }, string][] = []
    const session = {
      signIn: async (i: { provider: string }, c: string) =>
        void signIns.push([i, c]),
    }
    const tokens = { setTokens: jest.fn() }
    const auth = new AuthService(
      ports as never,
      tokens as never,
      {} as never,
      {} as never,
      session as never,
      {} as never
    )

    await auth.login({ email: 'eve@example.com', password: 'x' })

    expect(signIns).toEqual([
      [
        expect.objectContaining({
          provider: 'idp',
          subject: 'victim-customer',
        }),
        'eve-customer',
      ],
    ])
    expect(lookups).toEqual(['idp:victim-customer'])
    expect(tokens.setTokens).not.toHaveBeenCalled()
  })
})

describe('AuthService.resetPassword: a reset revokes the earlier sessions of the identity', () => {
  it('sessions of that identity issued before the reset stop working; the subject never reaches the client', async () => {
    const flows = {
      resetPasswordService: {
        resetPassword: async () => ({ success: true, subject: 'u-42' }),
      },
    }
    const auth = new AuthService(
      { commerce: {}, auth: { accountFlows: flows } } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    )
    const issuedBefore = Date.now() - 1000
    const result = await auth.resetPassword({
      tokenValue: 't',
      newPassword: 'new-secret-1',
    })
    expect(result).toEqual({ success: true })
    expect(
      revocations.isRevoked({ iat: issuedBefore, identityKey: 'idp:u-42' })
    ).toBe(true)
    expect(
      revocations.isRevoked({ iat: Date.now() + 1000, identityKey: 'idp:u-42' })
    ).toBe(false)
  })
})

describe('AuthService.register: the identity provider decides how an account is made', () => {
  const request = {
    salutation: 'Ms',
    firstName: 'Ann',
    lastName: 'Tester',
    email: 'ann@example.com',
    password: 'Secret12345',
    acceptTerms: true,
  } as const
  const make = (auth: object) =>
    new AuthService(
      { commerce: {}, auth } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    )

  it('a provider without account flows registers through the port signUp', async () => {
    const signUp = jest.fn(async () => ({
      identity: { subject: 's', email: request.email, emailVerified: true },
    }))
    const result = await make({ signUp }).register(request)
    expect(result).toEqual({ success: true })
    expect(signUp).toHaveBeenCalledWith(request)
  })

  it("a platform's own register flow wins, so it keeps fields signUp does not carry", async () => {
    const signUp = jest.fn()
    const register = jest.fn(async () => ({ success: true }))
    const result = await make({
      signUp,
      accountFlows: {
        registerService: { register },
        generateEmailTokenService: {
          generateEmailToken: async () => ({ emailToken: 'tok' }),
        },
      },
    }).register(request)
    expect(result).toEqual({ success: true, emailToken: 'tok' })
    expect(register).toHaveBeenCalledWith(request)
    expect(signUp).not.toHaveBeenCalled()
  })
})

describe("AuthService.login: the guest's commerce session goes only to the platform's own sign-in", () => {
  function login(opts: { auth: string; guestEntry: boolean | undefined }) {
    providers.auth = opts.auth
    const signIn = jest.fn(async () => ({
      identity: { subject: 's', email: 'a@example.com', emailVerified: true },
    }))
    const customers: CustomerStore = {
      findByExternalId: async () => ({ id: 'c-1', hasPassword: true }),
      findByEmail: async () => undefined,
      setExternalId: async () => undefined,
      create: async () => 'c-1',
    }
    const tokens = {
      setTokens: jest.fn(),
      // undefined: no vault entry; false: a guest entry; true: a customer entry
      getAuthStatus: async () => opts.guestEntry,
      getAccessToken: async () =>
        opts.guestEntry === undefined ? undefined : 'guest-anon-token',
    }
    const auth = new AuthService(
      { commerce: { customers }, auth: { signIn } } as never,
      tokens as never,
      {} as never,
      {} as never,
      { signIn: async () => undefined } as never,
      {} as never
    )
    return {
      signIn,
      run: () => auth.login({ email: 'a@example.com', password: 'x' }),
    }
  }
  afterEach(() => {
    providers.auth = 'idp'
  })

  it('the commerce platform signs in itself: it gets the guest token, to take the guest cart over', async () => {
    const { signIn, run } = login({ auth: 'shop', guestEntry: false })
    await run()
    expect(signIn).toHaveBeenCalledWith(expect.anything(), {
      commerceAccessToken: 'guest-anon-token',
    })
  })

  it('another identity provider never sees the commerce token', async () => {
    const { signIn, run } = login({ auth: 'idp', guestEntry: false })
    await run()
    expect(signIn).toHaveBeenCalledWith(expect.anything(), undefined)
  })

  it("no guest session, or already a customer's entry: nothing is passed", async () => {
    for (const guestEntry of [undefined, true]) {
      const { signIn, run } = login({ auth: 'shop', guestEntry })
      await run()
      expect(signIn).toHaveBeenCalledWith(expect.anything(), undefined)
    }
  })
})

describe('AuthService.renewGuestSession: an expired guest token is renewed before a sign-in', () => {
  function make(entry: object | undefined) {
    const refresh = jest.fn(async () => ({
      accessToken: 'new',
      expiresIn: 3600,
    }))
    const vault = {
      entry: jest.fn(async () => entry),
      refreshOnce: jest.fn(
        async (_c: string, _p: string, fn: (rt: string) => Promise<unknown>) =>
          fn('rt')
      ),
    }
    const auth = new AuthService(
      { commerce: { guestSession: { refresh } } } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      vault as never
    )
    return { auth, vault, refresh }
  }
  it('expired guest entry: renewed through the vault', async () => {
    const { auth, refresh } = make({ customer: false, expired: true })
    await auth.renewGuestSession()
    expect(refresh).toHaveBeenCalledWith('rt')
  })
  it('a fresh entry, a customer entry or none: nothing to do', async () => {
    for (const entry of [
      { customer: false, expired: false },
      { customer: true, expired: true },
      undefined,
    ]) {
      const { auth, refresh } = make(entry)
      await auth.renewGuestSession()
      expect(refresh).not.toHaveBeenCalled()
    }
  })
  it('a token that cannot be renewed stays as it is (no error)', async () => {
    const { auth, refresh } = make({ customer: false, expired: true })
    refresh.mockRejectedValue(new Error('invalid_grant'))
    await expect(auth.renewGuestSession()).resolves.toBeUndefined()
  })
})
