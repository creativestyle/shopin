# Integrations

Integration packages, one per vendor and category (`integrations/<vendor>/<category>`), used by the [BFF](../apps/bff) (Backend for Frontend) to connect the storefront to e‑commerce and CMS back ends. The BFF selects which integration(s) to use per request via [DataSourceFactory](../apps/bff/src/data-source/data-source.factory.ts) and the configured data source (e.g. `commercetools-set`, `mock-set`).

## Overview

| Vendor        | Category | Package                                                | Role                                                                                                                      |
| ------------- | -------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| commercetools | commerce | [**commercetools/commerce**](./commercetools/commerce) | Product catalog, cart, checkout, navigation, customer, and order services via [Commercetools](https://commercetools.com/) |
| commercetools | auth     | [**commercetools/auth**](./commercetools/auth)         | Customer auth (login, registration, password reset, sessions) via Commercetools                                           |
| commercetools | —        | [**commercetools/core**](./commercetools/core)         | What the commercetools parts share: the server-side client and error helpers                                              |
| algolia       | search   | [**algolia/search**](./algolia/search)                 | Product search via [Algolia](https://www.algolia.com/)                                                                    |
| contentful    | cms      | [**contentful/cms**](./contentful/cms)                 | CMS content: pages and layout (header/footer) via [Contentful](https://www.contentful.com/) GraphQL API                   |
| contentful    | —        | [**contentful/migration**](./contentful/migration)     | Content model and demo content for Contentful (migrations / CMS-as-code)                                                  |
| mock          | commerce | [**mock/commerce**](./mock/commerce)                   | Mock catalog, product search, cart, checkout and orders for local development and demos                                   |
| mock          | cms      | [**mock/cms**](./mock/cms)                             | Mock content pages, header and footer                                                                                     |
| mock          | psp      | [**mock/psp**](./mock/psp)                             | Mock payment methods and the demo payment link (BFF), and the demo payment page the shopper lands on (`./page`)           |

Without a search integration, the BFF serves search from the commerce integration's own product search (`apps/bff/src/data-source/commerce-search.provider.ts`); it has no vendor, so it is not a package here.

Each package is named `@integrations/<vendor>-<category>` after its folders (for example `@integrations/commercetools-auth`). The integrations of one category: `ls -d integrations/*/search`.

A vendor that serves several categories keeps one package per category, so one part (say commercetools auth) is removed by deleting its folder and its wiring. Until the shop config arrives (next pull request), the wiring is in the BFF: the module import in `apps/bff/src/data-source/data-source.module.ts`, the provider in `data-source.factory.ts` (another integration has to take its category there), `apps/bff/package.json`, `apps/bff/turbo.json` (build and dev), `apps/bff/nodemon.config.json`, and `BFF_WIRING` in `eslint.boundaries.config.mjs` (lower `ALLOW_ENTRIES` by the entries removed). Code its parts share goes into `integrations/<vendor>/core` (`@integrations/<vendor>-core`), which has no category and imports none of the parts.

## Boundaries

Each integration stands alone in its imports. A file in `integrations/<vendor>/<category>` may not import:

- another integration package (`@integrations/*` other than its own and its vendor's `core`),
- app, demo or test code (`@apps/*`, `@demo/*`, `@test/*`),
- a relative path that leaves its own folder.

`npm run lint:boundaries` (part of `npm run lint`) enforces this across the whole repo with the rules in [`core/eslint-config/rules/boundaries.js`](../core/eslint-config/rules/boundaries.js), configured in [`eslint.boundaries.config.mjs`](../eslint.boundaries.config.mjs). The same run checks the other direction: code outside `integrations/` imports no integration package and no vendor SDK, except the files that config's `ALLOW` list names, and no relative import path goes through an `integrations/` folder. `eslint-disable` comments have no effect on these rules. Code two vendors need goes into a `@core` package; code one vendor's parts share goes into its `integrations/<vendor>/core` (commercetools: one server client for `commerce` and `auth`).

One package can't be removed on its own yet: `mock/psp`. The storefront renders its payment page (`@integrations/mock-psp/page`, its `ALLOW` entry), and its payment service (`getPaymentLink()`) sends checkout to that page's `/demo/mocked-payment-step/...` route for every data source. That ends once checkout hands the shopper to the payment integration's own page and the shop hosts no payment page.

## How the BFF uses them

- **Data source `commercetools-set`**: Catalog, navigation and search from Commercetools (search through the BFF's commerce search); pages/layout from Contentful (or the CMS mock if Contentful is disabled). Customer, address, and order from Commercetools; payment from the payment mock.
- **Data source `mock-set`**: Catalog, search, navigation and orders from the commerce mock, content from the CMS mock, payment from the payment mock; customer services still from Commercetools.

All integration modules are imported in the BFF’s [DataSourceModule](../apps/bff/src/data-source/data-source.module.ts). For routing details and a code example, see the [BFF README – How it works](../apps/bff/README.md#how-it-works).

## Package READMEs

- [@integrations/commercetools-core](./commercetools/core/README.md)
- [@integrations/commercetools-commerce](./commercetools/commerce/README.md)
- [@integrations/commercetools-auth](./commercetools/auth/README.md)
- [@integrations/algolia-search](./algolia/search/README.md)
- [@integrations/contentful-cms](./contentful/cms/README.md)
- [@integrations/contentful-migration](./contentful/migration/README.md)
- [@integrations/mock-commerce](./mock/commerce/README.md)
- [@integrations/mock-cms](./mock/cms/README.md)
- [@integrations/mock-psp](./mock/psp/README.md)

## License

OSL-3.0 — see [root LICENSE](../LICENSE).
