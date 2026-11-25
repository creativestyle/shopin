import type { CartResponse } from '@core/contracts/cart/cart'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type { ProductDetailsResponse } from '@core/contracts/product/product-details'

// ─── The storefront's view (build time) ─────────────────────────────────────────────────────────

/** A storefront component as the kit sees it (no React dependency here); a React function component fits. */
type SlotComponent<P> = (props: P) => unknown

/**
 * What `config/storefront/storefront.mts` exports: every name, each a component (or pages, or texts) or
 * `undefined` (the storefront then hides it). Check the file with `satisfies StorefrontSlots`.
 */
export interface StorefrontSlots {
  /** A notice over every page except the legal ones. */
  SiteNotice?: SlotComponent<Record<string, never>> | undefined
  /** The payment page at PAYMENT_STEP_PATH, for a payment provider hosted in the shop. */
  PaymentStep?: SlotComponent<Record<string, never>> | undefined
  /**
   * Above the payment methods at checkout: what the payment integration tells the shopper (a test payment that
   * moves no money). The checkout never reads a provider's own values to decide this.
   */
  PaymentNote?: SlotComponent<Record<string, never>> | undefined
  /** Analytics and marketing tags, given the visitor's consent. */
  TrackingTags?:
    | SlotComponent<{ ready: boolean; analytics: boolean; marketing: boolean }>
    | undefined
  /**
   * Under the cart summary (cart, checkout): the shop's own cart fields (`contracts.cart`). `setFields` writes
   * them to the shopper's cart (`setFields({ giftMessage })`, `null` removes one; checked against the cart
   * contract, the commerce platform's `setCartFields`); the cart then shows the new values. It throws when the
   * BFF refuses.
   */
  CartExtra?:
    | SlotComponent<{
        cart: CartResponse
        setFields(fields: Record<string, unknown>): Promise<void>
      }>
    | undefined
  /**
   * On every product card and on the product page: the shop's own product fields (`contracts.productCard`,
   * `contracts.product`). `view` says where it renders.
   */
  ProductExtra?:
    | SlotComponent<{
        product: ProductCardResponse | ProductDetailsResponse
        view: 'card' | 'page'
      }>
    | undefined
  /**
   * The shop's own pages, by path (`{ 'company-register': CompanyRegisterPage }` serves
   * `/company-register`). A shop page wins over a CMS page of the same path. Its title and description: Next's
   * own page exports, set on the component (`CompanyRegisterPage.metadata = { title }`, or
   * `CompanyRegisterPage.generateMetadata = async (props) => ({ title })` with the page's props).
   */
  Pages?: Readonly<Record<string, ShopPage>> | undefined
  /**
   * The shop's own texts per locale (`{ 'en-US': en, 'de-DE': de }`, from JSON files next to storefront.mts),
   * merged over SHOPin's: a key the shop names wins. The shop's components read them with next-intl.
   */
  Messages?: Readonly<Record<string, object>> | undefined
}

/** A shop page: a component, with Next's own `metadata` or `generateMetadata` when it has a title. */
type ShopPage = SlotComponent<ShopPageProps> & {
  metadata?: object
  generateMetadata?(props: ShopPageProps): object | Promise<object>
}

/**
 * What a page of the shop (`Pages` slot, a React Server Component) gets. `bff(path)` reads the shop's BFF route
 * in this request's language and providers (`bff('company-register?q=…')`) and returns its JSON; it throws on a
 * 4xx/5xx.
 */
export interface ShopPageProps {
  /** The path segments after the page's own path. */
  path: string[]
  searchParams: Readonly<Record<string, string | string[] | undefined>>
  locale: string
  bff: (path: string) => Promise<unknown>
}
