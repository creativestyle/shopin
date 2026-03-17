# @config/constants

Shared constants and small derived types (data source, auth, i18n, sorting, etc.) used across apps and integrations. This package is for **primitive constants and types derived from them** (e.g. `as const` unions). **Object types and interfaces** should be defined in `@core/contracts` instead.

## Usage

Import from `@config/constants` in apps and integration packages. Run `npm run setup` or `npm run build` from the repo root (or in this package) to compile before use.
