# AGENTS.md — E2E tests

Every Playwright test in this workspace follows the general rules below. The section
"The project's own way" says how this workspace applies them; it adds rules but never
contradicts the general ones.

<!-- Shared rules, kept verbatim from the source text. -->
<!-- prettier-ignore-start -->
# General rules for test code

Rules every Playwright test project follows, whatever its structure. They say what good test code
does, not how a project organises it: page objects, an actions/selectors/assertions split or areas
are all fine. Each project writes down its own way (section "The project's own way" below) and may add rules
there; it never contradicts these.
Words: **shared code** is whatever a project reuses between tests: blocks, page objects, actions,
helpers. A **spec** is a test file.

## 1. Selectors

- **Stable:** a selector survives a language switch, copy edits and a restyle. What is stable is the
  project's call: component classes of a shared theme, test ids, roles and labels on a single-language
  site.
- **Exactly one element:** checked when the selector is written, not found out when a test fails.
- **In shared code:** written once, under a name, never inline in a spec.
- **Never, in any project:** generated or hashed class names, a position (`nth()`, long child chains),
  XPath.

## 2. What a spec holds

- **Only the test:** the steps of its case as calls to shared code, and the checks of what the case
  expects.
- **No selectors, reusable actions or helpers defined in a spec.** The first time one is needed it
  goes into shared code, even when one test uses it so far: the next test finds it there.
- **One place for each thing:** look in the project's shared code first, and in any library it builds
  on. Reuse or extend it; never copy it.
- **Moving what a spec already holds:** whoever works on a spec moves a selector, action or helper
  defined in it into shared code, and names the move in the pull request. Only when it is clearly
  safe: the test does exactly the same afterwards, nothing else changes meaning, and nothing in the
  target clashes with it. In doubt, it stays and goes on a list for a person to decide.
- **The lowest level that fits:** code moves into the project's own shared code first. It goes into a
  library shared by several projects only when it clearly belongs to all of them, and only by that
  library's own rules.

## 3. Tests and cases

- **One test, one case.** A case has several tests only for real variants of its steps, such as
  staging and production, or a guest and a logged-in customer. A test never covers several cases; a
  flow two cases share goes into shared code, and each case gets its own test.
- **No test depends on another.** A test never relies on what another test did or left behind: an
  order, a changed address, a full cart. Each one runs alone, in any order, and when retried.
- **A shared starting point is allowed, not required.** For example, a session logged in once and
  reused by many tests (Playwright's saved `storageState`). Each project decides whether and how.

## 4. Waiting and checking

- **Wait for a state, not for time:** an element visible, a request finished, the URL changed.
- **A fixed wait** (`waitForTimeout`) is avoided, not forbidden: sometimes there is nothing to wait
  for, such as an animation or a third-party widget. It lives in shared code, never in a spec, with a
  one-line reason at the spot. Nobody adds one without trying a state first, and a new one is named in
  the pull request.
- **Checks retry on their own:** Playwright's `expect(locator)` checks, which retry until they pass or
  time out, rather than reading a value once and comparing it.
- **What every page needs** (the page ready, a cookie banner, a loader gone) lives in shared code, not
  repeated in specs.
- **Timeouts** come from the project's config. A test sets its own only with a one-line reason.

## 5. Test data

- **Not hard-coded in specs:** accounts, products, addresses, codes and URLs come from one place in
  the project, so a changed product touches one file.
- **Credentials by kind:** platform API keys (Magento, Shopware and the like) never live in files,
  only in the environment or CI variables. Logins of test accounts may live in files when the project
  allows it; committing them is avoided, not forbidden.
- **Fresh data** wherever a test creates something: a new e-mail address, a unique name, so parallel
  runs and retries do not collide.
- **On production, never submit:** no purchase, sign-up or form is sent unless the case and the
  project explicitly allow it.

## 6. Navigation

- **A plain `page.goto` is fine** when opening the page is all a step needs.
- **When more has to happen** (a cookie banner, waiting for the page, choosing a store), it goes into
  shared code named for what it does, such as `openAndAcceptCookies()`, not into something called
  `goto`.
- **Never replace or wrap `page.goto` itself,** for example in a fixture that also accepts the banner.
  Code that calls it would get more than it asked for: a measurement of the server's first response
  would then wait for a banner on every run, or fail when none comes.

## 7. Spec files: titles, tags, annotations

What every test exposes through Playwright's own metadata, so runs, reports and the test-case tool
see the same thing. It says nothing about how the project organises its code.

**Title**

- With a case: `<case ID>: <case title copied exactly from the test-case tool>`, for example
  `'C1136163: Add a product to the Cart'`. The ID starts the title, so it can be matched with
  `/^(C\d+): /`; the rest is not split on `:`, because case titles contain colons.
- Without a case: a plain, descriptive title. When a case is created later, its ID goes in front.

**Tags** go in the test's details, never in the title. A describe carries its tags the same way.

```ts
test.describe('Cart', { tag: '@cart' }, () => {
  test('C1136163: Add a product to the Cart', { tag: ['@desktop', '@mobile', '@priority-high', '@smoke', '@unverified'] }, async ({ page }) => {
    // the case's steps, as calls to shared code
  })
})
```

- **Device:** `@desktop`, `@mobile`, from the case's devices. A case with no device gets `@desktop
  @no-device-set`.
- **Priority:** `@priority-critical`, `@priority-high`, `@priority-medium`, `@priority-low`,
  `@priority-none`, from the case's priority.
- Without a case, a person sets the device and priority tags; they mean the same.
- **`@unverified`:** on every new test, with or without a case, until someone has watched it run and
  confirmed it does what its case (or its title and steps) says. It is removed in its own pull request.
- **Run and selection:** `@smoke`, `@full-regression` and the project's own tags (`@slow`, an area
  such as `@checkout`) choose what a run takes; CI selects by them. A person sets them; no tool drops
  them.

**Annotations**

- The case version the test was written or last checked against, when the test-case tool has
  versions (TestRail: `{ type: 'testrail_case_version', description: '<version>' }`), so a changed
  case shows.
- `issue`: the URL of a known defect the test runs into.

**Done:** a test is done after repeated green runs (3 to 5), with every retry reported, and a re-read
of the case to confirm the test does what it says.

<!-- prettier-ignore-end -->

## The project's own way

This workspace holds two suites (see [README.md](README.md) for running them):

- **Journeys** (`journeys/`, `playwright.journeys.config.ts`): shopping journeys against the real
  stack (presentation → BFF → commercetools). Follows every rule above.
- **Platform** (`specs/`, `playwright.config.ts`): variant routing, draft preview, ISR and locales
  against the recording mock BFF. Predates these rules; see "Open deviations" below.

### Shared code

Journey shared code lives in `journeys/support/`; specs import from it and define nothing of their
own.

| File           | Holds                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `selectors.ts` | Every locator, as a named function grouped by page area (`header`, `pdp`, `cartPage`, `checkout`, …).    |
| `actions.ts`   | Multi-step flows built from selectors, such as `addTestProductToCart()` or `checkoutAsGuestToReview()`.  |
| `test-data.ts` | Routes, per-locale catalog entries, addresses and payment labels, and `uniqueEmail()`.                   |
| `i18n.ts`      | `t()` / `tPattern()` over `core/i18n`, `LOCALE` (from `E2E_LOCALE`), `localePath()` and `countryName()`. |

Platform shared code is `helpers/`, `fixtures.ts` and `mock-bff/fixtures.ts`.

### Selectors

The storefront runs in English and German, so a selector never contains English copy:

- **Roles with translated names:** `getByRole(role, { name: t('<core/i18n key>') })`. `t()` reads the
  same `core/i18n/<locale>.json` the app renders, so copy edits and a language switch do not break a
  selector, and a restyle does not touch roles. `tPattern()` builds a pattern when part of the text is
  dynamic.
- **Text from outside `core/i18n`** (product names from commercetools, payment labels from the mock
  payment service) comes from `test-data.ts`, per locale. Copy on untranslated demo pages is written
  in `selectors.ts` with a comment saying so.
- **Ids and attributes** (`#billing-address-form`, `[aria-live="polite"]`) only where no role and
  name identify the element, with a comment when the reason is not obvious.
- **No `data-testid` so far.** If one is needed, it is added to the app component and used through a
  named selector.
- **Never** Tailwind utility classes or positions (`first()`, `nth()`, `last()`). When several
  elements match, scope the locator (`pdp.buyBox()`, `getByRole('main')`) or pick data that matches
  exactly one, such as a search term with a single result.
- **Proof:** `E2E_LOCALE=de-DE npm run e2e:journeys` runs the same specs in German.

### Starting point

- Every test starts in a fresh browser context: a new anonymous session with an empty cart and
  wishlist. Nothing carries over between tests.
- The demo disclaimer is pre-acknowledged through `storageState` in the config, so no test opens or
  closes it.
- A test builds its own state through actions (`addTestProductToCart()`,
  `saveTestProductToWishlist()`). There is no saved logged-in session yet; add one with
  `storageState` once account tests exist.

### Test data

- `test-data.ts` is the one place for routes, products, search terms, addresses and payment labels.
  A changed product touches that file only.
- Commercetools and other platform credentials come only from the root `.env` or CI variables.
- Checkout tests create real guest orders in the commercetools project, with a fresh
  `e2e+<timestamp>@example.com` address each time. Anonymous carts and wishlists are left behind.
- **Never against production:** `@checkout` specs submit orders. When `BASE_URL` points at
  production, run with `--grep-invert @checkout`.

### Tags, timeouts and waits

- **Areas:** `@browse`, `@search`, `@cart`, `@checkout`, `@wishlist` on the describe.
  `@mock-payment` marks specs that drive the demo payment provider.
- **Per test:** device, priority and `@unverified`, as in section 7. No test-case tool IDs exist yet.
- **Timeouts:** set in `playwright.journeys.config.ts`: test 60 s, `expect` 10 s, action 15 s.
- **Fixed waits:** none in the journey suite.
- **Known defects:** `test.fail(true, '<reason>')` plus an `issue` annotation once the defect has a
  URL.

### Open deviations (platform suite)

Found when these rules were adopted. They are left for a person to decide (section 2):

- Locators are written inline in all 9 specs instead of shared code.
- Paths are passed straight to `page.goto` in 7 specs instead of coming from one data file.
- 6 position-based locators (`first()`, `nth()`, `last()`) in specs.
- `helpers/index.ts` `waitForBffRequest()` polls with `waitForTimeout(100)` and has no reason
  comment; `expect.poll()` would wait for the state instead.
- No test has device, priority or `@unverified` tags.
- The `console` listener in `fixtures.ts` returns early for translation errors but does nothing for
  any other message, so it filters nothing.
