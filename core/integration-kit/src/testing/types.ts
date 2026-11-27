import { type Port } from '../index'

export interface ContractCase {
  name: string
  /**
   * What the case uses: commerce services, or single methods as `service.method` (a case of an optional member the
   * port leaves out is skipped).
   */
  services: readonly string[]
  /** Runs the case; pass node:test's test context (`test(c.name, c.run)` does) so a skip shows as skipped. */
  run(...context: unknown[]): Promise<void>
}

/** A case's own run: a string is the reason it could not run here. */
export type Run = () => Promise<void | string>

/** Who the port acts for: `customerId` as linked by the BFF, or a guest. */
export interface ActingAs {
  customerId?: string
}

/** What the integration's data holds, for the cases that read or write it. A section without data is not run. */
export interface CommerceContractData {
  /** A product of the catalog that can go into a cart (its id is read from the port). */
  product?: { slug: string; variantId?: string }
  /** The catalog makes up a product for any slug (the mock): the slug and unknown-slug checks do not apply. */
  generatedCatalog?: boolean
  /** A category with at least one product. */
  category?: { slug: string }
  /**
   * Run the cart cases (create, add, change, remove). Needs `product`. `{ fields }`: also write these shop fields
   * with `setCartFields` (fields your platform's cart takes, e.g. those of its custom type).
   */
  cart?: boolean | { fields: Record<string, unknown> }
  /**
   * Two discount codes of the platform that each apply to a cart holding `product`: run the discount code case
   * (apply, a second code refused with `DiscountCodeError('alreadyApplied')` while one is applied, remove). Needs
   * `cart`.
   */
  discountCodes?: [string, string]
  /** The port links customers of other identity providers (`customers`): run the linking cases. */
  customers?: boolean
  /**
   * Run the order cases (a customer's order is not readable by another customer or a guest) and, when the port has
   * `attachGuestCart`, the sign-in cart case. Needs `cart`. Two customer ids of the platform, or `true` to create
   * them through `customers`.
   */
  orders?: true | { customers: [string, string] }
  /**
   * Makes the made-up names the cases use (e-mails, external ids, unknown slugs): 8 random characters by default.
   * A run against recorded responses passes a fixed sequence, so the replay asks for the same URLs as the recording.
   */
  unique?: () => string
}

/**
 * The services and methods the BFF calls on a commerce port. `optional`: a port may leave the service out (its
 * descriptor then lists it in `omits`, and the BFF answers 501 for it); its cases are skipped. Optional members
 * that are not services (`attachGuestCart`, `customers`, `guestSession`) have their own cases.
 */
export const COMMERCE: Record<
  string,
  { methods: readonly string[]; optional?: true }
> = {
  productService: { methods: ['getProduct'] },
  productCollectionService: { methods: ['getProductCollection'] },
  productSearchService: { methods: ['searchProducts'] },
  navigationService: { methods: ['getNavigation'] },
  cartService: {
    methods: [
      'getCart',
      'createCart',
      'addToCart',
      'updateCartItem',
      'removeCartItem',
      'setBillingAddress',
      'setShippingAddress',
      'getShippingMethods',
      'setShippingMethod',
      'addDiscountCode',
      'removeDiscountCode',
      'getActiveCart',
    ],
  },
  cartPaymentService: {
    methods: ['setPaymentMethod', 'verifyAndUpdatePaymentAmounts'],
  },
  storeConfigService: { methods: ['getStoreConfig'] },
  wishlistService: {
    methods: [
      'getWishlist',
      'getOrCreateWishlist',
      'addToWishlist',
      'removeFromWishlist',
    ],
    optional: true,
  },
  customerService: {
    methods: [
      'getCurrentCustomer',
      'updateCustomer',
      'changeCustomerPassword',
      'changeCustomerEmail',
    ],
  },
  customerAddressService: {
    methods: [
      'getAddresses',
      'addAddress',
      'updateAddress',
      'deleteAddress',
      'setDefaultShippingAddress',
      'setDefaultBillingAddress',
    ],
  },
  orderService: { methods: ['createOrder', 'getOrder', 'getOrders'] },
}

/** The HTTP status an error stands for (Nest's `getStatus()`, or a `status`/`statusCode` field). */

/** What each group of cases gets: the port under test, the data it runs with, and where to add its cases. */
export interface CaseContext {
  port: (as?: ActingAs) => Promise<Port<'commerce'>>
  data: CommerceContractData
  /** `data.unique`, or 8 random characters. */
  unique: () => string
  add: (
    services: readonly string[],
    ...list: { name: string; run: Run }[]
  ) => void
}
