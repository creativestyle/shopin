import { Injectable, Scope } from '@nestjs/common'
import type { Request } from 'express'
import { z } from 'zod'
import { REFRESH_TOKEN_MAX_AGE, VAULT_COOKIE_PREFIX } from '@config/constants'
import type {
  Category,
  SessionTokens,
  TokenVault,
  VaultEntry,
} from '@core/integration-kit'
import { CookieService } from '../storage/cookie.service'
import { TokenEncryptionService } from '../token-management/token-encryption.service'
import { linkedCustomerOf } from '../session/session.service'

const EntrySchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessExpiresAt: z.number(),
  customer: z.boolean(),
  /** For a customer entry: the customer the token belongs to (it lives only while the session links that one). */
  customerId: z.string().optional(),
})
type Stored = z.infer<typeof EntrySchema>

const perRequest = new WeakMap<object, VaultService>()

/** In-flight refreshes, one per vault entry (keyed by the refresh token, which is unique per session). */
const refreshing = new Map<string, Promise<SessionTokens>>()

/**
 * The core token vault (injected into ports as TokenVault). One encrypted HttpOnly cookie per part and shopper:
 * name `vault.<category>.<provider>`, JWS audience the same string, so an entry copied to another part's
 * name fails verification. A part receives only its own entry.
 */
/** Not injected by class: VaultModule builds one per request through `forRequest`. */
@Injectable({ scope: Scope.REQUEST })
export class VaultService {
  constructor(
    private readonly cookies: CookieService,
    private readonly encryption: TokenEncryptionService,
    /** The customer the SHOPin session links at a commerce provider (forRequest passes the session's). */
    private readonly linkedCustomer?: (
      provider: string
    ) => Promise<string | undefined>
  ) {}

  static keyOf(category: Category, provider: string): string {
    return `${category}.${provider}`
  }

  private readonly cache = new Map<string, Stored | null>()

  private async read(key: string): Promise<Stored | undefined> {
    if (this.cache.has(key)) {
      return this.cache.get(key) ?? undefined
    }
    const name = `${VAULT_COOKIE_PREFIX}${key}`
    const raw = this.cookies.getCookie(name)
    let entry: Stored | undefined
    if (raw) {
      try {
        const parsed = EntrySchema.safeParse(
          JSON.parse(await this.encryption.decryptAndVerify(raw, key))
        )
        entry = parsed.success ? parsed.data : undefined
      } catch {
        entry = undefined
      }
      if (!entry) {
        this.cookies.clearCookie(name)
      }
    }
    this.cache.set(key, entry ?? null)
    return entry
  }

  private async write(key: string, entry: Stored): Promise<void> {
    this.cache.set(key, entry)
    const value = await this.encryption.encryptAndSign(
      JSON.stringify(entry),
      REFRESH_TOKEN_MAX_AGE,
      key
    )
    this.cookies.setCookie(
      `${VAULT_COOKIE_PREFIX}${key}`,
      value,
      this.cookies.createCookieOptions(REFRESH_TOKEN_MAX_AGE)
    )
  }

  /** The raw entry, including an expired access token (for refresh). */
  async entry(
    category: Category,
    provider: string
  ): Promise<
    (VaultEntry & { expired: boolean; customerId?: string }) | undefined
  > {
    const e = await this.read(VaultService.keyOf(category, provider))
    if (!e) {
      return undefined
    }
    // a customer's commerce token lives only as long as the SHOPin session that links that customer: after
    // expiry, revocation (password reset, logout elsewhere) or a refused re-check it is dropped, never used
    if (
      e.customer &&
      category === 'commerce' &&
      this.linkedCustomer &&
      (!e.customerId || e.customerId !== (await this.linkedCustomer(provider)))
    ) {
      this.clear(category, provider)
      return undefined
    }
    return {
      accessToken: e.accessToken,
      refreshToken: e.refreshToken,
      expiresIn: Math.max(
        0,
        Math.round((e.accessExpiresAt - Date.now()) / 1000)
      ),
      customer: e.customer,
      ...(e.customerId ? { customerId: e.customerId } : {}),
      expired: e.accessExpiresAt <= Date.now(),
    }
  }

  async set(
    category: Category,
    provider: string,
    tokens: SessionTokens,
    customer: boolean,
    /** The customer a customer entry belongs to (the session's link at this provider when it was signed in). */
    customerId?: string
  ): Promise<void> {
    await this.write(VaultService.keyOf(category, provider), {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessExpiresAt: Date.now() + tokens.expiresIn * 1000,
      customer,
      ...(customer && customerId ? { customerId } : {}),
    })
  }

  has(category: Category, provider: string): boolean {
    return this.cookies.hasCookie(
      `${VAULT_COOKIE_PREFIX}${VaultService.keyOf(category, provider)}`
    )
  }

  clear(category: Category, provider: string): void {
    const key = VaultService.keyOf(category, provider)
    this.cache.set(key, null)
    this.cookies.clearCookie(`${VAULT_COOKIE_PREFIX}${key}`)
  }

  /** Every vault entry of this shopper (sign-out clears them locally first). */
  clearAll(): void {
    for (const name of this.cookies.getAllCookieNames()) {
      if (name.startsWith(VAULT_COOKIE_PREFIX)) {
        this.cache.set(name.slice(VAULT_COOKIE_PREFIX.length), null)
        this.cookies.clearCookie(name)
      }
    }
  }

  /**
   * Refreshes one entry at most once at a time: parallel requests of the same session share the
   * in-flight refresh instead of each spending the refresh token.
   */
  async refreshOnce(
    category: Category,
    provider: string,
    refresh: (refreshToken: string) => Promise<SessionTokens>
  ): Promise<SessionTokens | undefined> {
    const e = await this.entry(category, provider)
    if (!e) {
      return undefined
    }
    const flightKey = `${VaultService.keyOf(category, provider)}|${e.refreshToken}`
    let flight = refreshing.get(flightKey)
    if (!flight) {
      flight = refresh(e.refreshToken).finally(() =>
        refreshing.delete(flightKey)
      )
      refreshing.set(flightKey, flight)
    }
    // a provider that does not rotate the refresh token returns none: the stored one stays valid
    const result = await flight
    const tokens = {
      ...result,
      refreshToken: result.refreshToken || e.refreshToken,
    }
    await this.set(category, provider, tokens, e.customer, e.customerId)
    return tokens
  }

  /** One instance per request, shared by the core (DI) and the parts' accessors, so both see the same entries. */
  static forRequest(
    req: Request,
    encryption: TokenEncryptionService
  ): VaultService {
    let v = perRequest.get(req)
    if (!v) {
      perRequest.set(
        req,
        (v = new VaultService(new CookieService(req), encryption, (provider) =>
          linkedCustomerOf(req, encryption, provider)
        ))
      )
    }
    return v
  }

  /** A part's view: its own entry only (injected into ports as TokenVault). */
  forPart(category: Category, provider: string): TokenVault {
    return {
      // an expired entry too (expiresIn 0): whose tokens they are does not expire with the access token, and
      // the request then answers 401, which the refresh interceptor renews as before
      get: async () => {
        const e = await this.entry(category, provider)
        if (!e) {
          return undefined
        }
        const { accessToken, refreshToken, expiresIn, customer } = e
        return { accessToken, refreshToken, expiresIn, customer }
      },
      // a port's customer token belongs to the customer this session links at that provider
      set: async (tokens, customer) =>
        this.set(
          category,
          provider,
          tokens,
          customer,
          customer ? await this.linkedCustomer?.(provider) : undefined
        ),
      clear: () => this.clear(category, provider),
    }
  }
}
