# Integrations

Packages that connect the BFF to a commerce platform, CMS, search, payment or identity provider. The layout is vendor
first: `integrations/<vendor>/<category>`, one package per part a vendor serves, so a shop can remove one part (say
commercetools' sign-in) and keep the others. A vendor's shared code lives in `integrations/<vendor>/core`, which
declares no port; a part imports only its own vendor's core. What an integration is and how to write one:
[core/integration-kit](../core/integration-kit/README.md).

| Package                                | Folder                   | Serves                                                                             | Env                                                  |
| -------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `@integrations/commercetools-core`     | `commercetools/core`     | shared commercetools code (API clients, OAuth, scopes, errors); no port            | (its parts')                                         |
| `@integrations/commercetools-commerce` | `commercetools/commerce` | commerce (its product search serves search when the shop configures no search)     | `COMMERCETOOLS_*`                                    |
| `@integrations/commercetools-auth`     | `commercetools/auth`     | auth: commercetools' own sign-in (only with commercetools commerce)                | `COMMERCETOOLS_*`                                    |
| `@integrations/algolia-search`         | `algolia/search`         | search (an index fed from commercetools)                                           | `ALGOLIA_*`                                          |
| `@integrations/algolia-sync`           | `algolia/sync`           | tool of algolia-search: index sync                                                 | `ALGOLIA_WRITE_API_KEY`, `COMMERCETOOLS_*`           |
| `@integrations/contentful-cms`         | `contentful/cms`         | cms                                                                                | `CONTENTFUL_*`                                       |
| `@integrations/contentful-migration`   | `contentful/migration`   | tool of contentful-cms: content model, `npm run migrate`                           | `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN`, `CONTENTFUL_*` |
| `@integrations/mock-commerce`          | `mock/commerce`          | commerce: generated sample data (its product search serves search)                 | none                                                 |
| `@integrations/mock-cms`               | `mock/cms`               | cms: sample pages                                                                  | none                                                 |
| `@integrations/mock-psp`               | `mock/psp`               | psp: sample payment; `./page` is its pretend payment page (the `PaymentStep` slot) | none                                                 |
| `@integrations/mock-auth`              | `mock/auth`              | auth: fixture users (only with mock commerce)                                      | none                                                 |

Every folder is an npm workspace. A package's third-party dependencies are optional peers: `npm run setup` installs
them only for what the shop uses, into the package that uses them: `config/shop` (the BFF's integrations),
`config/storefront` (UI packages) or `config/tools` (a tool whose every `"shopin": { "toolOf": [...] }` parent is
configured). `npm run integrations:check` lints, type-checks and tests every installed integration and lists the
dormant ones. Demo-only packages live in `demo/` ([demo/README.md](../demo/README.md)). A shop's own kind of port and
its other extensions: [docs/extending.md](../docs/extending.md).

## License

OSL-3.0 — see [root LICENSE](../LICENSE).
