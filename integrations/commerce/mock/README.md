# @integrations/commerce-mock

Mock commerce platform: catalog, product search, navigation, cart, checkout, orders, store config and wishlist, generated with faker. No account needed: the BFF uses it for the `mock-set` data source (the default).

- **Commerce only.** CMS content is `@integrations/cms-mock`, payment methods are `@integrations/psp-mock`, and search reaches this catalog through `@integrations/search-commerce`.
- **Product search** (`ProductSearchService`) answers every query with a deterministic set of matches, so the same query always gives the same products and suggestions.
- **Tests:** `npm run test` (Jest; runs with `--experimental-vm-modules` because faker is an ES module).

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
