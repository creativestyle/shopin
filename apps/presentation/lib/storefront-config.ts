import type { StorefrontData } from '@core/integration-kit/core'

const raw = process.env.SHOPIN_STOREFRONT
if (!raw) {
  throw new Error(
    'SHOPIN_STOREFRONT is not set: next.config.ts inlines it from config/shop/shopin.config.ts at build time (run the build through next.config.ts, or set it in tests)'
  )
}

/**
 * The storefront's view of shopin.config.ts: plain JSON that next.config.ts inlines at build time
 * (env SHOPIN_STOREFRONT). The storefront never imports an integration or the config itself.
 */
export const STOREFRONT: StorefrontData = JSON.parse(raw)
