# @config/constants

Shared constants and small derived types (data source, auth, i18n, sorting, etc.) used across apps and integrations. This package is for **primitive constants and types derived from them** (e.g. `as const` unions). **Object types and interfaces** should be defined in `@core/contracts` instead.

## Usage

Import from `@config/constants` in apps and integration packages. Run `npm run setup` or `npm run build` from the repo root (or in this package) to compile before use.

## Locales

`src/i18n.ts` reads `src/locales.json`, a copy `npm run setup` writes from the shop's own `config/locales.json`
(README, "Adding a new locale"). Do not edit the copy: `npm run config:check` fails when it differs. Every app and
integration reads the locales through `I18N_CONFIG`, `listLocales()`, `getLocale()` and `SupportedLocale`.
