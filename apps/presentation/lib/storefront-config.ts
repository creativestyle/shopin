import type { StorefrontData } from '@core/integration-kit/core'
import data from '@shopin/storefront/storefront-data.json'

/**
 * The storefront's view of shopin.config.ts: plain JSON that `npm run setup` writes into config/storefront
 * (storefront-data.json), imported at build time. The storefront never imports an integration or the config itself.
 */
// JSON imports widen literal types (a category becomes `string`); setup writes the file from the typed config
// (`storefrontData(config)`), and config:check fails when it is out of date.
export const STOREFRONT: StorefrontData = data as unknown as StorefrontData
