# Integrations

Integration packages, grouped by category (`integrations/<category>/<package>`), used by the [BFF](../apps/bff) (Backend for Frontend) to connect the storefront to e‑commerce and CMS back ends. The BFF selects which integration(s) to use per request via [DataSourceFactory](../apps/bff/src/data-source/data-source.factory.ts) and the configured data source (e.g. `commercetools-set`, `mock-set`).

## Overview

| Category | Package                                                | Role                                                                                                                      |
| -------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| commerce | [**commercetools**](./commerce/commercetools)          | Product catalog, cart, checkout, navigation, customer, and order services via [Commercetools](https://commercetools.com/) |
| commerce | [**mock**](./commerce/mock)                            | Mock catalog, product search, cart, checkout and orders for local development and demos                                   |
| auth     | [**commercetools**](./auth/commercetools)              | Customer auth (login, registration, password reset, sessions) via Commercetools                                           |
| search   | [**commerce**](./search/commerce)                      | Search served by the commerce platform's own product search (any commerce integration)                                    |
| search   | [**algolia**](./search/algolia)                        | Product search via [Algolia](https://www.algolia.com/)                                                                    |
| cms      | [**mock**](./cms/mock)                                 | Mock content pages, header and footer                                                                                     |
| cms      | [**contentful**](./cms/contentful)                     | CMS content: pages and layout (header/footer) via [Contentful](https://www.contentful.com/) GraphQL API                   |
| cms      | [**contentful-migration**](./cms/contentful-migration) | Content model and demo content for Contentful (migrations / CMS-as-code)                                                  |
| psp      | [**mock**](./psp/mock)                                 | Mock payment methods and the demo payment link                                                                            |
| psp      | [**mock-payment-page**](./psp/mock-payment-page)       | The demo payment page the mock payment redirects to                                                                       |

Each package is named `@integrations/<category>-<name>` after its folder (for example `@integrations/auth-commercetools`).

## Boundaries

Each integration stands alone, so it can be installed, swapped or removed without touching another. A file in `integrations/<category>/<name>` may not import:

- another integration package (`@integrations/*` other than its own),
- app, demo or test code (`@apps/*`, `@demo/*`, `@test/*`),
- a relative path that leaves its own folder.

`npm run lint:boundaries` (part of `npm run lint`) enforces this across the whole repo with the rules in [`core/eslint-config/rules/boundaries.js`](../core/eslint-config/rules/boundaries.js), configured in [`eslint.boundaries.config.mjs`](../eslint.boundaries.config.mjs). The same run checks the other direction: code outside `integrations/` imports no integration package and no vendor SDK, except the files that config's `ALLOW` list names, and no relative import path contains "integration". `eslint-disable` comments have no effect on these rules. Code two integrations need goes into a `@core` package. One vendor serving two categories (commercetools: `commerce` and `auth`) gives each package its own client.

## How the BFF uses them

- **Data source `commercetools-set`**: Catalog, navigation and search from Commercetools (search through `search/commerce`); pages/layout from Contentful (or the CMS mock if Contentful is disabled). Customer, address, and order from Commercetools; payment from the payment mock.
- **Data source `mock-set`**: Catalog, search, navigation and orders from the commerce mock, content from the CMS mock, payment from the payment mock; customer services still from Commercetools.

All integration modules are imported in the BFF’s [DataSourceModule](../apps/bff/src/data-source/data-source.module.ts). For routing details and a code example, see the [BFF README – How it works](../apps/bff/README.md#how-it-works).

## Package READMEs

- [@integrations/commerce-commercetools](./commerce/commercetools/README.md)
- [@integrations/commerce-mock](./commerce/mock/README.md)
- [@integrations/cms-mock](./cms/mock/README.md)
- [@integrations/psp-mock](./psp/mock/README.md)
- [@integrations/search-commerce](./search/commerce/README.md)
- [@integrations/auth-commercetools](./auth/commercetools/README.md)
- [@integrations/cms-contentful](./cms/contentful/README.md)
- [@integrations/cms-contentful-migration](./cms/contentful-migration/README.md)
- [@integrations/psp-mock-payment-page](./psp/mock-payment-page/README.md)

## License

OSL-3.0 — see [root LICENSE](../LICENSE).
