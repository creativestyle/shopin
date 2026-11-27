import type {
  Category,
  ImageSource,
  OptionalService,
  ProviderId,
  Requirement,
  StorefrontSlots,
  StorefrontVariants,
} from '../index'
import {
  OPTIONAL_SERVICES,
  candidatesOf,
  categoriesOf,
  type ShopinConfig,
} from './catalog'

/** What a storefront variant serves: the provider per category, the categories it cannot, its optional services. */
export interface Capabilities {
  providers: Partial<Record<Category, ProviderId>>
  unavailable: Partial<Record<Category, string>>
  services: Record<OptionalService, boolean>
}

/** The storefront's view of the config: plain JSON, inlined by next.config.ts. */
export interface StorefrontData {
  /** Every integration's label (one text, or one per language), its id when it has none. */
  labels: Record<string, Requirement['reason']>
  productImages: ImageSource[]
  contentImages: ImageSource[]
  /** The origins the CMS integrations that serve `cms` allow to frame the preview (their `previewOrigins`). */
  previewOrigins: string[]
  /**
   * The slots the serving integrations fill, each with its component (`from` package, export `name`) and who fills
   * it: setup writes them into config/storefront/wired.mts. The first serving provider of a category wins.
   */
  slots: Partial<
    Record<keyof StorefrontSlots, { from: string; name: string; by: string }>
  >
  /**
   * The request variants: none without an integration that declares them (`storefront.variants`), then one
   * combination, `""`.
   */
  variants: {
    chooser?: StorefrontVariants['chooser']
    dimensions: StorefrontVariants['dimensions']
    combinations: Record<string, { to: string } | Capabilities>
  }
}

export function storefrontData(config: ShopinConfig): StorefrontData {
  const byId = new Map(config.integrations.map((i) => [i.id, i]))
  // per category the integrations that may serve it, in order: the serving one's delegates, else itself
  const candidates = categoriesOf(config).map((category) => {
    const found = candidatesOf(config, category)!
    return {
      category,
      found,
      list: found.delegates.length ? found.delegates : [found.serving],
    }
  })
  // only integrations that serve a category: a listed but unused one adds no image host
  const parts = [
    ...new Set(candidates.flatMap((c) => c.list).map((i) => i.id)),
  ].map((id) => byId.get(id)!.storefront ?? {})
  const declared: StorefrontVariants = config.integrations.find(
    (i) =>
      i.storefront?.variants && Object.values(config.providers).includes(i.id)
  )?.storefront?.variants ?? {
    dimensions: [],
    combinations: { '': { providers: {}, unavailable: {} } },
  }
  const fixed = Object.fromEntries(
    candidates
      .filter((c) => !c.found.delegates.length)
      .map((c) => [c.category, c.found.serving.id])
  )
  const capabilities = (
    providers: Partial<Record<Category, string>>,
    unavailable: Partial<Record<Category, string>>
  ): Capabilities => {
    const all = { ...fixed, ...providers } as Capabilities['providers']
    const commerce = all.commerce ? byId.get(all.commerce) : undefined
    return {
      providers: all,
      unavailable,
      services: Object.fromEntries(
        (Object.keys(OPTIONAL_SERVICES) as OptionalService[]).map((s) => [
          s,
          Boolean(commerce) && !commerce!.omits?.includes(s),
        ])
      ) as Capabilities['services'],
    }
  }
  return {
    labels: Object.fromEntries(
      config.integrations.map((i) => [i.id, i.label ?? i.id])
    ),
    productImages: parts.flatMap((p) =>
      p.productImages ? [p.productImages] : []
    ),
    contentImages: parts.flatMap((p) =>
      p.contentImages ? [p.contentImages] : []
    ),
    previewOrigins: [
      ...new Set(
        candidates
          .filter((c) => c.category === 'cms')
          .flatMap((c) => c.list)
          .flatMap((i) => byId.get(i.id)?.storefront?.previewOrigins ?? [])
      ),
    ],
    slots: Object.fromEntries(
      candidates
        .flatMap(({ category, list }) =>
          list.flatMap(({ id, storefront }) =>
            Object.entries(
              (storefront?.slots?.[category] ?? {}) as Record<string, string>
            ).map(([slot, ref]) => {
              const [from, name] = ref.split('#') as [string, string]
              return [slot, { from, name, by: `${id} (${category})` }] as const
            })
          )
        )
        .reverse()
    ),
    variants: {
      ...(declared.chooser ? { chooser: declared.chooser } : {}),
      dimensions: declared.dimensions,
      combinations: Object.fromEntries(
        Object.entries(declared.combinations).map(([key, c]) => [
          key,
          'to' in c ? c : capabilities(c.providers, c.unavailable),
        ])
      ),
    },
  }
}
