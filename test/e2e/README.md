# E2E Test Suite

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
