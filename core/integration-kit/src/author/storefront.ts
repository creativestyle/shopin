import type { CartResponse } from '@core/contracts/cart/cart'

// ─── The storefront's view (build time) ─────────────────────────────────────────────────────────

/** A storefront component as the kit sees it (no React dependency here); a React function component fits. */
type SlotComponent<P> = (props: P) => unknown

/**
 * What `config/storefront/storefront.mts` exports: every name, each a component (or pages, or the preview reader) or
 * `undefined` (the storefront then hides it). Check the file with `satisfies StorefrontSlots`.
 */
export interface StorefrontSlots {
  /** A notice over every page except the legal ones. */
  SiteNotice?: SlotComponent<Record<string, never>> | undefined
  /** The payment page at PAYMENT_STEP_PATH, for a payment provider hosted in the shop. */
  PaymentStep?: SlotComponent<Record<string, never>> | undefined
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
   * The shop's own pages, by path (`{ 'company-register': CompanyRegisterPage }` serves
   * `/company-register`). A shop page wins over a CMS page of the same path. Its title and description: Next's
   * own page exports, set on the component (`CompanyRegisterPage.metadata = { title }`, or
   * `CompanyRegisterPage.generateMetadata = async (props) => ({ title })` with the page's props).
   */
  Pages?: Readonly<Record<string, ShopPage>> | undefined
  /**
   * The CMS's preview (draft mode) request: reads the request its preview button opens (`/api/draft?…`). It returns
   * the page to preview when the request carries the preview secret (`secretMatches` compares a value with it,
   * timing-safe; the secret stays SHOPin's), else `undefined` (401). A missing `slug` or `locale` is a 400. Without
   * it, `/api/draft` answers 404: the configured CMS has no preview.
   */
  PreviewRequest?:
    | ((
        query: URLSearchParams,
        secretMatches: (value: string | null) => boolean
      ) => { slug: string | null; locale: string | null } | undefined)
    | undefined
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
