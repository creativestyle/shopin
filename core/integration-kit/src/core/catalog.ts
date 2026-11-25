import type {
  Category,
  Integration,
  OptionalService,
  ProviderId,
  Requirement,
} from '../index'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type { ProductDetailsResponse } from '@core/contracts/product/product-details'
import categories from '../categories.json'

/** The categories SHOPin ships, in resolution order (a requirement may only point at an earlier category). */
export const CATEGORIES: readonly Category[] = categories

/** The optional services and the port member each one stands for. */
export const OPTIONAL_SERVICES: Readonly<
  Record<OptionalService, 'wishlistService'>
> = { wishlist: 'wishlistService' }

/** A requirement's reason in a language (`de`, or a locale such as `de-DE`), English when it has none. */
export function reasonIn(
  reason: Requirement['reason'],
  language = 'en'
): string {
  return typeof reason === 'string'
    ? reason
    : (reason[language] ?? reason[language.split('-')[0]!] ?? reason.en)
}

/** The categories an integration provides: the keys of its ports. */
export const provides = (i: Integration): Category[] =>
  Object.keys(i.ports) as Category[]

/** A Nest module class (no Nest types in the kit). */
export type FeatureModule = abstract new (...args: never[]) => unknown

/** A Zod-like schema whose output extends the contract type T (no zod import in the kit). */
interface ExtendedContract<T> {
  parse(data: unknown): T
}

/** The contracts a shop may extend, by name. */
export interface ContractExtensions {
  /** Every cart response (cart, checkout, payment method). */
  cart: ExtendedContract<CartResponse>
  /** Every product card: search results, category pages, wishlist items. */
  productCard: ExtendedContract<ProductCardResponse>
  /** The product on the product page. */
  product: ExtendedContract<ProductDetailsResponse>
}

const READS = Symbol.for('shopin.reads')

/** The categories a controller declared with `@Reads`, or undefined. */
export const readsOf = (controller: object): Category[] | undefined =>
  (controller as { [READS]?: Category[] })[READS]

/** An integration of the resolved config: its id is a `ProviderId`. */
export type Provider = Omit<Integration, 'id'> & { id: ProviderId }

/** The kit mints provider ids from the descriptors' ids, and reads them back as text where it compares data. */
export const asId = (id: string) => id as unknown as ProviderId
export const textOf = (id: ProviderId | undefined) =>
  id as unknown as string | undefined

/**
 * The resolved config: every integration once (also those another serves through, `delegates`), and per category
 * the id of the one serving it.
 */
export interface ShopinConfig {
  integrations: readonly Provider[]
  /** SHOPin's categories first (CATEGORIES order), then the shop's own kinds in config order. */
  providers: Partial<Record<Category, ProviderId>>
  contracts?: Partial<ContractExtensions>
  features?: readonly FeatureModule[]
}

/** Every category the config names a provider for, in resolution order (the shop's own kinds last). */
export const categoriesOf = (config: ShopinConfig): Category[] =>
  Object.keys(config.providers) as Category[]

/** The integration serving `category`, and those it serves through (`delegates`) that provide it. */
export function candidatesOf(
  config: ShopinConfig,
  category: Category
): { serving: Provider; delegates: Provider[] } | undefined {
  const byId = new Map(config.integrations.map((i) => [i.id, i]))
  const serving = byId.get(config.providers[category]!)
  if (!serving) {
    return undefined
  }
  const delegates = (serving.delegates ?? [])
    .map((d) => byId.get(asId(d.id))!)
    .filter((d) => d && category in d.ports)
  return { serving, delegates }
}
