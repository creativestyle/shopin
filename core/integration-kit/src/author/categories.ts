import type { PortTypes } from './port-types'

/** The categories SHOPin ships; each has a fixed interface (`Port<C>`). */
export type ShopinCategory = keyof PortTypes

/**
 * What a provider serves. SHOPin ships five (`CATEGORIES`); a shop may serve its own kind of port (a business
 * register, order rules) under its own config key, declared with the same `port()`: its interface is whatever
 * its factory returns, and the shop's own code that reads it knows that type.
 */
export type Category = ShopinCategory | (string & {})

declare const PROVIDER_ID: unique symbol
/**
 * An integration's id as the BFF and the storefront hand it around (the resolved config, the request's providers):
 * opaque, so framework code cannot branch on one by name (`id === "mock"`, `case "mock":` do not type-check). At run
 * time it is the id string: use it as a key, in a template or as JSON.
 */
export type ProviderId = { readonly [PROVIDER_ID]: 'provider id' }

/** Commerce services a commerce port may leave out (`Integration.omits`), by name. */
export type OptionalService = 'wishlist'
