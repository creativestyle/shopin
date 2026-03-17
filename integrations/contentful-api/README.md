# @integrations/contentful-api

NestJS module that integrates [Contentful](https://www.contentful.com/) with the SHOPin storefront accelerator for CMS content. Provides `PageService` (pages by slug/locale/preview) and `LayoutService` (header/footer) via the Contentful GraphQL API.

## Overview

The module exposes a `ContentfulServiceProvider` that implements the BFF data-source content contract: `pageService` and `layoutService`. The BFF uses it to serve CMS pages and layout (header/footer) when `ContentfulApiModule` is imported in the BFF—then the provider is registered and the data-source factory uses it for content (e.g. for `commercetools-set`). If the module is not imported, the provider is not registered and the BFF uses the mock content fallback instead (see [Adding to the data source](#adding-to-the-data-source)).

## Environment Variables

All env are set in the **repo root `.env`**. See [root `.env.example`](../../.env.example) for names and descriptions. This module uses:

- `CONTENTFUL_ACCESS_TOKEN` — Delivery API (published content)
- `CONTENTFUL_PREVIEW_ACCESS_TOKEN` — Preview API (draft content; optional)
- `CONTENTFUL_SPACE`, `CONTENTFUL_ENVIRONMENT`

## Service Provider

The module provides `ContentfulServiceProvider` with `pageService` and `layoutService`. It is registered under the token `CONTENTFUL_SERVICE_PROVIDER`. Inject that token and call `getServices()` to obtain the content services.

## Adding to the data source

To use Contentful as the CMS for one or more data sources in the BFF:

1. **Register the module** — Import `ContentfulApiModule` in the BFF data-source module (e.g. `apps/bff/src/data-source/data-source.module.ts`) and add it to the `imports` array. This makes `CONTENTFUL_SERVICE_PROVIDER` available.

2. **Wire content in the data-source factory** — In the BFF data-source factory (e.g. `apps/bff/src/data-source/data-source.factory.ts`):
   - Inject `CONTENTFUL_SERVICE_PROVIDER` with `@Optional()` so that the BFF can run when this module is not imported. The provider is absent only when `ContentfulApiModule` is not imported in the BFF; if imported, it is always registered (and required env vars must be set). To run the BFF without Contentful, see the [BFF README](../../apps/bff/README.md) section “Using mock content for commercetools-set”.
   - For each data source that should use Contentful for CMS, ensure the factory’s `getServices()` returns `pageService` and `layoutService` from `contentfulServiceProvider.getServices()` when that provider is present. When it is absent (provider `null`), fall back to another content provider (e.g. mock) for those data sources.

3. **Use the factory in the BFF** — The BFF’s content layer (e.g. `ContentService`) should call the data-source factory’s `getServices()` and use the returned `pageService` and `layoutService` for pages and layout. No further Contentful-specific code is needed in the BFF beyond the data-source wiring above.

## Content model and migrations

Content model and migration details live in the **[@integrations/contentful-migration](../contentful-migration/README.md)** package.

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
