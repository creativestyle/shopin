# @integrations/contentful-api

NestJS module that integrates [Contentful](https://www.contentful.com/) with the SHOPin storefront starter for CMS content. Provides `PageService` (pages by slug/locale/preview) and `LayoutService` (header/footer) via the Contentful GraphQL API.

## Overview

The module exposes a `ContentfulServiceProvider` compatible with the BFF data-source pattern. The BFF uses it for page and layout content when the selected data source is Commercetools; when the data source is mock, content is served from `@integrations/mock-api` instead.

## Environment Variables

All env are set in the **repo root `.env`**. See [root `.env.example`](../../../.env.example) for names and descriptions. This module uses:

- `CONTENTFUL_ACCESS_TOKEN` — Delivery API (published content)
- `CONTENTFUL_PREVIEW_ACCESS_TOKEN` — Preview API (draft content; optional)
- `CONTENTFUL_SPACE`, `CONTENTFUL_ENVIRONMENT`

## Service Provider

The module includes `ContentfulServiceProvider` that provides access to Contentful services (`pageService`, `layoutService`) through a unified interface. Inject `CONTENTFUL_SERVICE_PROVIDER` and call `getServices()` to use it.

## Usage

This module is used by the BFF and is wired through the **data source** like other integrations. It's imported in `apps/bff/src/data-source/data-source.module.ts`. `DataSourceFactory.getServices()` exposes `pageService` and `layoutService`: from **mock** when the data source is `mock-set`, and from **Contentful** when it is `commercetools-set`. The BFF `ContentService` uses the factory, so content (page, header, footer) is available for both data sources.

## Integration

The module is loaded by the BFF's `DataSourceModule` and is used for all content pages and layout (header/footer), regardless of the product/cart data source.

## Content model and migrations

Content model and migration details live in the **[@integrations/contentful-migration](../contentful-migration/README.md)** package.

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
