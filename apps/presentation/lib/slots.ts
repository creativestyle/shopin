import 'server-only'
import type { ComponentType, ReactNode } from 'react'
import type { ShopPageProps, StorefrontSlots } from '@core/integration-kit'
import * as exported from '@shopin/storefront'
import * as wired from '@shopin/storefront/wired'

/**
 * Server-only: the shop's storefront file holds server pages too. The client slots reach the browser as elements
 * through `ClientSlotsProvider` (the layout renders them), never through this module.
 *
 * Every slot is optional: a shop file written before a slot existed simply has no export for it. A slot the shop
 * leaves `undefined` takes the component a configured integration fills it with (wired.mts, written by setup).
 */
const shop: { readonly [K in keyof StorefrontSlots]?: unknown } = {
  ...wired,
  ...Object.fromEntries(
    Object.entries(exported).filter(([, v]) => v !== undefined)
  ),
}

/**
 * The shop's storefront slots (config/storefront/storefront.mts) with their React types. A slot the shop sets to
 * `undefined` and a component both fit; a component that expects other props fails the type check here.
 */
export const PaymentStep: ComponentType | undefined = shop.PaymentStep as never
/** A notice over every page except the legal ones (the demo's demo notice). */
export const SiteNotice: ComponentType | undefined = shop.SiteNotice as never
/** Analytics and marketing tags, given the visitor's consent (the demo's sample tags). */
export const TrackingTags:
  | ComponentType<Parameters<NonNullable<StorefrontSlots['TrackingTags']>>[0]>
  | undefined = shop.TrackingTags as never
/** The shop's own cart fields, under the cart summary. */
export const CartExtra:
  | ComponentType<Parameters<NonNullable<StorefrontSlots['CartExtra']>>[0]>
  | undefined = shop.CartExtra as never
/** The configured CMS's preview request reader (`/api/draft`); undefined when it has no preview. */
export const PreviewRequest: StorefrontSlots['PreviewRequest'] =
  shop.PreviewRequest as never
/**
 * A shop page: a component that gets its path, the search params, the locale and `bff`, with Next's own
 * `metadata` or `generateMetadata` when it has a title.
 */
type ShopPage = ((props: ShopPageProps) => ReactNode | Promise<ReactNode>) & {
  metadata?: object
  generateMetadata?(props: ShopPageProps): object | Promise<object>
}

/** The shop's own pages, by path. */
export const Pages: Readonly<Partial<Record<string, ShopPage>>> = (shop.Pages ??
  {}) as never
