# @apps/bff

NestJS Backend for Frontend (BFF) for the SHOPin storefront accelerator. Exposes a unified REST API for products, cart, checkout, auth, content, and navigation; routes requests to [integrations](../../integrations) (e.g. commercetools, Contentful, mock) chosen per category in `config/shop/shopin.config.ts`.

## Overview

The BFF sits between the Next.js storefront and e-commerce/CMS back ends. It provides a single, consistent API regardless of which provider serves each category.

## Architecture

- **Ports** (`src/data-source/ports.module.ts`): at start-up the BFF reads `config/shop/shopin.config.ts`, reads the
  variables every chosen port declares (one error lists every missing one), builds a Nest module around each port
  and two injectables: `Services` (every service of the serving ports) and `ServingPorts` (from the kit: the
  serving port per category and per shop kind, for identity, customer lookups, guest session, enrichers and the
  shop's own features). Integrations nobody chose are never loaded.
- **Features** follow controller (routes, Zod validation with `ZodBody`) → service → `Services`
  (`this.services.productService.getProduct(…)`). Each controller declares the categories it reads with
  `@Reads('commerce', …)` (from `@core/integration-kit`); a feature is mounted only when they are served, and a
  controller without `@Reads` stops the boot. The shop's own feature modules (`features` in shopin.config.ts) are
  mounted the same way, after SHOPin's; every route of theirs that changes state needs the CSRF token (the BFF puts
  the check on their controllers and on those of every module they import). A field the shopper sets needs no
  route of the shop's: `PUT /bff/cart/fields` takes the fields of `contracts.cart` the shop lists in `cartFields`
  (none by default) and hands them to the commerce port's `setCartFields` with the cart of the sealed cookie
  ([a field the shopper sets](../../docs/extending.md#a-field-the-shopper-sets)).
- **Sessions** (`src/common/session/`): the encrypted session cookie (SameSite=Strict) holds the identity and its
  customer links; the identity is re-checked with the auth port every 5 minutes, the session dies after 30 idle
  days, and logout and password change revoke it server-side. The
  revocations live in `BFF_SESSION_REVOCATIONS_FILE`; several BFF instances share that file on shared storage: each
  reads it again when it changed (at most one `stat` a second) and writes under an exclusive lock file after merging
  it (a lock left by a dead instance is taken over by one instance only, by an atomic rename).
- **Cart, wishlist and guest-order cookies** hold the platform's id sealed with the session's keys (encrypted and
  signed, named for their cookie, expiring with it; a customer's also names the customer). A planted, altered,
  expired or foreign value reads as no cart. A guest reads only the order it placed in this browser, for an hour.
- **Sign-in and the cart**: the customer's active cart wins; without one the guest cart is kept, through the
  commerce port's `attachGuestCart` when it has one, and dropped when the platform refuses it.
- **Errors**: 501–504 reach the storefront as such with a generic message, anything unknown as 500
  ([errors a port throws](../../core/integration-kit/README.md#errors-a-port-throws)). With an integration that serves through
  others (`delegates`), a 502–504 also carries `vendor: { category, provider }` (ids), so the storefront can say which platform is down.
- `GET /bff/capabilities` reports the provider serving each category and kind, the categories no provider can
  serve, and the optional services the commerce provider offers (`services.wishlist`).
- `scripts/checks/bff-boot.mjs <dir>` boots a built BFF and checks `/bff/capabilities` against the config (CI runs
  it on the deployed shape; `--placeholders` fills the integrations' variables when no secrets are at hand).
- Mutating routes need the CSRF token: `GET /bff/csrf/token`, then send it as `X-CSRF-Token`.
- Routes are under `/bff`; Swagger is at `/api`.

Changes to an integration or to `@core/contracts` reach the BFF through their `dist`: run `npm run setup` (config
packages and everything they import) or `npx turbo run build --filter=<package>`; `npm run dev` restarts on them.

## Environment Variables

The BFF reads env from the **repo root `.env`**. Variables used by the BFF itself:

- **`FRONTEND_URL`** – the storefront's origin: CORS, sign-in callbacks, links to the storefront. Required in
  production (the BFF refuses to start without it); `http://localhost:3000` otherwise
- **`LOG_LEVEL`**, **`LOG_PRETTY_PRINT`** – Logging (via `@core/logger-config`)
- **`BFF_RATE_LIMIT_*`** – Rate limiting (optional)
- **`BFF_INTERNAL_SECRET`** – Shared secret for the presentation server's per-shopper calls (checkout guard); requests carrying it skip rate limiting. Set the same value for **both** the presentation and BFF apps; when unset, those calls are rate-limited by the Next.js server's IP and share one bucket
- **`BFF_SESSION_REVOCATIONS_FILE`** – where logouts and password changes are remembered (a path on persistent
  storage). Required in production. Several BFF instances use one file on shared storage (on Upsun a network
  storage mount); with NFS, keep attribute caching short (`actimeo`), since an instance sees another's revocation
  when its `stat` of the file changes (it looks at most once a second). The boot stops when the file's folder is
  not writable
- **`BFF_RATE_LIMIT_*`** – Rate limiting (optional)
- **`BFF_TRUST_PROXY`** – Behind a proxy: the number of proxies (`1`) or their addresses, so the rate limits count
  each client's address (`X-Forwarded-For`), not the proxy's. Off when unset
- **`JWT_ENCRYPTION_KEY`**, **`JWT_SIGNING_KEY`** – Token encryption/signing
- **`CSRF_TOKEN_ENCRYPTION_KEY`**, **`CSRF_TOKEN_SIGNING_KEY`** – CSRF token handling
- **`NEXT_DRAFT_MODE_SECRET`** – signs preview (draft mode) tokens, shared with the storefront

The secrets (`JWT_*`, `CSRF_*`, `SESSION_*`, `NEXT_DRAFT_MODE_SECRET`) are read once into a core-only map that core
code imports (never through dependency injection) and deleted from `process.env` before any port loads
(`src/common/env/env-file.ts`). Every other non-core variable leaves `process.env` too; integration variables
(`COMMERCETOOLS_*`, `CONTENTFUL_*`, `ALGOLIA_*`, …) reach only the port that declares them. For the full list, see
[root `.env.example`](../../.env.example).

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
