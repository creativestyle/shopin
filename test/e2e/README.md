# E2E Test Suite

Two Playwright suites live here:

| Suite                  | Config                          | Backend                  | Covers                                         |
| ---------------------- | ------------------------------- | ------------------------ | ---------------------------------------------- |
| Platform (`specs/`)    | `playwright.config.ts`          | Recording mock BFF       | Variant routing, draft preview, ISR, locales   |
| Journeys (`journeys/`) | `playwright.journeys.config.ts` | Real BFF + commercetools | Browse, search, cart, guest checkout, wishlist |

Install the browser once: `npx playwright install chromium` (CI: `npx playwright install --with-deps chromium`).

## Journey suite

Runs against the real stack on the default dev ports (presentation `:3000`, BFF `:4000`) using the commercetools credentials from the root `.env`.

```bash
# from test/e2e
npm run e2e:journeys           # headless
npm run e2e:journeys:headed    # visible browser
npm run e2e:journeys:ui        # Playwright interactive UI
npx playwright test -c playwright.journeys.config.ts --grep-invert @mock-payment
BASE_URL=https://staging.example.com npm run e2e:journeys
```

- **Servers:** already running `npm run dev` / `start:local` servers are reused. Otherwise (and always in CI) Playwright runs `start:local` for the BFF and presentation app. `BASE_URL` targets a deployed environment and starts nothing.
- **Rate limiting:** the BFF allows 5 req/min on auth, payment and order routes. Set `BFF_RATE_LIMIT_ENABLED=false` in `.env` when reusing your own servers; Playwright sets it when it starts the BFF.
- **Test data:** catalog entry points (category, multi-variant product, search term, US guest address) live in `journeys/support/catalog.ts`. Products inside the category are discovered at runtime.
- **Side effects:** checkout specs place real guest orders in commercetools with `e2e+<timestamp>@example.com` emails.
- **`@mock-payment`:** these specs drive the demo payment provider (`/demo/mocked-payment-step`). Exclude them once a real PSP replaces it.
- **Shared build:** `start:local` rebuilds `apps/presentation/.next`, which overwrites the platform suite's `build:e2e` output. Run `build:e2e` again before switching back.

## Platform suite

Playwright tests covering variant routing, draft/preview mode, ISR caching, and locale handling. Tests run against a real built Next.js server (not `next dev`) so ISR and cache behaviour is authentic.

## Setup

Build the app once before the first run (or after code changes):

```bash
# from apps/presentation
npm run build:e2e
```

## Running

```bash
# from apps/presentation
npm run start:e2e

# from test/e2e
npm run e2e           # headless
npm run e2e:headed    # visible browser
npm run e2e:ui        # Playwright interactive UI
npm run report        # open last HTML report
```

## Why serial, not parallel

Specs run with `workers: 1`. The mock BFF (which records all outgoing BFF calls for assertion) has a single shared request log. Parallel workers would race on log resets and produce false results.

## Why build:e2e instead of next dev

ISR caching only works in a production build. Running against `next dev` would make all ISR tests meaningless.

The built server is **reused across runs** (`reuseExistingServer: true`). `globalSetup` calls `/api/e2e/revalidate` before each run, which hard-expires all Data Cache entries (both in-memory and on-disk) so tests always start cold.
