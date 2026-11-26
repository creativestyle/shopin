import type { ComponentType, ReactNode } from 'react'
import type { ShopPageProps, StorefrontSlots } from '@core/integration-kit'
import * as exported from '@shopin/storefront'
import * as wired from '@shopin/storefront/wired'

/**
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
/** A shop page: a component that gets its path, the search params, the locale and `bff`. */
type ShopPage = (props: ShopPageProps) => ReactNode | Promise<ReactNode>

/** The shop's own pages, by path. */
export const Pages: Readonly<Partial<Record<string, ShopPage>>> = (shop.Pages ??
  {}) as never
