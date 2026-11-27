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

/** The slots the server layout renders without their props; a client mount adds them (`cloneElement`). */
type ClientSlotName = 'TrackingTags' | 'CartExtra'
/**
 * A client slot as the server layout holds it: a client reference it renders with none (or only initial) props;
 * the mount in the browser adds the props it knows (consent, the cart).
 */
export type ClientSlot<K extends ClientSlotName> = ComponentType<
  Partial<Parameters<NonNullable<StorefrontSlots[K]>>[0]>
>

const CLIENT_REFERENCE = Symbol.for('react.client.reference')

/**
 * A client slot (TrackingTags: analytics and marketing tags given the visitor's consent; CartExtra: the shop's own
 * cart fields under the cart summary), or undefined when the shop has none. It must be a client component: the
 * server layout renders it without its props and the browser adds them, so a server component would run without
 * a cart, or once without consent. Anything else throws, naming the slot. Called where the layout renders it, so
 * a module that reads other slots (routes, shop pages) never trips over it.
 */
export function clientSlot<K extends ClientSlotName>(
  name: K
): ClientSlot<K> | undefined {
  const component = shop[name]
  if (component === undefined) {
    return undefined
  }
  if (
    (component as { $$typeof?: unknown } | null)?.$$typeof !== CLIENT_REFERENCE
  ) {
    throw new Error(
      `The storefront slot ${name} must be a client component: add 'use client' at the top of the file that defines it (the layout renders it on the server without its props; the browser adds them).`
    )
  }
  return component as ClientSlot<K>
}

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
