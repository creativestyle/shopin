# @demo/mock-tracking-tags

⚠️ **DEMO ONLY** — For demonstration only; not for production.

Mock analytics and marketing tags that show the cookie-consent gate working in the demo store. They talk to no real tracker. They only set an identifier cookie (`_analytics_id`, `_mkt_id`) and push an event to `window.dataLayer`.

## What’s included

- `MockTrackingTags` renders a mock tag for each consented category (`analytics`, `marketing`) and deletes that tag's cookie when the category isn't consented.

## Usage

The presentation app renders it from `apps/presentation/app/[variant]/[locale]/demo-tracking-tags-wrapper.tsx`, which passes the visitor's consent from `useConsentGate`.

To add a real tag, see the cookie consent section of [apps/presentation/README.md](../../apps/presentation/README.md).

## Removal

See [demo/README.md](../README.md) for removal steps.

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
