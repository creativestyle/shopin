/**
 * The demo's storefront slots (with demo/shop/config/shopin.config.ts, `npm run use demo`): the /setup
 * data-source selector (a page), the demo notice (SiteNotice) and the sample tracking tags (TrackingTags). The mock
 * payment page is wired by mock data (wired.mts). A shop's own storefront.mts has none of them, so a shop build
 * carries nothing of the demo.
 */
import type { StorefrontSlots } from '@core/integration-kit'
import { SetupPage } from '@demo/data-source-selector'
import { DemoDisclaimerModal } from '@demo/demo-disclaimer'
import { MockTrackingTags } from '@demo/mock-tracking-tags'

export const SiteNotice = DemoDisclaimerModal
export const TrackingTags = MockTrackingTags
export const PaymentStep = undefined
export const CartExtra = undefined
export const Pages = {
  setup: SetupPage,
}
;({
  SiteNotice,
  TrackingTags,
  PaymentStep,
  CartExtra,
  Pages,
}) satisfies StorefrontSlots
