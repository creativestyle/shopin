# E2E Test Suite

Test code here follows the rules in [AGENTS.md](AGENTS.md): read them before adding or changing a test.

Playwright tests against real production builds (not `next dev`), so ISR and cache behaviour is authentic. Two kinds of specs live here:

| Specs                                       | Run against                                                                | Covers                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Platform (`specs/`)                         | Storefront `:3100` → recording mock BFF `:3001`                            | Variant routing, draft preview, ISR, locales: asserts the exact BFF requests |
| Journeys (`journeys/`) and smoke (`smoke/`) | Journey stack: storefront `:3200` → fault proxy `:4100` → real BFF `:4101` | Shopper journeys, one route check per route group, the fault proxy           |

## Setup

Node 24 (see `.nvmrc`). Once, and again after code changes:

```bash
# from test/e2e
npm run build                       # BFF + storefront build:e2e (uses apps/presentation/.env.e2e)
npx playwright install chromium     # CI: npx playwright install --with-deps chromium
```

## Running

```bash
# from the repo root or test/e2e
npm run e2e                                    # every project, mock for every category
npm run e2e -- --project desktop               # Playwright args pass through
npm run e2e -- commerce=commercetools          # another integration (see below)

# from test/e2e
npm run e2e:headed                             # visible browser
npm run e2e:ui                                 # Playwright UI mode
npm run stack                                  # the journey stack alone (reused by later runs)
npm run report                                 # open the last HTML report
```

Playwright starts everything it needs (recording mock BFF, both storefronts, the journey stack) and reuses servers that already run locally. In CI it always starts them fresh.

### Projects

| Project                            | Specs                 | Notes                                                                                  |
| ---------------------------------- | --------------------- | -------------------------------------------------------------------------------------- |
| `platform`, `platform-crossorigin` | `specs/`              | One worker: the mock BFF has a single shared request log                               |
| `desktop`                          | `journeys/`, `smoke/` | Desktop Chrome; runs tests tagged `@desktop`                                           |
| `phone`                            | `journeys/`, `smoke/` | Pixel 7 on Chromium; runs tests tagged `@mobile`                                       |
| `faults`                           | `**/*.fault.spec.ts`  | One worker, after every other project: fault rules and cache expiry reach every server |

Both storefronts run from the same `build:e2e` output and share its on-disk cache. The browser's BFF URL is baked into that build and points at the journey fault proxy, so browser-side BFF calls from the platform storefront (`:3100`) never reach the recording mock BFF (the real BFF also refuses them by CORS). Platform specs therefore assert only the BFF calls the storefront server makes.

### Integrations

Every category is served by the mock by default. Choose another integration per category with `category=integration`:

```bash
npm run e2e -- commerce=commercetools                   # commercetools-set
npm run e2e -- commerce=commercetools search=algolia    # commercetools-algolia-set
```

Today the BFF offers fixed data sources, so a choice maps to one of them; an unsupported combination is rejected with the list of supported ones. Each run prints which integration served each category. Credentials come from the root `.env`; where it has none, the stack sets dummy values pointing at a dead local port, so any call to an outside service fails loudly.

Tests tagged `@mock-only` cover steps only the mock can serve. On another integration they are skipped with the reason, so the report lists them as not run.

### Against a deployed stack

Journey and smoke specs read only two URLs. Set both and no journey stack is started:

```bash
E2E_STOREFRONT_URL=https://staging.example.com E2E_BFF_URL=https://staging-bff.example.com/bff npm run e2e -- --project desktop
```

Fault specs need the local proxy and are skipped there.

## Where things live

| What                                                   | Where                                                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Fixtures (`test`, `signedInTest`, `faults`, `account`) | `journeys/support/fixtures.ts`                                                                       |
| Named locators and page steps                          | `journeys/support/pages.ts` (add selectors here, not in specs)                                       |
| Translated text for locators                           | `journeys/support/i18n.ts`: `t()` / `tPattern()` over `core/i18n`; `E2E_LOCALE=de-DE` runs in German |
| Test data per integration                              | `journeys/support/test-data/` (`mock.ts`, `commercetools.ts`), plus `ROUTES` and `uniqueEmail()`     |
| BFF calls for test setup                               | `journeys/support/bff-api.ts`                                                                        |
| Fault proxy and its control                            | `fault-proxy/server.ts`, `journeys/support/faults.ts`                                                |
| Stack and integration choice                           | `stack/start-stack.ts`, `stack/integrations.ts`                                                      |
| Platform helpers and mock BFF fixtures                 | `helpers/`, `fixtures.ts`, `mock-bff/`                                                               |
| CI job summary reporter                                | `reporters/ci-summary.ts`                                                                            |

## Writing journey specs

- Import `test` / `signedInTest` and `expect` from `journeys/support/fixtures`, never from `@playwright/test`.
- Every test starts in its own browser context with its own guest cart; consent banner and demo notice are already answered.
- `signedInTest` starts signed in as an account only its worker uses (registered and confirmed through the BFF), with its cart emptied.
- Wait for a state (URL, count, total, visible element), never for a fixed time.
- Find test data through the storefront or the test-data file of the integration, never through ids only the mock knows.
- On the local mock stack, any browser request to an outside host fails the test.
- Fault cases go in `*.fault.spec.ts` and use the `faults` fixture: `faults.fail('cart/items', { status: 503 })`, `faults.hang('order')`, `faults.delay('cart', 2000)`. Rules are reset after each test.

## CI

The `e2e` job in `.github/workflows/ci.yml` runs on every pull request and push to `main`: builds, installs Chromium only, runs `npm run e2e` on the mock, and uploads the HTML report and traces (also on failure). A test that passes only on retry fails the job (`failOnFlakyTests`) and is listed as flaky in the job summary.

## Why build:e2e instead of next dev

ISR caching only works in a production build. Running against `next dev` would make all ISR tests meaningless.

Built servers are **reused across local runs**. `globalSetup` calls `/api/e2e/revalidate` before each run, which hard-expires all Data Cache entries (both in-memory and on-disk) so platform specs always start cold.
