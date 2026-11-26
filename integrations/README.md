# Integrations

Packages that connect the BFF to a commerce platform, search, CMS, payment or identity provider. One folder per
category; an integration that serves several categories lives under its main one. What an integration is and how to
write one: [core/integration-kit](../core/integration-kit/README.md).

| Package                                | Folder                              | Serves                                                                 | Env                            |
| -------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| `@integrations/commercetools-commerce` | `commerce/commercetools`            | commerce, search, auth                                                 | `COMMERCETOOLS_*`              |
| `@integrations/mock-commerce`          | `commerce/mock-api`                 | commerce, search, cms, psp                                             | none                           |
| `@integrations/mock-psp/page`          | `psp/mock-payment-page`             | storefront slot `PaymentStep` (mock data's payment page)               |                                |
| `@integrations/algolia-search`         | `search/algolia-api`                | search (fed from commerce)                                             | `ALGOLIA_*`                    |
| `@integrations/algolia-sync`           | `search/commercetools-algolia-sync` | tool of algolia-api: index sync                                        | `COMMERCETOOLS_*`, `ALGOLIA_*` |
| `@integrations/contentful-cms`         | `cms/contentful-api`                | cms                                                                    | `CONTENTFUL_*`                 |
| `@integrations/contentful-migration`   | `cms/contentful-migration`          | tool of contentful-api: content model, `npm run migrate`               | `CONTENTFUL_*`                 |
| `@integrations/mock-auth`              | `auth/mock-identity`                | auth (fixture users; mock commerce only)                               | none                           |
| `@demo/provider-switch`                | `demo/provider-switch`              | per-request provider choice ([README](demo/provider-switch/README.md)) | none                           |
| `@demo/data-source-selector`           | `demo/data-source-selector`         | storefront page `/setup` (`Pages`)                                     | none                           |
| `@demo/demo-disclaimer`                | `demo/demo-disclaimer`              | storefront slot `SiteNotice`                                           | none                           |
| `@demo/mock-tracking-tags`             | `demo/mock-tracking-tags`           | storefront slot `TrackingTags`                                         | none                           |
| `@integrations/demo-hydrate`           | `demo/hydrate`                      | demo data snapshots (setup-time tool)                                  | per provider                   |

Every folder is an npm workspace. A package's third-party dependencies are optional peers: `npm run setup` installs
them only for what the shop uses, into the package that uses them: `config/shop` (the BFF's integrations),
`config/storefront` (UI packages) or `config/tools` (a tool whose every `"shopin": { "toolOf": [...] }` parent is
configured). `npm run integrations:check` lints, type-checks and tests every installed integration and lists the
dormant ones. The folder under `integrations/` is the category the package serves; `demo/` holds demo-only packages ([demo/README.md](demo/README.md)); a shop's own kind gets its own folder ([docs/extending.md](../docs/extending.md)).

## License

OSL-3.0 — see [root LICENSE](../LICENSE).
