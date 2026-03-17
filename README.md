# SHOPin storefront starter

[![License: OSL-3.0](https://img.shields.io/badge/License-OSL--3.0-blue.svg)](https://opensource.org/licenses/OSL-3.0)

A modular storefront starter with a NestJS Backend for Frontend (BFF), Next.js presentation app, and pluggable data sources. Swap e-commerce backends and CMSs via a data-source layer; built for flexibility and type-safe development in a monorepo. **[Turborepo](https://turbo.build/repo)** orchestrates the monorepo: builds, tasks, and caching across all apps and packages.

## Features

- **BFF + storefront** — Clear separation between API gateway (NestJS) and frontend (Next.js App Router). Suits any e-commerce or CMS backend you wire behind the BFF.
- **Pluggable data sources** — Switch backends (e.g. e-commerce API, mock) and optionally attach a CMS for pages and layout. The starter ships with one integration set; you can add or replace integrations.
- **Turborepo** — [Turborepo](https://turbo.build/repo) orchestrates builds, tasks, and caching across the monorepo. Shared packages for contracts, i18n, config, and tooling.
- **Demo tooling** — Optional data-source selector and mocked flows for development; safe to remove for production.
- **Documentation** — [Storybook](apps/storybook/README.md) for UI components, [Typedoc](apps/typedoc/README.md) for API docs.

## Quick start

**Prerequisites:** Node.js ≥ 22.

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd starter
   npm ci
   ```

2. **Environment** — Copy the template and set required values (see [.env.example](.env.example) for descriptions):

   ```bash
   cp .env.example .env
   ```

   Minimum for local dev: BFF URLs (with `/bff`), `FRONTEND_URL`, Commercetools credentials, and the four BFF security keys (JWT/CSRF). See the table in [.env.example](.env.example).

3. **Setup and run**

   ```bash
   npm run setup
   npm run dev
   ```

   - **Storefront:** http://localhost:3000
   - **BFF API:** http://localhost:4000 — Swagger: http://localhost:4000/bff/api
   - **Storybook:** http://localhost:6006
   - **Typedoc:** http://localhost:5000

## Project structure

| Area                  | Description                                                                                                               | README                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **apps/bff**          | NestJS BFF (API gateway, auth, cart, content, products).                                                                  | [apps/bff/README.md](apps/bff/README.md)                                                                                                                                                          |
| **apps/presentation** | Next.js storefront (App Router).                                                                                          | [apps/presentation/README.md](apps/presentation/README.md)                                                                                                                                        |
| **apps/storybook**    | UI component documentation and playground.                                                                                | [apps/storybook/README.md](apps/storybook/README.md)                                                                                                                                              |
| **apps/typedoc**      | Generated TypeScript API documentation.                                                                                   | [apps/typedoc/README.md](apps/typedoc/README.md)                                                                                                                                                  |
| **core/contracts**    | **Shared interfaces, types, and Zod schemas** consumed by apps and integrations (API contracts, request/response shapes). | [core/contracts/README.md](core/contracts/README.md)                                                                                                                                              |
| **core/** (other)     | i18n, logger, ESLint/Prettier/TypeScript configs.                                                                         | See each package in `core/`                                                                                                                                                                       |
| **config/constants**  | Shared constants and types (data source, auth, i18n).                                                                     | [config/constants/README.md](config/constants/README.md)                                                                                                                                          |
| **integrations/**     | Data sources: mock-api, commercetools-api, commercetools-auth, contentful-api, contentful-migration.                      | [contentful-api](integrations/contentful-api/README.md), [contentful-migration](integrations/contentful-migration/README.md), [commercetools-api](integrations/commercetools-api/README.md), etc. |
| **demo/**             | Optional demo packages (data-source selector, mocked payment). Can be removed for production.                             | [demo/README.md](demo/README.md)                                                                                                                                                                  |

## Scripts

| Script                       | Description                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| `npm run setup`              | Build core packages and prepare the monorepo.                          |
| `npm run dev`                | Start all development servers (presentation, BFF, Storybook, Typedoc). |
| `npm run build`              | Production build for apps.                                             |
| `npm run test`               | Run tests.                                                             |
| `npm run lint`               | Lint the codebase.                                                     |
| `npm run format`             | Format the codebase.                                                   |
| `npm run check-types`        | Type-check TypeScript.                                                 |
| `npm run check-dependencies` | `npm audit --audit-level=high`.                                        |
| `npm run start:local`        | Run production builds locally (run `npm run build` first).             |

**Contentful migrations** — Run from the package: `npm run migrate -w @integrations/contentful-migration --` (from root) or `npm run migrate --` from [integrations/contentful-migration](integrations/contentful-migration/README.md). See that README for subcommands.

## How integrations work

The architecture aims to keep **core, BFF, and presentation as platform-agnostic as possible**. Only the **integrations** (in `integrations/`) hold platform-specific logic and data; they talk to a given e-commerce API, CMS, or mock, and **map** that data into the shared, agnostic types from [core/contracts](core/contracts/README.md). Each integration implements the same contract interfaces: it fetches or writes in the backend’s format, then returns or accepts the shared types (Zod schemas and TypeScript types). The BFF chooses which integration to use per request (data source) and exposes a **single API** to the frontend. The **presentation** app only talks to the BFF and stays agnostic of the backend. To add a new backend: implement an integration that fulfils the contract, register it in the BFF’s data-source layer ([apps/bff/README.md](apps/bff/README.md)), and extend contracts only if the domain requires it.

## Documentation and community

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — How to set up for development and submit changes.
- **[SECURITY.md](SECURITY.md)** — How to report vulnerabilities and what not to commit.
- **License** — [OSL-3.0](LICENSE). See [LICENSE](LICENSE) for the full text.
