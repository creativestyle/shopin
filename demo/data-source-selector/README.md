# @demo/data-source-selector

⚠️ **DEMO ONLY** — For demonstration only; not for production.

The demo's /setup page (`SetupPage`, the storefront's `Pages` slot under `setup` in `@demo/storefront`): the demo's
provider switch per category. It lists, per category the switch has (`GET /bff/switch`), the installed integrations by
the name and description their descriptors declare (`label`, `description`, in the page's language); a provider the
other categories' choice rules out is disabled with the reason its descriptor gives. Choosing one writes that category's switch cookie,
and the storefront proxy reads it. No list of providers is written here (`setupRows` in `src/rows.ts`).

## Removal

The demo lives under `demo/`: see the root README, "Removing the demo".

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
