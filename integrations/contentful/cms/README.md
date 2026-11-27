# @integrations/contentful-cms

NestJS module that integrates [Contentful](https://www.contentful.com/) with the SHOPin storefront accelerator for CMS content. Provides `PageService` (pages by slug/locale/preview) and `LayoutService` (header/footer) via the Contentful GraphQL API.

## Use it

In `config/shop/shopin.config.ts`: `cms: contentful()` (import from `@integrations/contentful-cms/shopin`), then
`npm run setup`. The integration serves the `cms` port (`pageService`, `layoutService`); the BFF loads it only when
the config names it.

## Environment variables

Set in the repository root `.env` (`npm run setup` adds the required ones, empty, when the config names
contentful); the BFF hands them to this port only. Secrets: provide them through CI/CD in production.

- `CONTENTFUL_ACCESS_TOKEN` — Delivery API (published content)
- `CONTENTFUL_PREVIEW_ACCESS_TOKEN` — Preview API (draft content; optional)
- `CONTENTFUL_SPACE`, `CONTENTFUL_ENVIRONMENT` (default `master`; setup writes it into `.env`)

## Preview (draft mode)

Set the content preview URL in Contentful (Settings → Content preview) to
`https://<your-shop>/api/draft?secret=<NEXT_DRAFT_MODE_SECRET>&slug={entry.fields.slug}&locale={locale}`. This
package reads that request for the storefront (its `PreviewRequest` slot) and allows `https://app.contentful.com` to
show the preview in the entry editor's frame (`previewOrigins`); the storefront sends that as `frame-ancestors` on its
preview pages.

## Content model and migrations

Content model and migration details live in the **[@integrations/contentful-migration](../contentful-migration/README.md)** package.

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
