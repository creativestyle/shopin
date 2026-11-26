# AGENTS.md

## Project overview

SHOPin Storefront Accelerator — a modular e-commerce storefront built as a Turborepo monorepo. NestJS Backend for Frontend (BFF) sits between a Next.js presentation layer and pluggable data sources (Commercetools, Contentful, mock). Shared contracts (Zod schemas + TypeScript types) ensure type safety across the stack.

## Tech stack

- **Runtime:** Node.js >= 24, npm >= 11.11
- **Monorepo:** Turborepo 2.4 with npm workspaces
- **Frontend:** Next.js 16 (App Router, RSC), React 19 with React Compiler, Tailwind CSS 4, Radix UI, React Query, react-hook-form
- **Backend:** NestJS 11, Express, Zod validation, Pino logging, jose (JWT/JWE)
- **Docs:** Storybook 10 (with RSC support), Typedoc
- **Testing:** Jest 30, Testing Library, Supertest
- **Code quality:** ESLint 9, Prettier 3, TypeScript 5.x strict, Husky + lint-staged

## Monorepo layout

```
apps/
  bff/              # NestJS API gateway (auth, cart, order, payment, product, product-search, navigation, content, customer, wishlist, store-config, csrf)
  presentation/     # Next.js storefront (App Router)
  storybook/        # Storybook 10 for UI component docs
  typedoc/          # Generated API documentation
core/
  contracts/        # Shared interfaces, Zod schemas, types (the single source of truth)
  i18n/             # next-intl translation files and config
  eslint-config/    # Shared ESLint rules
  prettier-config/  # Shared Prettier config
  typescript-config/ # Shared tsconfig bases
  logger-config/    # Pino logger configuration
  draft-token/      # Draft mode utilities
config/
  constants/        # Shared primitive constants and derived types
integrations/       # One package per vendor and category: integrations/<vendor>/<category> (@integrations/<vendor>-<category>)
  commercetools/core/       # What the commercetools parts share: server client, error helpers (no category)
  commercetools/commerce/   # Product catalog, cart, checkout, navigation
  commercetools/auth/       # Customer auth (OAuth 2.0, password grant)
  algolia/search/           # Product search (Algolia) — wired via the commercetools-algolia-set data source
  contentful/cms/           # CMS content (pages, layout) via GraphQL
  contentful/migration/     # CMS-as-code content model migrations
  mock/commerce/            # Mock implementations for local dev
  mock/psp/                 # Demo payment page the mock payment redirects to
test/
  e2e/              # Playwright: platform specs, journey stack, smoke specs
demo/               # Optional demo packages (removable for production)
  data-source-selector/
  data-source-header-reader/
  demo-disclaimer/
  mock-tracking-tags/
```

## Key commands

| Command                      | What it does                                                           |
| ---------------------------- | ---------------------------------------------------------------------- |
| `npm run setup`              | Build core packages, prepare monorepo                                  |
| `npm run dev`                | Start all dev servers                                                  |
| `npm run build`              | Production build                                                       |
| `npm run test`               | Run all tests                                                          |
| `npm run lint`               | ESLint across all packages                                             |
| `npm run lint:boundaries`    | Integration import boundaries across the repo (part of `npm run lint`) |
| `npm run format`             | Prettier across all packages                                           |
| `npm run format:check`       | Prettier check (non-mutating, CI gate)                                 |
| `npm run check-types`        | TypeScript type checking                                               |
| `npm run check-dependencies` | `npm audit --audit-level=critical`                                     |
| `npm run start:local`        | Run production builds locally (build first)                            |
| `npm run e2e`                | Playwright E2E suite (see test/e2e/README)                             |

Dev server ports: presentation :3000, BFF :4000 (Swagger at /bff/api), Storybook :6006, Typedoc :5000.

## Architecture

```
Presentation (Next.js) → BFF (NestJS) → Integration adapters → External APIs
                                ↑
                         core/contracts (shared Zod schemas + types)
```

- **Presentation** only talks to the BFF, never directly to external APIs.
- **BFF** uses `DataSourceFactory` to select the right integration per request.
- **Integrations** implement contract interfaces, fetching in the backend's format and mapping to shared types.
- **Data sources can be mixed:** e.g. Commercetools for commerce + Algolia for product search + Contentful for CMS + mock for payment (see the `commercetools-algolia-set` data source in `DataSourceFactory`).

## Conventions

- **Integrations are self-contained** — a package under `integrations/<vendor>/<category>` imports no other integration (only its vendor's `integrations/<vendor>/core`), nothing from `apps/`, `demo/` or `test/`, and no relative path outside its folder. Code outside `integrations/` imports no integration package or vendor SDK (exceptions only in the `ALLOW` list of `eslint.boundaries.config.mjs`), and no relative import path goes through an `integrations/` folder. `npm run lint:boundaries` (part of `npm run lint`) enforces both. Code two vendors need goes into a `@core` package; code one vendor's parts share goes into `integrations/<vendor>/core`.
- **Feature-based directories** in `apps/presentation/features/` — one dir per domain (account, auth, cart, checkout, etc.). Internal imports are ESLint-enforced.
- **Contracts first** — define Zod schemas in `core/contracts` before implementing. Naming: `*Schema` for Zod, `*Response`/`*Request` for types.
- **UI components** use shadcn/ui patterns with `cva` for variants. Design tokens via Tailwind — no hardcoded color/spacing values.
- **BFF modules** follow: controller (routes) → service (business logic) → data source.
- **Translations** via `@core/i18n` with `next-intl`. JSON-based, supports multiple locales.
- **Pre-commit hooks** run lint + format via Husky/lint-staged.
- **Skills workflow** scales to the change: trivial work is done directly, small/low-risk work gets one approval, and non-trivial work uses a staged spec → plan → execute flow.
- **Never commit `.env` files or secrets** — use `.env.example` as a template only.

<!-- BEGIN:nextjs-agent-rules -->

### Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## Quality checklist (before committing)

1. `npm run check-types` — TypeScript passes
2. `npm run test` — all tests pass
3. `npm run lint` — no lint errors
4. `npm run format` — apply formatting fixes (writes changes)

## Environment

See `.env.example` for all required variables. Key groups: BFF URLs, Commercetools credentials, Contentful credentials, Algolia search credentials, JWT/CSRF security keys, and Next.js public vars. Never commit `.env` or real secrets — `.env.example` ships empty placeholders only.
