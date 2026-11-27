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
  integration-kit/  # defineIntegration, port, defineConfig (the author API), the commerce contract suite (./testing)
  i18n/             # next-intl translation files and config
  eslint-config/    # Shared ESLint rules
  prettier-config/  # Shared Prettier config
  typescript-config/ # Shared tsconfig bases
  logger-config/    # Pino logger configuration
  draft-token/      # Draft mode utilities
config/           # @config/* is SHOPin's own; @shopin/* (shop, storefront, tools) is the shop's, edited by the shop and setup
  constants/        # Shared primitive constants and derived types
  shop/             # The shop's BFF side: shopin.config.ts names the integration serving each category
  storefront/       # The shop's storefront side: storefront.mts (slots, pages), storefront-data.json (generated)
  tools/            # Command-line tools of the configured integrations (Contentful migrations, Algolia sync)
integrations/       # One package per vendor and category: integrations/<vendor>/<category> (@integrations/<vendor>-<category>)
  commercetools/core/       # What the commercetools parts share: server client, env, error meaning (no category)
  commercetools/commerce/   # Catalog, cart, checkout, customers, orders; its product search serves search
  commercetools/auth/       # Sign-in against the project's customers (pairs with commercetools commerce)
  algolia/search/           # Product search (Algolia)
  algolia/sync/             # Pushes commercetools products into an Algolia index (a tool, not a port)
  contentful/cms/           # CMS content (pages, layout) via GraphQL
  contentful/migration/     # CMS-as-code content model migrations (a tool)
  mock/commerce/            # Commerce from in-code fixtures, no account needed
  mock/auth/                # Mock identity provider (stand-in for an external IdP)
  mock/cms/                 # CMS pages, header and footer from fixtures
  mock/psp/                 # Mock payment provider and the demo payment page it redirects to
demo/               # The SHOPin demo (npm run use demo; npm run use demo remove deletes it)
  shop/             # The demo's shop config (as config/shop), behind the provider switch
  storefront/       # The demo's storefront slots: /setup page, demo notice, tracking tags
  provider-switch/  # Per-request provider per category (X-<Category>-Provider headers); demo and dev only
  data-source-selector/ # The /setup page component
  demo-disclaimer/  # Sandbox notice dialog
  mock-tracking-tags/ # Sample tags behind cookie consent
  switch-scenarios/ # Tests of the demo switch in the real BFF
```

## Key commands

| Command                      | What it does                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `npm run setup`              | Create `.env`, install and build what `config/shop` names                      |
| `npm run use`                | Switch, add or remove (`off`) an integration in the shop config, then setup    |
| `npm run config:check`       | Fail when `config/` and the lockfile are out of step with the shop config (CI) |
| `npm run dev`                | Start all dev servers                                                          |
| `npm run build`              | Production build                                                               |
| `npm run test`               | Run all tests                                                                  |
| `npm run lint`               | ESLint across all packages                                                     |
| `npm run lint:boundaries`    | Integration import boundaries across the repo (part of `npm run lint`)         |
| `npm run format`             | Prettier across all packages                                                   |
| `npm run format:check`       | Prettier check (non-mutating, CI gate)                                         |
| `npm run check-types`        | TypeScript type checking                                                       |
| `npm run check-dependencies` | `npm audit --audit-level=critical`                                             |
| `npm run start:local`        | Run production builds locally (build first)                                    |

Dev server ports: presentation :3000, BFF :4000 (Swagger at /bff/api), Storybook :6006, Typedoc :5000.

## Architecture

```
Presentation (Next.js) → BFF (NestJS) → Integration adapters → External APIs
                                ↑
                         core/contracts (shared Zod schemas + types)
```

- **Presentation** only talks to the BFF, never directly to external APIs.
- **Shop config** `config/shop/shopin.config.ts` names one integration per category (`commerce`, `search`, `cms`, `psp`, `auth`). `npm run setup` installs only what it names; `npm run use <category> <id|off>` changes it.
- **BFF** loads the configured ports once at start, checks each integration's credentials, and serves a category whose check failed as unavailable (`/bff/capabilities`) instead of failing.
- **Integrations** implement contract interfaces, fetching in the backend's format and mapping to shared types.
- **Integrations can be mixed:** e.g. commercetools for commerce and sign-in + Algolia for search + Contentful for CMS + mock for payment. Without a search integration, the commerce integration's product search serves search.
- **Extending** (own contract fields, cart fields, BFF features, kinds of port, pages): `docs/extending.md`.

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
