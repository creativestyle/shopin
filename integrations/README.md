# Integrations

NestJS integration packages used by the [BFF](../../apps/bff) (Backend for Frontend) to connect the storefront to e‑commerce and CMS back ends. The BFF selects which integration(s) to use per request via [DataSourceFactory](../../apps/bff/src/data-source/data-source.factory.ts) and the configured data source (e.g. `commercetools-set`, `mock-set`).

## Overview

| Package | Role |
|--------|------|
| [**commercetools-api**](./commercetools-api) | Product catalog, cart, checkout, navigation, customer, and order services via [Commercetools](https://commercetools.com/) |
| [**commercetools-auth**](./commercetools-auth) | Customer auth (login, registration, password reset, sessions) via Commercetools |
| [**contentful-api**](./contentful-api) | CMS content: pages and layout (header/footer) via [Contentful](https://www.contentful.com/) GraphQL API |
| [**contentful-migration**](./contentful-migration) | Content model and demo content for Contentful (migrations / CMS-as-code) |
| [**mock-api**](./mock-api) | Mock implementations of catalog, content, and navigation for local development and demos |

## How the BFF uses them

- **Data source `commercetools-set`**: Catalog and navigation from Commercetools; pages/layout from Contentful (or mock if Contentful is disabled). Customer, address, and order from Commercetools; payment from mock.
- **Data source `mock-set`**: Catalog, content, and navigation from the mock API; customer/order still from Commercetools; payment from mock.

All integration modules are imported in the BFF’s [DataSourceModule](../../apps/bff/src/data-source/data-source.module.ts). For routing details and a code example, see the [BFF README – How it works](../../apps/bff/README.md#how-it-works).

## Package READMEs

- [@integrations/commercetools-api](./commercetools-api/README.md)
- [@integrations/commercetools-auth](./commercetools-auth/README.md)
- [@integrations/contentful-api](./contentful-api/README.md)
- [@integrations/contentful-migration](./contentful-migration/README.md)
- [@integrations/mock-api](./mock-api/README.md)

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
