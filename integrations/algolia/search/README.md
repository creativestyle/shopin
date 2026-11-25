# @integrations/algolia-search

NestJS module that serves product search from [Algolia](https://www.algolia.com/) for the SHOPin storefront accelerator. The BFF uses it for the `commercetools-algolia-set` data source: catalog, cart and checkout from commercetools, product search from Algolia.

## Overview

`AlgoliaApiModule` registers the Algolia client and the `ALGOLIA_SERVICE_PROVIDER`, whose `AlgoliaSearchService` implements the BFF's product-search contract. The mappers turn Algolia hits, facets and price ranges into SHOPin's product and facet types.

## Environment Variables

Env are set in the **repo root `.env`**. See [root `.env.example`](../../../.env.example) for descriptions and the API key permissions. The module uses `ALGOLIA_APP_ID`, `ALGOLIA_SEARCH_API_KEY` and `ALGOLIA_INDEX_NAME`; the sync also needs `ALGOLIA_WRITE_API_KEY` and the commercetools variables.

## Filling the index

The index is filled from commercetools by the sync script: it pushes every published product, syncs the filterable variant attributes and configures faceting.

```sh
npm run sync -w @integrations/algolia-search            # from the repo root
npm run sync -w @integrations/algolia-search -- --dry-run
```

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
