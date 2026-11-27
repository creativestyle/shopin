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

## Demo suite

The specs that switch providers (`demo/e2e/specs`: variant headers, per-variant ISR, locale switch on an alt
catalog, malformed provider cookies) only make sense with the demo's provider switch, so they run on the demo config:

```bash
npm run use demo            # repository root: the demo config, then setup
npm run build:e2e           # apps/presentation (stop a running start:e2e first: it is reused)
npm run e2e:demo            # test/e2e or the root: the shop's specs and the demo's (project "demo")
npm run use demo off        # back to the shop config, then npm run build:e2e again
```

`npm run e2e:demo` refuses to start, with these steps, while the demo is off. Extra arguments go to Playwright
(`npm run e2e:demo -- --project=demo`).

## Why serial, not parallel

Specs run with `workers: 1`. The mock BFF (which records all outgoing BFF calls for assertion) has a single shared request log. Parallel workers would race on log resets and produce false results.

## Why build:e2e instead of next dev

ISR caching only works in a production build. Running against `next dev` would make all ISR tests meaningless.

The built server is **reused across runs** (`reuseExistingServer: true`). `globalSetup` calls `/api/e2e/revalidate` before each run, which hard-expires all Data Cache entries (both in-memory and on-disk) so tests always start cold.
