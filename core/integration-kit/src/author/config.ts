import type {
  ContractExtensions,
  FeatureModule,
  ShopinConfig as Resolved,
} from '../core/catalog'
import { validateConfig } from '../core/resolve'
import type { Category } from './categories'
import type { Integration } from './descriptor'
import type { ServingPorts } from './port-types'

/** What `defineConfig` returns (the BFF and the storefront build read it; a shop only exports it). */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ShopinConfig extends Resolved {}

// ─── The shop config (`shopin.config.ts`) ───────────────────────────────────────────────────────

// an integration of any categories that serves C: `Integration<string, Category>` would demand a port for every one
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServesCategory<C extends Category> = Integration<string, any> & {
  ports: Record<C, unknown>
}

type Categories = {
  [C in keyof ServingPorts & string]?: ServesCategory<C>
}

/**
 * Per category, the integration that serves it. Closed: a misspelled key (`serach`) fails type-checking. The keys
 * are SHOPin's categories and the kinds the installed packages add to `ServingPorts`.
 */
interface ShopConfig extends Categories {
  commerce: ServesCategory<'commerce'>
  /**
   * The shop's own fields on a contract (see the kit's README): e.g.
   * `{ cart: CartResponseSchema.extend({ giftMessage: z.string().optional() }) }`. The BFF parses that contract
   * with the extension; the base contract still validates and wins for its own fields. An integration's mapper
   * hook (its factory option `mappers`) fills the field.
   */
  contracts?: Partial<ContractExtensions>
  /**
   * The fields of `contracts.cart` a shopper may set through `PUT /bff/cart/fields` (a gift message, a delivery
   * note): `cartFields: ['giftMessage']`. None by default, so a field the server decides (a loyalty tier, a
   * discount flag) is never writable by the shopper.
   */
  cartFields?: readonly string[]
  /**
   * The shop's own BFF feature modules (Nest modules with a controller and its service, see the kit's README):
   * `features: [CompanyRegisterModule]`. Mounted when the categories their controllers read (`@Reads`) are
   * served.
   */
  features?: readonly FeatureModule[]
}

/**
 * Validates the shop config and throws once, listing every problem. Returns the resolved config the BFF
 * and the storefront build read.
 */
export function defineConfig(config: ShopConfig): ShopinConfig {
  const { resolved, errors } = validateConfig(
    config as unknown as Parameters<typeof validateConfig>[0]
  )
  if (errors.length) {
    throw new Error(`shopin.config:\n  - ${errors.join('\n  - ')}`)
  }
  return resolved
}
