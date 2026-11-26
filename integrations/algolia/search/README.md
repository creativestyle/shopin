# @integrations/algolia-search

Product search from an [Algolia](https://www.algolia.com/) index: it serves the `search` category (results, facets,
price range). The index is filled from a commerce platform by a separate tool; the BFF only reads it.

## Usage

```bash
npm run use search algolia
```

writes the import and `search: algolia()` into `config/shop/shopin.config.ts`, then runs setup, which asks for the
one required option: the commerce integration whose catalog feeds the index (so search is offered only over that
platform):

```ts
import { defineConfig } from '@core/integration-kit'
import { commercetools } from '@integrations/commercetools-commerce/shopin'
import { algolia } from '@integrations/algolia-search/shopin'

export const config = defineConfig({
  commerce: commercetools(),
  search: algolia(),
  // …
})
```

Algolia serves over commercetools commerce only (the sync tool feeds the index from it). Over another commerce
integration setup refuses before it installs anything, and prints the command that fixes it
(`npm run use commerce commercetools search algolia`).

## Environment variables

Set in the repository root `.env`; `npm run setup` adds them (empty) when the config names algolia. Keys are in the
Algolia dashboard, Settings → API Keys; the index is created there too.

- `ALGOLIA_APP_ID` — the application
- `ALGOLIA_SEARCH_API_KEY` — a search-only key with the `search` and `listIndexes` ACLs (add `settings` for facet
  display names; without it facets show their attribute names)
- `ALGOLIA_INDEX_NAME` — the index

## Filling the index

`@integrations/algolia-sync` (`search/commercetools-algolia-sync`) pushes the published commercetools
products into the index and configures faceting. Setup installs it when algolia and commercetools are both
configured. It reads the commercetools variables and, besides the two above, `ALGOLIA_WRITE_API_KEY` (a key with
write access) from the root `.env`:

```bash
npm run sync -w @integrations/algolia-sync
```

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
