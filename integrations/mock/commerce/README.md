# @integrations/mock-commerce

Mock commerce platform: catalog, product search, navigation, cart, checkout, orders, store config and wishlist, generated with faker. No account needed: the BFF uses it for the `mock-set` data source, chosen per request through the data-source header (the default is `commercetools-set`).

- **Commerce only.** CMS content is `@integrations/mock-cms`, payment methods are `@integrations/mock-psp`, and when no search integration is configured, the BFF searches this catalog through its own commerce search (`apps/bff/src/data-source/commerce-search.provider.ts`).
- **Product search** (`ProductSearchService`) answers every query with a deterministic set of matches, so the same query always gives the same products and suggestions.
- **Tests:** `npm run test` (Jest; runs with `--experimental-vm-modules` because faker is an ES module).

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
