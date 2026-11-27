# @demo/mock-tracking-tags

⚠️ **DEMO ONLY** — For demonstration only; not for production.

Mock analytics and marketing tags that show the cookie-consent gate working in the demo store. They talk to no real tracker. They only set an identifier cookie (`_analytics_id`, `_mkt_id`) and push an event to `window.dataLayer`.

## What’s included

- `MockTrackingTags` renders a mock tag for each consented category (`analytics`, `marketing`) and deletes that tag's cookie when the category isn't consented.

## Usage

It is the `TrackingTags` slot in `demo/storefront/src/storefront.mts`. The storefront renders the slot from `apps/presentation/app/[variant]/[locale]/tracking-tags-wrapper.tsx`, which passes the visitor's consent from `useConsent` and `useConsentGate`; without the slot it renders nothing.

To add a real tag, see the cookie consent section of [apps/presentation/README.md](../../../apps/presentation/README.md).

## Removal

See [demo/README.md](../README.md).

## License

OSL-3.0, see the [root LICENSE](../../../LICENSE).
