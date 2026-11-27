# SHOPin storefront accelerator

[![License: OSL-3.0](https://img.shields.io/badge/License-OSL--3.0-blue.svg)](https://opensource.org/licenses/OSL-3.0)
[![Build Status](https://github.com/creativestyle/shopin/actions/workflows/ci.yml/badge.svg)](https://github.com/creativestyle/shopin/actions)

A modular storefront accelerator with a NestJS Backend for Frontend (BFF), Next.js presentation app, and pluggable data sources. Swap e-commerce backends and CMSs via a data-source layer; built for flexibility and type-safe development in a monorepo. **[Turborepo](https://turbo.build/repo)** orchestrates the monorepo: builds, tasks, and caching across all apps and packages.

## Features

- **BFF + storefront** — Clear separation between API gateway (NestJS) and frontend (Next.js App Router). Suits any e-commerce or CMS backend you wire behind the BFF.
- **Pluggable integrations** — One integration per category (commerce, search, CMS, payment, sign-in), named in `config/shop/shopin.config.ts` and switched with `npm run use`. You can add or replace integrations.
- **Turborepo** — [Turborepo](https://turbo.build/repo) orchestrates builds, tasks, and caching across the monorepo. Shared packages for contracts, i18n, config, and tooling.
- **Demo tooling** — Optional data-source selector and mocked flows for development; safe to remove for production.
- **Documentation** — [Storybook](apps/storybook/README.md) for UI components, [Typedoc](apps/typedoc/README.md) for API docs.

## Quick start

**Prerequisites:** Node.js 24 (`.nvmrc`). No vendor account: the default shop runs on sample data (mock).

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd shopin
   npm ci
   ```

2. **Set up and run**

   ```bash
   npm run setup   # creates .env with fresh local keys, installs and builds what the shop config names
   npm run dev
   ```

   - **Storefront:** http://localhost:3000
   - **BFF API:** http://localhost:4000/bff — Swagger: http://localhost:4000/bff/api
   - **Storybook:** http://localhost:6006
   - **Typedoc:** http://localhost:5000

3. **Choose your vendors** — `config/shop/shopin.config.ts` names one integration per category (commerce, search,
   cms, psp, auth). Change it with `npm run use`, which rewrites the file and runs setup again:

   | Command                                                 | What it does                                                                |
   | ------------------------------------------------------- | --------------------------------------------------------------------------- |
   | `npm run use commerce commercetools auth commercetools` | commercetools for commerce and sign-in (they pair: `use` names the pairing) |
   | `npm run use cms contentful` / `search algolia`         | Contentful pages, Algolia search                                            |
   | `npm run use auth off`                                  | takes a category out (every shop keeps commerce)                            |
   | `npm run use cms`                                       | lists the integrations a category takes                                     |
   | `npm run use demo` / `npm run use demo off`             | the SHOPin demo, with its `/setup` page that switches per visitor, and back |

   Setup adds the variables an integration needs to `.env`, empty, and its last lines name the ones still to fill
   (each integration's README says where to find them). Restart `npm run dev` after a change.

4. **Commit** `config/` and `package-lock.json`: setup writes the shop's packages from the config, and CI runs
   `npm run config:check` to keep them in step.

## Removing the demo

The SHOPin demo (the "Demo Store Notice", sample tracking tags, the `/setup` switcher and the demo config) lives in
`demo/` and reaches the storefront only through the slots of `config/storefront` while `npm run use demo` is on. A
shop's own config carries none of it, so a shop build shows no demo notice. To drop the folder from your repository:

```bash
npm run use demo off     # only if the demo is on: back to your own config
npm run use demo remove  # deletes demo/, then setup installs without it
```

`remove` refuses while the demo is on, and while a package outside `demo/` still depends on a demo package (it names
it). Git brings the folder back if you need it again.

## Project structure

| Area                  | Description                                                                                                                                                 | README                                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **apps/bff**          | NestJS BFF (API gateway, auth, cart, content, products).                                                                                                    | [apps/bff/README.md](apps/bff/README.md)                                                                                                                                                       |
| **apps/presentation** | Next.js storefront (App Router).                                                                                                                            | [apps/presentation/README.md](apps/presentation/README.md)                                                                                                                                     |
| **apps/storybook**    | UI component documentation and playground.                                                                                                                  | [apps/storybook/README.md](apps/storybook/README.md)                                                                                                                                           |
| **apps/typedoc**      | Generated TypeScript API documentation.                                                                                                                     | [apps/typedoc/README.md](apps/typedoc/README.md)                                                                                                                                               |
| **core/contracts**    | **Shared interfaces, types, and Zod schemas** consumed by apps and integrations (API contracts, request/response shapes).                                   | [core/contracts/README.md](core/contracts/README.md)                                                                                                                                           |
| **core/** (other)     | i18n, logger, ESLint/Prettier/TypeScript configs.                                                                                                           | See each package in `core/`                                                                                                                                                                    |
| **config/constants**  | Shared constants and types (data source, auth, i18n).                                                                                                       | [config/constants/README.md](config/constants/README.md)                                                                                                                                       |
| **integrations/**     | Data sources per vendor and category: commercetools (core, commerce, auth), algolia (search), contentful (cms, migration), mock (commerce, cms, psp, auth). | [contentful](integrations/contentful/cms/README.md), [contentful-migration](integrations/contentful/migration/README.md), [commercetools](integrations/commercetools/commerce/README.md), etc. |
| **demo/**             | Optional demo packages (data-source selector, demo notice, sample tracking tags). Can be removed for production.                                            | [demo/README.md](demo/README.md)                                                                                                                                                               |

## Scripts

| Script                       | Description                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `npm run setup`              | Create `.env`, install and build what `config/shop/shopin.config.ts` names.  |
| `npm run use`                | Switch, add or remove (`off`) an integration in the shop config, then setup. |
| `npm run config:check`       | Fail when the config, its packages and the lockfile disagree (CI).           |
| `npm run dev`                | Start all development servers (presentation, BFF, Storybook, Typedoc).       |
| `npm run build`              | Production build for apps.                                                   |
| `npm run test`               | Run tests.                                                                   |
| `npm run lint`               | Lint the codebase.                                                           |
| `npm run lint:boundaries`    | Integration import boundaries across the repo (part of `npm run lint`)       |
| `npm run format`             | Format the codebase.                                                         |
| `npm run check-types`        | Type-check TypeScript.                                                       |
| `npm run check-dependencies` | `npm audit --audit-level=high`.                                              |
| `npm run start:local`        | Run production builds locally (run `npm run build` first).                   |

**Contentful migrations** — Run from the package: `npm run migrate -w @integrations/contentful-migration --` (from root) or `npm run migrate --` from [integrations/contentful/migration](integrations/contentful/migration/README.md). See that README for subcommands.

## Adding a new locale

`LOCALE_CONFIG` in [`config/constants/src/i18n.ts`](config/constants/src/i18n.ts) is the single source of truth. Adding an entry there enables it across routing, language switcher, BFF header parsing, currency formatting, and hreflang alternates.

```ts
// config/constants/src/i18n.ts
export type SupportedLocale = "en-US" | "de-DE"; // 1. add RFC 5646 tag to the union

export const LOCALE_CONFIG: Record<SupportedLocale, Locale> = {
  "en-US": {
    language: "en-US",
    urlPrefix: "en",
    nativeName: "English",
    ctStoreKey: "us-store",
    currency: "USD",
  },
  "de-DE": {
    language: "de-DE",
    urlPrefix: "de",
    nativeName: "Deutsch",
    ctStoreKey: "eu-store",
    currency: "EUR",
  },
  // 2. add an entry — urlPrefix must be unique across all locales
};
```

After updating `LOCALE_CONFIG`, also:

1. **commercetools** — create or designate a Store in the Merchant Center with the correct languages and countries. Add the store key to `COMMERCETOOLS_STORE_KEYS` in `.env` (e.g. `fr-FR:fr-store`). See [`integrations/commercetools/commerce/README.md`](integrations/commercetools/commerce/README.md).
2. **Translations** — add `apps/presentation/messages/{locale}.json`.
3. **Contentful** _(if used)_ — ensure CMS content is translated for the new locale.

## How integrations work

The architecture aims to keep **core, BFF, and presentation as platform-agnostic as possible**. Only the **integrations** (in `integrations/`) hold platform-specific logic and data; they talk to a given e-commerce API, CMS, or mock, and **map** that data into the shared, agnostic types from [core/contracts](core/contracts/README.md). Each integration implements the same contract interfaces: it fetches or writes in the backend’s format, then returns or accepts the shared types (Zod schemas and TypeScript types). The BFF loads the integrations the shop config names once at start and exposes a **single API** to the frontend. The **presentation** app only talks to the BFF and stays agnostic of the backend. To add a new backend: write an integration package that serves the category's port (`defineIntegration`, [core/integration-kit](core/integration-kit/README.md)), name it in the shop config, and extend contracts only if the domain requires it ([docs/extending.md](docs/extending.md)).

## AI coding assistants

This repo ships with guidance for AI coding agents (Claude Code, Codex, Cursor, etc.):

- **[AGENTS.md](AGENTS.md)** — the in-repo source of truth for agents: stack, layout, commands, architecture, and conventions. Committed and read directly by supported tools.
- **Shared skills** — reusable agent skills are maintained separately in **[creativestyle/shopin-ai-tools](https://github.com/creativestyle/shopin-ai-tools)**. Install them with the [`skills` CLI](https://github.com/vercel-labs/skills):

  ```bash
  npx skills add creativestyle/shopin-ai-tools
  ```

  This installs each skill into the right per-tool directory (`.claude/skills/`, `.agents/skills/`, …). Those directories are git-ignored and local-only — re-run the command to pull updates instead of committing them.

## Documentation and community

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — How to set up for development and submit changes.
- **[SECURITY.md](SECURITY.md)** — How to report vulnerabilities and what not to commit.
- **License** — [OSL-3.0](LICENSE). See [LICENSE](LICENSE) for the full text.

---

Brought to life by<br/>
<a href="https://creativestyle.de" target="_blank" rel="noopener noreferrer"><picture><source media="(prefers-color-scheme: dark)" srcset="https://creativestyle.com/images/logos/creativestyle-logo-white-1x.png"><source media="(prefers-color-scheme: light)" srcset="https://creativestyle.com/images/logos/creativestyle-logo-1x.png"><img src="https://creativestyle.com/images/logos/creativestyle-logo-1x.png" width="211px"></picture></a>
