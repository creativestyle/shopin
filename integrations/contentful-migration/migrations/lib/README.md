# migrations/lib — Shared migration utilities

This directory contains shared helpers and types used by Contentful migration scripts in `@integrations/contentful-migration`. The migration runner does **not** execute files in `lib`; it runs only scripts matching the `GG-SS-NN-name.js` pattern in sibling migration directories (e.g. `01-01-01-content-types`, `02-01-demo-content`).

## Modules

| Module                    | Purpose                                                                                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **client**                | `getManagementClient(migration)` — returns a Contentful Management API plain client. Requires `CONTENTFUL_SPACE`, `CONTENTFUL_ENVIRONMENT`, and `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN` in the environment.       |
| **constants**             | `LOCALES`, `DEFAULT_LOCALE`, `Locale` — shared locale list and default for locale-aware migrations.                                                                                                            |
| **content-type**          | `FieldSpec`, `ContentTypeDefinition`, `MigrationFunctionWithDefinition`, `applyContentTypeFromDefinition` — types and helpers to define and apply content types using the contentful-migration API.            |
| **content-types/ids**     | `CONTENT_TYPE_IDS` — content type IDs in dependency-safe order (used for reset delete order). `PAGE_COMPONENT_IDS` — content type IDs allowed as page components (teasers).                                    |
| **entries**               | `createEntryWithLocales(client, contentTypeId, fieldsByLocale)` — create and publish an entry with localized fields. `fieldsByLocale` is `Record<locale, Record<fieldId, value>>`.                             |
| **errors**                | `ApiError`, `isApiError` — error types and guards for API error handling (e.g. reset 404 handling).                                                                                                            |
| **links**                 | `EntryLinkRef`, `AssetLinkRef`, `getLinkId`, `getEntryLinkIds`, `getLocalizedString`, `getLocalizedArrayLength` — helpers for entry/asset links and localized fields.                                          |
| **page-teasers**          | `getPageBySlug`, `getOrCreatePage`, `setPageComponents`, `populatePageWithComponents`, `attachImageToEntry`, `findFirstTeaserImageWithoutAsset` — page and teaser composition helpers.                         |
| **rich-text-validations** | `RICH_TEXT_ENABLED_NODE_TYPES`, `RICH_TEXT_ENABLED_MARKS`, `RICH_TEXT_VALIDATIONS` — allowed Rich Text node types and marks for Contentful field validations; aligned with `@core/contracts` where applicable. |

## Using the lib from a migration

From a migration script (e.g. in `02-01-demo-content`), import from `../lib/<module>`:

```ts
import { getManagementClient } from '../lib/client'
import { LOCALES, DEFAULT_LOCALE } from '../lib/constants'
import { applyContentTypeFromDefinition } from '../lib/content-type'
import { CONTENT_TYPE_IDS, PAGE_COMPONENT_IDS } from '../lib/content-types/ids'
import { createEntryWithLocales } from '../lib/entries'
import { isApiError } from '../lib/errors'
import { getLinkId, getLocalizedString } from '../lib/links'
import { getPageBySlug, getOrCreatePage } from '../lib/page-teasers'
import { RICH_TEXT_VALIDATIONS } from '../lib/rich-text-validations'
```

Migrations depend on **contentful-management** (plain client) and **contentful-migration** (content type builder). The lib provides the client factory, content type IDs, and small helpers so migration scripts stay consistent and DRY.

## License

See [root LICENSE](../../../../LICENSE).
