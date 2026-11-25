import type {
  AllAuthServices,
  AllServices,
} from '@core/contracts/core/data-source-interfaces'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { Category, ShopinCategory } from './categories'

// ─── Ports: the interface an integration implements for one category ──────────────────────────

type CommerceServiceKey =
  | 'productService'
  | 'productCollectionService'
  | 'productSearchService'
  | 'navigationService'
  | 'cartService'
  | 'cartPaymentService'
  | 'storeConfigService'
  | 'wishlistService'
  | 'customerService'
  | 'customerAddressService'
  | 'orderService'

/** Tokens a commerce provider uses for one shopper (guest or customer). Kept server-side (encrypted cookie). */
export interface SessionTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/** A commerce customer as the BFF's account linking sees it. */
export interface CustomerRecord {
  id: string
  externalId?: string
  /** The customer can sign in with a password at the commerce platform. */
  hasPassword: boolean
}

/** Who signed in, as an auth port returns it. The BFF adds which provider it came from. */
export interface SignedIn {
  /** The shopper's id at the identity provider. */
  subject: string
  email: string
  emailVerified: boolean
  name?: string
}

export interface Credentials {
  email: string
  password: string
}

export interface PortTypes {
  /**
   * Catalog, cart, checkout, account. Optional members:
   * - `wishlistService`: a platform without wishlists leaves it out and its descriptor says so
   *   (`omits: ['wishlist']`); the BFF answers 501 and the storefront hides the wishlist.
   * - `customers`: lookups and writes the BFF needs to sign shoppers in through another integration's auth
   *   port (perform exactly the call asked for; the BFF decides when to link).
   * - `guestSession`: for a platform that needs its own anonymous session for guests.
   * - `attachGuestCart`: for a platform that cannot list a customer's carts.
   * - `setCartFields`: for a shop whose cart contract has its own fields that the shopper sets.
   */
  commerce: Pick<
    AllServices,
    Exclude<CommerceServiceKey, 'wishlistService' | 'orderService'>
  > & {
    wishlistService?: AllServices['wishlistService']
    /**
     * Orders. `getOrder(id)` returns only an order of the shopper this request acts for: of the customer
     * `CustomerContext` names, or, for a guest, one the platform's own guest session placed. Any other order is
     * refused (401, 403 or 404), never returned; the commerce contract suite checks it. The BFF adds its own guard
     * for guests: a guest reads only the order it placed in this browser (a short-lived encrypted cookie).
     */
    orderService: AllServices['orderService']
    /**
     * Sign-in with a guest cart, on a platform whose `cartService.getActiveCart` cannot find a customer's cart:
     * makes the guest cart `cartId` the cart of the customer this request now acts for (`CustomerContext`) and
     * returns it. Refuses (403 or 404) a cart that belongs to another customer. Without this member the BFF keeps
     * the guest cart id for the customer and tells the platform nothing.
     */
    attachGuestCart?(cartId: string): Promise<CartResponse>
    /**
     * Sets the shop's own fields (`contracts.cart`) on the shopper's cart `cartId` and returns the cart (through
     * the cart mapper hook, which reads them back). `null` removes a field. Refuses (403 or 404) a cart of another
     * shopper. The BFF validates the fields against the shop's cart contract first; without this member it answers
     * 501 to `PUT /bff/cart/fields`.
     */
    setCartFields?(
      cartId: string,
      fields: Record<string, unknown>
    ): Promise<CartResponse>
    customers?: {
      findByExternalId(externalId: string): Promise<CustomerRecord | undefined>
      findByEmail(email: string): Promise<CustomerRecord | undefined>
      setExternalId(customerId: string, externalId: string): Promise<void>
      create(identity: SignedIn, externalId: string): Promise<string>
    }
    guestSession?: {
      createGuestSession(): Promise<SessionTokens>
      refresh(refreshToken: string): Promise<SessionTokens>
    }
  }
  search: Pick<AllServices, 'searchService'>
  cms: Pick<AllServices, 'pageService' | 'layoutService'>
  /** Payment service provider. */
  psp: Pick<AllServices, 'paymentService'>
  /** Sign-in only: returns who signed in, never a customer. */
  auth: {
    signIn(credentials: Credentials): Promise<{
      identity: SignedIn
      /** Only the commerce platform's own sign-in returns these: that customer's commerce session. */
      commerceSession?: SessionTokens
    }>
    signUp(
      request: Credentials & { firstName?: string; lastName?: string }
    ): Promise<{ identity: SignedIn }>
    signOut(
      identity: SignedIn,
      commerceSession?: Partial<SessionTokens>
    ): Promise<void>
    /**
     * Re-checks the identity (still exists, still verified). When it no longer holds, throws an error with a 4xx
     * status (`UnauthorizedException`, `NotFoundException`, an SDK error with `statusCode: 404`): the shopper is
     * signed out. Any other error (network, 5xx, timeout) counts as the provider being unreachable: the shopper
     * stays signed in for up to an hour since the last confirmation, and the next request tries again.
     */
    refresh(identity: SignedIn): Promise<SignedIn>
    /** Password reset, e-mail verification, password change: only a platform that runs them itself. */
    accountFlows?: Partial<AllAuthServices>
  }
}

/**
 * The interface an integration implements for category C. For a shop's own kind it is the type its package
 * adds to `ServingPorts` (`unknown` until then).
 */
export type Port<C extends Category> = C extends ShopinCategory
  ? PortTypes[C]
  : C extends keyof ServingPorts
    ? NonNullable<ServingPorts[C]>
    : unknown

/**
 * The port serving each category for this BFF: SHOPin's five and the shop's own kinds. Inject it by type (a
 * shop's BFF feature reads its kind here; a port that wraps another reads the other one here, when it serves a
 * request, not while the BFF starts).
 *
 * A package that serves a kind of its own adds it once, in its descriptor, which also makes it a config key
 * (see the kit's README):
 * `declare module '@core/integration-kit' { interface ServingPorts { orderRules?: OrderRules } }`.
 */
export abstract class ServingPorts {
  abstract readonly commerce: PortTypes['commerce']
  abstract readonly search?: PortTypes['search']
  abstract readonly cms?: PortTypes['cms']
  abstract readonly psp?: PortTypes['psp']
  abstract readonly auth?: PortTypes['auth']
}

const READS = Symbol.for('shopin.reads')

/**
 * The categories a BFF controller's routes read (SHOPin's or the shop's own kinds). The BFF mounts the
 * controller's module only when every one is served, and refuses to boot when a controller does not declare
 * it. `@Reads()`: reads none.
 */
export const Reads =
  (...categories: Category[]) =>
  (controller: abstract new (...args: never[]) => unknown): void => {
    Object.defineProperty(controller, READS, { value: categories })
  }
