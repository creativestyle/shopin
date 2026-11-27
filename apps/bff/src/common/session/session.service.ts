import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Logger, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { z } from 'zod'
import {
  CART_ID_COOKIE_CONFIG,
  CART_ID_COOKIE_PREFIX_GUEST,
  CART_ID_COOKIE_PREFIX_LOGGED,
  CSRF_TOKEN_COOKIE_NAME,
  CSRF_TOKEN_MAX_AGE_MS,
  WISHLIST_ID_COOKIE_CONFIG,
} from '@config/constants'
import { LANGUAGE_TOKEN } from '@core/i18n'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import type { SignedIn } from '@core/integration-kit'

/** Who signed in, with the provider the BFF stamped (the integration that served auth): never a port's word. */
export type Identity = SignedIn & { provider: string }

import { SESSION_COOKIE_NAME } from '@config/constants'
import { CookieService } from '../storage/cookie.service'
import { TokenEncryptionService } from '../token-management/token-encryption.service'
import type { LanguageProvider } from '../language/language.provider'
import { currentProviders, keyOf } from '../../data-source/providers'
import { getCartKey, getWishlistKey, scopedName } from './keys'
import { RevocationList, revocationFile } from './revocations'

/** The SHOPin session: who signed in and the customer id linked at each commerce provider. */
export interface SessionState {
  identity?: Identity
  links: Record<string, string>
  /** Session id (server-side revocation on logout). */
  sid?: string
  /** Issued at (ms): a password change revokes every session of the identity issued before it. */
  iat?: number
  /** Last time the identity provider confirmed the identity (ms); re-checked after SESSION_RECHECK_MS. */
  checkedAt?: number
}

const MINUTE = 60 * 1000
/** Idle lifetime: a session not used (re-checked) for this long expires (cookie and token). */
export const SESSION_IDLE_MS = 30 * 24 * 60 * MINUTE
/** How often the identity provider re-confirms a signed-in identity while it is in use. */
export const SESSION_RECHECK_MS = 5 * MINUTE
/** Absolute lifetime: a session signed in longer ago than this is dead, however often it is used. */
export const SESSION_MAX_AGE_MS = 90 * 24 * 60 * MINUTE
/**
 * While the identity provider cannot be reached (network error, 5xx, timeout), a session stays signed in for this
 * long after the provider last confirmed it; each request tries again. A refusal signs out at once.
 */
export const SESSION_REFRESH_GRACE_MS = 60 * MINUTE

/** Revoked sessions and identities, server-side (this process). */
export const revocations = new RevocationList(
  SESSION_IDLE_MS,
  revocationFile,
  (error) =>
    new Logger('SessionService').error(
      'session revocations: the store could not be read; checking against the last loaded list',
      error as Error
    )
)

const log = new Logger('SessionService')

/**
 * A revocation that fails (store unwritable, lock timeout) never undoes what the shopper asked for: the local
 * sign-out, sign-in or password change still completes; the failure is logged for the operator.
 */
function revokeOrLog(what: string, revoke: () => void): void {
  try {
    revoke()
  } catch (error) {
    log.error(
      `${what} could not be recorded in the revocation store`,
      error as Error
    )
  }
}

/** The revocation key of an identity: `<provider>:<subject>`. */
export const identityKey = (i: Pick<Identity, 'provider' | 'subject'>) =>
  `${i.provider}:${i.subject}`

/** The SHOPin session cookie: identity and the customer id linked at each commerce provider. */
export const SESSION_COOKIE = SESSION_COOKIE_NAME
const SESSION_AUDIENCE = 'shopin-session'

/** How long a guest may read the order it placed (its confirmation page, a reload of it). */
export const GUEST_ORDER_MS = 60 * 60 * 1000
const guestOrderCookie = (commerce: string) =>
  scopedName('shopin-guest-order', commerce)

/** The order a payment return created, remembered for the cart it was paid for. */
export interface PaidOrder {
  cartId: string
  orderId: string
  status: 'paid' | 'authorized'
}
const paidOrderCookie = (commerce: string) =>
  scopedName('shopin-paid-order', commerce)
const SealedPaidOrderSchema = z.object({
  cartId: z.string().min(1),
  orderId: z.string().min(1),
  status: z.enum(['paid', 'authorized']),
  customer: z.string().optional(),
  sid: z.string().optional(),
})
type SealedPaidOrder = z.infer<typeof SealedPaidOrderSchema>

/** A cart or wishlist id cookie's sealed content: the id and, for a signed-in shopper, the customer it belongs to. */
interface SealedId {
  id: string
  customer?: string
}
const SealedIdSchema = z.object({
  id: z.string().min(1),
  customer: z.string().optional(),
})
/** The audience a cart or wishlist id is sealed for: its cookie's name (a sealed id fits no other cookie). */
const idAudience = (cookieName: string) => `shopin-id:${cookieName}`

/**
 * The session value this request has written (sign-in, sign-out, a new link). Set-Cookie reaches the
 * browser only with the response, so later reads in the same request (the parts' CustomerContext, the
 * post-login cart setup) must see this value, not the cookie the request arrived with.
 */
const writtenThisRequest = new WeakMap<object, SessionState>()

const SessionSchema = z.object({
  identity: z
    .object({
      provider: z.string(),
      subject: z.string(),
      email: z.string(),
      emailVerified: z.boolean(),
      name: z.string().optional(),
    })
    .optional(),
  links: z.record(z.string(), z.string()),
  sid: z.string().optional(),
  iat: z.number().optional(),
  checkedAt: z.number().optional(),
})

/**
 * The core session. The only place besides the vault that reads or writes cookies:
 * identity and links, cart and wishlist ids per commerce provider, the CSRF cookie. Features ask this
 * service; they never see a cookie name.
 */
@Injectable({ scope: Scope.REQUEST })
export class SessionService {
  constructor(
    private readonly cookies: CookieService,
    private readonly encryption: TokenEncryptionService,
    @Inject(LANGUAGE_TOKEN) private readonly language: LanguageProvider,
    @Inject(REQUEST) private readonly request: object
  ) {}

  /** This request's commerce provider: it owns the cart, wishlist and customer link this request uses. */
  private get commerce(): string {
    return keyOf(currentProviders().providers.commerce!)
  }

  // ─── identity and links ────────────────────────────────────────────────────────────────────

  private cached?: SessionState

  async state(): Promise<SessionState> {
    if (this.cached) {
      return this.cached
    }
    const read = await readSession(this.request, this.encryption)
    // an unreadable cookie (tampered, old key) is dropped
    if (!read.links) {
      this.cookies.clearCookie(SESSION_COOKIE)
    }
    return (this.cached = { links: {}, ...read })
  }

  private async write(state: SessionState): Promise<void> {
    this.cached = state
    writtenThisRequest.set(this.request, state)
    this.cookies.setCookie(
      SESSION_COOKIE,
      await sealSession(state, this.encryption),
      this.cookies.createCookieOptions(SESSION_IDLE_MS)
    )
  }

  /**
   * Signs in: a new session (new id, issued and checked now) with the identity and its link at this
   * request's commerce provider. The prior session id is revoked.
   */
  async signIn(identity: Identity, customerId: string): Promise<void> {
    const prior = await this.state()
    const sameIdentity =
      prior.identity?.provider === identity.provider &&
      prior.identity.subject === identity.subject
    if (prior.sid) {
      revokeOrLog('the prior session', () => revocations.revoke(prior.sid!))
    }
    const now = Date.now()
    await this.write({
      identity,
      links: {
        ...(sameIdentity ? prior.links : {}),
        [this.commerce]: customerId,
      },
      sid: randomUUID(),
      iat: now,
      checkedAt: now,
    })
  }

  /**
   * After a password change: every other session of this identity is revoked server-side; this one is
   * re-issued (new id, issued after the cut-off), so the shopper stays signed in here only.
   */
  async revokeOtherSessions(): Promise<void> {
    const state = await this.state()
    if (!state.identity) {
      return
    }
    const cutOff = Date.now()
    // fails closed: the shopper changes the password to cut other sessions off, so a revocation that could not be
    // recorded is an error they see (as a password reset's), never a silent success. The cut-off covers this
    // session's old id too; it is re-issued below.
    revocations.revokeIdentity(identityKey(state.identity), cutOff)
    await this.write({
      ...state,
      sid: randomUUID(),
      iat: cutOff + 1,
      checkedAt: cutOff + 1,
    })
  }

  /** A link at another commerce provider (read-only order history during a platform migration). */
  async addLink(provider: string, customerId: string): Promise<void> {
    const prior = await this.state()
    await this.write({
      ...prior,
      links: { ...prior.links, [provider]: customerId },
    })
  }

  /** The customer this request acts for at its commerce provider; undefined for a guest. */
  async linkedCustomer(): Promise<string | undefined> {
    return (await this.state()).links[this.commerce]
  }

  async identity(): Promise<Identity | undefined> {
    return (await this.state()).identity
  }

  /** Signs out here, and revokes this session server-side (a copied cookie stops working too). */
  signOut(): void {
    const sid = (this.cached ?? writtenThisRequest.get(this.request))?.sid
    // signed out here first: a failing revocation store must not keep the shopper signed in on this device
    this.cached = { links: {} }
    writtenThisRequest.set(this.request, this.cached)
    this.cookies.clearCookie(SESSION_COOKIE)
    if (sid) {
      revokeOrLog('the signed-out session', () => revocations.revoke(sid))
    }
  }

  // ─── the guest's last order (order confirmation) ──────────────────────────────────────────

  /**
   * Remembers the order a guest just placed, for its confirmation page: the only order a guest may read. Encrypted,
   * bound to this commerce provider, short-lived (GUEST_ORDER_MS).
   */
  async setGuestOrder(orderId: string): Promise<void> {
    const name = guestOrderCookie(this.commerce)
    this.cookies.setCookie(
      name,
      await this.encryption.encryptAndSign(
        JSON.stringify({ id: orderId }),
        GUEST_ORDER_MS,
        idAudience(name)
      ),
      this.cookies.createCookieOptions(GUEST_ORDER_MS)
    )
  }

  /** The order this browser placed as a guest within GUEST_ORDER_MS; undefined otherwise. */
  guestOrder(): Promise<string | undefined> {
    return this.openId(guestOrderCookie(this.commerce), true)
  }

  // ─── the order a payment return created (a reload or Retry of the return page) ──────────────

  /**
   * Remembers the order the payment return created for `cartId`, for this browser's session only: encrypted, bound to
   * this commerce provider, the signed-in customer and the session id (none for a guest), short-lived
   * (GUEST_ORDER_MS). A reload, the back button or a Retry of the return page answers with this order, since the
   * cart is gone by then.
   */
  async setPaidOrder(paid: PaidOrder): Promise<void> {
    const name = paidOrderCookie(this.commerce)
    const sealed: SealedPaidOrder = { ...paid, ...(await this.owner()) }
    this.cookies.setCookie(
      name,
      await this.encryption.encryptAndSign(
        JSON.stringify(sealed),
        GUEST_ORDER_MS,
        idAudience(name)
      ),
      this.cookies.createCookieOptions(GUEST_ORDER_MS)
    )
  }

  /**
   * The order this session's payment return created for `cartId`; undefined for another cart, and for a record of
   * another session or customer (a copied cookie), which is dropped.
   */
  async paidOrder(cartId: string): Promise<PaidOrder | undefined> {
    const name = paidOrderCookie(this.commerce)
    const raw = this.cookies.getCookie(name)
    if (!raw) {
      return undefined
    }
    let sealed: SealedPaidOrder | undefined
    try {
      const parsed = SealedPaidOrderSchema.safeParse(
        JSON.parse(
          await this.encryption.decryptAndVerify(raw, idAudience(name))
        )
      )
      sealed = parsed.success ? parsed.data : undefined
    } catch {
      sealed = undefined
    }
    const owner = await this.owner()
    if (
      !sealed ||
      sealed.customer !== owner.customer ||
      sealed.sid !== owner.sid
    ) {
      this.cookies.clearCookie(name)
      return undefined
    }
    if (sealed.cartId !== cartId) {
      return undefined
    }
    return {
      cartId: sealed.cartId,
      orderId: sealed.orderId,
      status: sealed.status,
    }
  }

  /** Who a paid-order record belongs to: this session's id and linked customer (both absent for a guest). */
  private async owner(): Promise<{ customer?: string; sid?: string }> {
    const state = await this.state()
    const customer = state.links[this.commerce]
    return {
      ...(customer ? { customer } : {}),
      ...(state.sid ? { sid: state.sid } : {}),
    }
  }

  // ─── cart ids, per commerce provider and currency ─────────────────────────────────────────

  private currency(): string {
    return resolveCurrencyFromLanguage(this.language.getCurrentLanguage())
  }

  cartKey(isGuest: boolean): string {
    return getCartKey(this.currency(), isGuest, this.commerce)
  }

  getCartId(isGuest: boolean): Promise<string | undefined> {
    return this.openId(this.cartKey(isGuest), isGuest)
  }

  async setCartId(isGuest: boolean, cartId: string): Promise<void> {
    if (!cartId || cartId.trim() === '') {
      throw new Error('Cart ID cannot be empty')
    }
    await this.sealId(
      this.cartKey(isGuest),
      cartId,
      isGuest,
      CART_ID_COOKIE_CONFIG
    )
  }

  deleteCartId(isGuest: boolean): void {
    this.cookies.clearCookie(this.cartKey(isGuest))
  }

  /** Every cart id of this commerce provider (all currencies); other providers' carts stay. */
  deleteAllCartIds(): void {
    const guest = scopedName(CART_ID_COOKIE_PREFIX_GUEST, this.commerce) + '-'
    const logged = scopedName(CART_ID_COOKIE_PREFIX_LOGGED, this.commerce) + '-'
    for (const key of this.cookies.getAllCookieNames()) {
      if (key.startsWith(guest) || key.startsWith(logged)) {
        this.cookies.clearCookie(key)
      }
    }
  }

  // ─── wishlist ids, per commerce provider ──────────────────────────────────────────────────

  getWishlistId(isGuest: boolean): Promise<string | undefined> {
    return this.openId(getWishlistKey(isGuest, this.commerce), isGuest)
  }

  async setWishlistId(isGuest: boolean, wishlistId: string): Promise<void> {
    if (!wishlistId || wishlistId.trim() === '') {
      throw new Error('Wishlist ID cannot be empty')
    }
    await this.sealId(
      getWishlistKey(isGuest, this.commerce),
      wishlistId,
      isGuest,
      WISHLIST_ID_COOKIE_CONFIG
    )
  }

  deleteWishlistId(isGuest: boolean): void {
    this.cookies.clearCookie(getWishlistKey(isGuest, this.commerce))
  }

  deleteAllWishlistIds(): void {
    const own = new Set([
      getWishlistKey(true, this.commerce),
      getWishlistKey(false, this.commerce),
    ])
    for (const key of this.cookies.getAllCookieNames()) {
      if (own.has(key)) {
        this.cookies.clearCookie(key)
      }
    }
  }

  // ─── sealed ids: a connector never signs a cart or wishlist id ────────────────────────────

  /**
   * Writes a cart or wishlist id encrypted and signed (the session's keys), bound to the cookie's name (provider,
   * currency, guest or customer) and, for a signed-in shopper, to the linked customer. Anyone who learns a
   * platform id still cannot plant it in a browser.
   */
  private async sealId(
    name: string,
    id: string,
    isGuest: boolean,
    config: {
      MAX_AGE: number
      HTTP_ONLY: boolean
      SAME_SITE: 'strict' | 'lax' | 'none'
    }
  ): Promise<void> {
    const maxAge = config.MAX_AGE * 1000
    const sealed: SealedId = {
      id,
      ...(isGuest ? {} : { customer: await this.linkedCustomer() }),
    }
    this.cookies.setCookie(
      name,
      await this.encryption.encryptAndSign(
        JSON.stringify(sealed),
        maxAge,
        idAudience(name)
      ),
      this.cookies.createCookieOptions(maxAge, {
        httpOnly: config.HTTP_ONLY,
        sameSite: config.SAME_SITE,
      })
    )
  }

  /**
   * The id in cookie `name`; undefined (and the cookie dropped) when it is missing, tampered with, expired, sealed
   * for another cookie, or a signed-in shopper's cookie of another customer.
   */
  private async openId(
    name: string,
    isGuest: boolean
  ): Promise<string | undefined> {
    const raw = this.cookies.getCookie(name)
    if (!raw) {
      return undefined
    }
    let sealed: SealedId | undefined
    try {
      const parsed = SealedIdSchema.safeParse(
        JSON.parse(
          await this.encryption.decryptAndVerify(raw, idAudience(name))
        )
      )
      sealed = parsed.success ? parsed.data : undefined
    } catch {
      sealed = undefined
    }
    const owner = isGuest ? undefined : await this.linkedCustomer()
    if (!sealed || sealed.customer !== owner) {
      this.cookies.clearCookie(name)
      return undefined
    }
    return sealed.id
  }

  // ─── CSRF ─────────────────────────────────────────────────────────────────────────────────

  getCsrfToken(): string | undefined {
    return this.cookies.getCookie(CSRF_TOKEN_COOKIE_NAME)
  }

  setCsrfToken(token: string): void {
    this.cookies.setCookie(
      CSRF_TOKEN_COOKIE_NAME,
      token,
      this.cookies.createCookieOptions(CSRF_TOKEN_MAX_AGE_MS)
    )
  }

  clearCsrfToken(): void {
    this.cookies.clearCookie(CSRF_TOKEN_COOKIE_NAME)
  }
}

/** The session as the encrypted cookie value; the token expires with the idle lifetime. */
export function sealSession(
  state: SessionState,
  encryption: TokenEncryptionService
): Promise<string> {
  return encryption.encryptAndSign(
    JSON.stringify(state),
    SESSION_IDLE_MS,
    SESSION_AUDIENCE
  )
}

/** Marks the session this request uses (the session check middleware: re-checked or signed out). */
export function setRequestSession(req: object, state: SessionState): void {
  writtenThisRequest.set(req, state)
}

/**
 * The session of `req`: the value written in this request, else the cookie it arrived with. An unreadable,
 * expired or revoked cookie reads as `{}` (no links). Used by SessionService, the session check and the
 * ports' CustomerContext accessor.
 */
export async function readSession(
  req: object & { cookies?: Record<string, string> },
  encryption: TokenEncryptionService
): Promise<Partial<SessionState>> {
  const written = writtenThisRequest.get(req)
  if (written) {
    return written
  }
  const raw = req.cookies?.[SESSION_COOKIE]
  if (!raw) {
    return { links: {} }
  }
  try {
    const parsed = SessionSchema.safeParse(
      JSON.parse(await encryption.decryptAndVerify(raw, SESSION_AUDIENCE))
    )
    if (!parsed.success) {
      return {}
    }
    const state = parsed.data as SessionState
    // the absolute lifetime: a signed-in session without its sign-in time, or past the cap, is dead
    if (state.identity && Date.now() - (state.iat ?? 0) > SESSION_MAX_AGE_MS) {
      return {}
    }
    const revoked = revocations.isRevoked({
      sid: state.sid,
      iat: state.iat,
      ...(state.identity ? { identityKey: identityKey(state.identity) } : {}),
    })
    return revoked ? {} : state
  } catch {
    return {}
  }
}

/** The customer linked at `commerce` in the session of `req` (for the singleton CustomerContext accessor). */
export async function linkedCustomerOf(
  req: { cookies?: Record<string, string> },
  encryption: TokenEncryptionService,
  commerce: string
): Promise<string | undefined> {
  return (await readSession(req, encryption)).links?.[commerce]
}
