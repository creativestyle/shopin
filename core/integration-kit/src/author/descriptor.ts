import type { ContractExtensions } from '../core/catalog'
import type { Category, OptionalService } from './categories'
import type { PortDefinition } from './port'
import type { StorefrontSlots } from './storefront'

// ─── The descriptor (`src/shopin.ts`: no Nest, no vendor SDK) ───────────────────────────────────

export interface EnvVar {
  env: string
  optional?: boolean
  /**
   * The value when the variable is not set; setup writes it into `.env` (`ACME_ENVIRONMENT=master`). One rule
   * for a value built on the BFF's own address: `{BFF_URL}` stands for the BFF's public URL (from the BFF's own
   * config), in the default and in a value set in `.env` (`default: '{BFF_URL}/<path>'`).
   */
  default?: string
  /** The form its value takes, for setup's `.env` note (`<BFF URL>/<path>`). */
  form?: string
  /**
   * An optional variable some shops need: given the shop, why this one needs it (a sentence for `.env` and the
   * BFF's start), or undefined. Setup lists it with the others and the BFF names it in the same first message, so a
   * shop never learns about a variable only after setting the others.
   */
  requiredWhen?: (shop: ShopFacts) => string | undefined
}

/** What a variable's `requiredWhen` sees of the shop. */
export interface ShopFacts {
  /** The shop's locales (config/locales.json). */
  locales: readonly string[]
  /** Per category, the integrations that may serve it next to this one (with a provider switch: every candidate). */
  providers: Partial<Record<Category, readonly string[]>>
}

/** Option key → variable. Declared in the descriptor, so the BFF reads it without loading the port. */
export type EnvSchema = Record<string, EnvVar>

/** What a provider needs from earlier categories when it serves one category. */
export interface Requirement {
  needs: Partial<Record<Category, string>>
  /**
   * Shown to people (an integration's switcher, the storefront's "not available" page, the capabilities endpoint,
   * boot errors): one text, or one per language (`{ en: '…', de: '…' }`; `en` outside the storefront).
   */
  reason: string | { readonly en: string; readonly [language: string]: string }
}

/** Images an integration serves: its hosts and, optionally, how they resize (data, no code). */
export interface ImageSource {
  hosts: readonly string[]
  resize?:
    | {
        kind: 'suffix'
        steps: readonly { maxWidth: number; suffix: string }[]
        largest: string
      }
    | {
        kind: 'query'
        width: string
        quality?: string
        fixed?: Readonly<Record<string, string>>
      }
}

export interface Integration<
  Id extends string = string,
  P extends Category = Category,
> {
  id: Id
  /**
   * The integration's name, shown to people (an integration's switcher, `/bff/capabilities`, "not available"
   * messages): one text or one per language, the same shape as a requirement's `reason`
   * (`{ en: 'Sample data', de: 'Beispieldaten' }`). Required: every integration names itself. What it does goes
   * into `description`.
   */
  label: Requirement['reason']
  /**
   * What the integration does, in a few words, shown under its name (the `/setup` switcher): the same shape as
   * `label` (`{ en: 'Generated, works without any account', de: '…' }`). Required: every integration says what it
   * does.
   */
  description: Requirement['reason']
  /** One port per category, loaded lazily (`() => require('./cms').default`): reading the config loads no Nest. */
  ports: { [C in P]: () => PortDefinition<C> }
  /** Per category: the variables that port reads, handed over as `PortOptions`. */
  env?: Partial<Record<P, EnvSchema>>
  /** Per category: providers of earlier categories this one only works with. */
  requires?: Partial<Record<P, Requirement>>
  /**
   * Commerce services this integration's commerce port leaves out (`wishlist`: no `wishlistService`). The BFF
   * refuses to start when the port and this list disagree; the storefront hides what needs them.
   */
  omits?: readonly OptionalService[]
  /**
   * The shop's mapper hooks this integration was given (its factory option `mappers`), by contract. With a
   * contract in `contracts`, every integration that fills that contract must carry its hook.
   */
  mappers?: Partial<Record<keyof ContractExtensions, unknown>>
  /**
   * Integrations this one serves through (a router, a fallback): the BFF loads their ports of the categories this
   * one serves, each with its own options, vault and customer, and hands them to this one's ports as `Delegates`
   * (one that lacks its variables is left out, listed in `Delegates.unavailable`). Their ports' `servedBy` says
   * which one serves a request.
   */
  // an integration of any categories (see ServesCategory in config.ts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegates?: readonly Integration<string, any>[]
  storefront?: {
    /** The product image hosts it serves: one source, or several when they resize differently. */
    productImages?: ImageSource | readonly ImageSource[]
    /** The content image hosts it serves: one source, or several when they resize differently. */
    contentImages?: ImageSource | readonly ImageSource[]
    /**
     * A CMS's origins that may show the preview (draft mode) in a frame, e.g. `https://app.cms.example`. The
     * storefront allows exactly these (and itself) as `frame-ancestors` on its preview routes; without any, it sets
     * no frame policy there.
     */
    previewOrigins?: readonly string[]
    /**
     * Per category: the storefront slots this integration fills when it serves that category, each with its
     * component as `"<package>#<export>"` (`{ psp: { PaymentStep: "@acme/pay-ui#AcmePaymentStep" } }`). Setup
     * wires them (config/storefront/wired.mts); a slot the shop sets in storefront.mts wins.
     */
    slots?: Partial<
      Record<P, Partial<Record<keyof StorefrontSlots, `${string}#${string}`>>>
    >
    /**
     * The storefront's request variants (only an integration that serves through `delegates`): one dimension per
     * category it switches, kept in a cookie and sent to the BFF as a header; per combination of values (joined by
     * `__`), the provider serving each of those categories and the ones that cannot, or the combination it falls
     * back to (`to`). The storefront renders one static variant per combination that does not fall back.
     */
    variants?: StorefrontVariants
  }
}

export interface StorefrontVariants {
  /**
   * Where the visitor chooses another variant, offered by the error pages when a provider of the request is down:
   * the page's path, a hint and the link's text (one text or one per language, like `label`).
   */
  chooser?: {
    path: string
    hint: Requirement['reason']
    link: Requirement['reason']
  }
  dimensions: readonly {
    name: Category
    cookie: string
    header: string
    values: readonly string[]
    default: string
  }[]
  combinations: Readonly<
    Record<
      string,
      | { to: string }
      | {
          providers: Partial<Record<Category, string>>
          unavailable: Partial<Record<Category, string>>
        }
    >
  >
}

export function defineIntegration<
  const Id extends string,
  const P extends Category,
>(integration: Integration<Id, P>): Integration<Id, P> {
  return integration
}
