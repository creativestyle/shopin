# Promo Code — Implementation Plan & Progress

Feature: shopper applies a promo/discount code in the cart and sees the discount reflected in the order total.

**Status: implemented across all layers. One item outstanding — e2e coverage (step 9), see below.**

Verification: `turbo run check-types lint test` — 58 tasks pass, 630 unit tests pass (618 presentation incl. 14 new, 12 BFF). The 2 remaining lint warnings are pre-existing in `configurable-options/selectors/`, untouched by this work.

### Acceptance criteria

| #   | AC                              | Status                                                 |
| --- | ------------------------------- | ------------------------------------------------------ |
| 1   | Input + Apply button            | ✅                                                     |
| 2   | Discount shown, total decreases | ✅ discount row added to `CartSummary`                 |
| 3   | Applied code displayed          | ✅ needs CT expansion, see below                       |
| 4   | Error for invalid/expired       | ✅ four distinct reasons                               |
| 5   | Remove applied code             | ✅                                                     |
| 6   | One code at a time              | ✅ decided + enforced in UI and BFF                    |
| 7   | Active language                 | ✅                                                     |
| 8   | No full page reload             | ✅ TanStack cache updated in place                     |
| 9   | Visible label                   | ✅ visible `Label` above the input, tied by `htmlFor`  |
| 10  | Announced to screen readers     | ✅ persistent `role="status"` / `role="alert"` regions |
| 11  | Keyboard-operable               | ✅ native form, submits on Enter                       |
| 12  | All strings translated          | ✅ en-US + de-DE                                       |

### Pre-existing gap closed along the way

**`discountAmount` was populated but never rendered.** The mapper set it and `cart.summary.discount` existed in i18n, but nothing used the key — `CartSummary` rendered subtotal, shipping, total only. The discount row added for AC2 fixes this for cart-level discounts from any source, not just promo codes.

> `cart.summary.tax` is still defined and unused. Out of scope here, but the same row block is where it would go.

---

## Original state (for reference)

| Layer            | File                                                                                                             | State before                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| UI component     | [promo-code-section.tsx](../apps/presentation/features/cart/components/promo-code-section.tsx)                   | Accordion stub, body is `TODO` + hardcoded English `"Promo code input coming soon"` |
| Cart summary     | [cart-summary.tsx](../apps/presentation/features/cart/components/cart-summary.tsx)                               | Renders the stub; no discount row at all                                            |
| Client service   | [cart-bff-service.ts](../apps/presentation/features/cart/lib/cart-bff-service.ts)                                | No apply/remove methods                                                             |
| Hook             | [features/cart/hooks/](../apps/presentation/features/cart/hooks/)                                                | No promo hook                                                                       |
| BFF controller   | [cart.controller.ts](../apps/bff/src/features/cart/cart.controller.ts)                                           | No discount-code route                                                              |
| BFF service      | [cart.service.ts](../apps/bff/src/features/cart/cart.service.ts)                                                 | No discount-code method                                                             |
| Port interface   | [data-source-interfaces.ts](../core/contracts/src/core/data-source-interfaces.ts)                                | `CartService` has no discount-code methods                                          |
| CT service       | [commercetools-api/src/services/cart.service.ts](../integrations/commercetools-api/src/services/cart.service.ts) | No `addDiscountCode` / `removeDiscountCode`                                         |
| CT action schema | [cart-update-action.ts](../integrations/commercetools-api/src/schemas/cart-update-action.ts)                     | Discriminated union lacks both actions                                              |
| CT cart schema   | [schemas/cart.ts](../integrations/commercetools-api/src/schemas/cart.ts)                                         | No `discountCodes` field — Zod strips it from the CT response                       |
| Contract         | [contracts/src/cart/cart.ts](../core/contracts/src/cart/cart.ts)                                                 | Has `discountAmount`, no `discountCodes`                                            |
| Mapper           | [mappers/cart.ts](../integrations/commercetools-api/src/mappers/cart.ts)                                         | Maps `discountOnTotalPrice` → `discountAmount`; no code mapping                     |
| Mock API         | [mock-api/src/services/cart.service.ts](../integrations/mock-api/src/services/cart.service.ts)                   | No discount-code methods                                                            |
| i18n             | [en-US.json](../core/i18n/en-US.json)                                                                            | Only `cart.summary.promoCode` exists                                                |

2. **`summary.tax` is likewise defined but unused.** Out of scope, but the same row-rendering change touches it.

---

## Blocking decision

**AC6 — one active code or several?** This decides the contract shape and must be settled before step 2.

- Commercetools supports multiple codes natively; "one at a time" would be an app-level constraint we enforce (remove existing before adding).
- Single → response can carry one object; Apply replaces.
- Multiple → response carries an array; Apply appends, each needs its own Remove control.

**Recommendation:** model the contract as an **array** either way, and enforce single-code in the BFF if that's the product call. Cheap now, avoids a breaking contract change later.

> **Decision (2026-08-13): single code.** One promo code active at a time.
>
> Implemented as:
>
> - Contract still carries `discountCodes` as an **array** — avoids a breaking change if this is ever relaxed.
> - **UI** enforces it naturally: once a code is applied, the input and Apply button are replaced by the applied-code row with its Remove button. There is no second input to type into.
> - **BFF** guards independently (the endpoint is callable directly): applying a code while one is active returns `alreadyApplied` rather than silently replacing. Rejecting beats auto-replace here — a shopper who mistypes a second code should not lose the working discount they already had.

---

## Plan

### 1. Product decision (AC6)

- [x] Confirm single vs. multiple codes; record the answer above.

### 2. Contract — `core/contracts`

- [x] Add `DiscountCodeSchema` to [cart.ts](../core/contracts/src/cart/cart.ts): `{ id: string, code: string, state?: string }`.
  - `id` is required — CT's `removeDiscountCode` action takes the discount-code **reference id**, not the code string.
- [x] Add `discountCodes: z.array(DiscountCodeSchema).optional()` to `CartResponseSchema`.
- [x] Add `ApplyDiscountCodeRequestSchema` (`{ code: string }`) and `RemoveDiscountCodeRequestSchema` (`{ discountCodeId: string }`) + inferred types.
- [x] Mirror `discountCodes` on `OrderResponse` in [order/order.ts](../core/contracts/src/order/order.ts) so the confirmation page can show it.

### 3. Commercetools integration

- [x] Add `AddDiscountCodeActionSchema` (`action: 'addDiscountCode'`, `code: string`) and `RemoveDiscountCodeActionSchema` (`action: 'removeDiscountCode'`, `discountCode: { typeId: 'discount-code', id }`) to [cart-update-action.ts](../integrations/commercetools-api/src/schemas/cart-update-action.ts); register both in `CartUpdateActionSchema`.
- [x] Add `discountCodes` to `CartApiResponseSchema` in [schemas/cart.ts](../integrations/commercetools-api/src/schemas/cart.ts) — array of `{ discountCode: { typeId, id, obj?: { code } }, state }`.
- [x] **Add `discountCodes[*].discountCode` to `CART_EXPAND`** in [cart.service.ts:27](../integrations/commercetools-api/src/services/cart.service.ts#L27). Without expansion CT returns only a reference id, so AC3 (show which code is active) cannot be satisfied.
- [x] Add `addDiscountCode(cartId, code)` and `removeDiscountCode(cartId, discountCodeId)` using the existing `updateCartWithAction` helper.
- [x] Map `discountCodes` → `CartResponse` in [mappers/cart.ts](../integrations/commercetools-api/src/mappers/cart.ts), reading `code` from the expanded `obj`.
- [x] Map CT failures to a stable error shape — see below. AC4 wants "invalid" vs. "expired" distinguished, so a plain 400 is not enough.

#### CT rejects a code in **two different ways** (verified against `@commercetools/platform-sdk` types)

This is the subtlest part of the feature. A code can fail without CT ever returning an error.

**1. Error path** — `DiscountCodeNonApplicableError` (400). Its `reason` field is documented as only two values (`error.d.ts:297`):

- `DoesNotExist` → `invalid`
- `TimeRangeNonApplicable` → `expired`

**2. Success-but-not-applied path** — CT returns **200**, the code is attached to the cart, but `DiscountCodeInfo.state` is not `MatchesCart` (`cart.d.ts:1005`). The discount is simply not granted. States (`cart.d.ts:1036`):

| `state`                                | Maps to         |
| -------------------------------------- | --------------- |
| `MatchesCart`                          | success         |
| `NotValid`                             | `expired`       |
| `NotActive`                            | `invalid`       |
| `DoesNotMatchCart`                     | `notApplicable` |
| `MaxApplicationReached`                | `notApplicable` |
| `ApplicationStoppedByPreviousDiscount` | `notApplicable` |
| `ApplicationStoppedByGroupBestDeal`    | `notApplicable` |

Handling path 2 is **required**, not optional: without it a shopper who enters a non-matching code sees "applied" and no discount, and the dud code stays attached to the cart. On a non-`MatchesCart` state the service must **roll the code back off the cart** and throw, so the shopper gets AC4's error and the cart is left clean.

### 4. Port interface + mock parity

- [x] Add both methods to the `CartService` interface at [data-source-interfaces.ts:138](../core/contracts/src/core/data-source-interfaces.ts#L138).
- [x] Implement in [mock-api/src/services/cart.service.ts](../integrations/mock-api/src/services/cart.service.ts) — a small fixture table of valid / expired / unknown codes so all AC4 paths are exercisable in local dev and e2e.

### 5. BFF

- [x] `cart.service.ts`: `applyDiscountCode(request)` / `removeDiscountCode(request)`, resolving cart id via the existing `getOrCreateCartId()`.
- [x] `cart.controller.ts`: `@Post('discount-code')` and `@Delete('discount-code')`. Follow the existing route conventions — `@UseCsrfGuard()`, `@ZodBody(...)`, `CartResponseSchema.strip().parse(...)`, Swagger decorators.
- [x] Return a discriminating error code/reason in the 400 body so the client can pick a specific message.
- [x] If AC6 = single code: reject or auto-replace when a code is already applied. Decide which and document it.

### 6. Presentation — data layer

- [x] `cart-bff-service.ts`: `applyDiscountCode` / `removeDiscountCode` following the existing `addItem`/`removeItem` shape. CSRF is handled by `BaseService`, no per-call work needed.
- [x] Add mutation keys to [cart-keys.ts](../apps/presentation/features/cart/cart-keys.ts).
- [x] New hook `use-promo-code.ts` modelled on [use-update-cart-item.ts](../apps/presentation/features/cart/hooks/use-update-cart-item.ts) — `useBffClientMutation` + `queryClient.setQueryData(cartKeys.all, data)` on success. Satisfies AC8 (no reload).
- [x] Map the BFF error reason → translation key.
  - Built differently than planned. `error-translation-keys.ts` was not extended: `BaseService` throws `new Error("400 Bad Request")` and **discards the response body**, so a reason-keyed map over status codes could never see the reason. Instead [promo-code-error.ts](../apps/presentation/features/cart/lib/promo-code-error.ts) uses the service's `onError` hook to parse the body and throw a `PromoCodeError` carrying a validated reason; the hook resolves it to `errors.{reason}`, falling back to `errors.generic`.

### 7. Presentation — UI

- [x] Rebuild [promo-code-section.tsx](../apps/presentation/features/cart/components/promo-code-section.tsx): form with a real `<label htmlFor>` (AC9 — not placeholder-as-label), text input, Apply submit button.
- [x] Submit on Enter as well as click (AC11).
- [x] Applied-code state: show code + a Remove button (AC3, AC5).
  - The **amount** is shown in the summary's discount row rather than repeated next to the code, since only one code can be active and its value is the whole cart discount.
- [x] Disable controls while pending.
  - No spinner and no explicit focus management were added. Nothing unmounts on error — the form and the focused Apply button stay in place — so focus is never lost and the `role="alert"` announces regardless. Worth a design pass if a pending indicator is wanted.
- [x] `role="status"` (success) and `role="alert"` (error) live regions for AC10. Render the region on mount and change only its text content — a node inserted at the same time as its message is unreliably announced.
- [x] Add the discount row to [cart-summary.tsx](../apps/presentation/features/cart/components/cart-summary.tsx) using the existing `PriceRow` + `cart.summary.discount`, shown when `discountAmount` is non-zero (AC2). Closes the pre-existing gap above.
- [x] Keep the accordion collapsed by default; confirm it auto-expands when a code is already applied.

### 8. i18n (AC7, AC12)

Add under `cart` in **both** [en-US.json](../core/i18n/en-US.json) and [de-DE.json](../core/i18n/de-DE.json) — no hardcoded strings anywhere:

- [x] `promoCode.label`, `promoCode.placeholder`, `promoCode.apply`, `promoCode.remove`, `promoCode.removeAriaLabel`
- [x] `promoCode.applied` (with `{code}` param)
- [x] `promoCode.success`
- [x] `promoCode.errors.invalid`, `.expired`, `.notApplicable`, `.alreadyApplied`, `.generic`
- [ ] **Verify German copy with the content owner.** German strings are written but not reviewed by a native/content owner — the one i18n item still open.

### 9. Tests

- [x] Unit: error-reason parsing — [promo-code-error.test.ts](../apps/presentation/features/cart/lib/__tests__/promo-code-error.test.ts), 7 cases covering each reason plus unrecognised / missing / non-JSON bodies.
- [x] Component: [promo-code-section.test.tsx](../apps/presentation/features/cart/components/__tests__/promo-code-section.test.tsx), 7 cases — labelled input, trimmed submit, Enter-to-submit, disabled-when-empty, applied state swaps the input for the remove control, and both announcement regions.
- [ ] ~~Unit: CT mapper~~ — **not done.** The `integrations/*` packages have **no test runner at all** (no `test` script in any of their `package.json`). `mapDiscountCodes` is covered indirectly by typecheck only. Adding Jest to the CT package is the prerequisite.
- [ ] **e2e spec — not done.** [test/e2e/specs/](../test/e2e/specs/) contains only `draft-preview`, `isr`, `routing`, `variants`; **there is no cart e2e coverage of any kind**, and the mock BFF in [test/e2e/mock-bff/](../test/e2e/mock-bff/) has no cart handlers. Writing this spec means first building cart e2e infrastructure — meaningfully larger than the feature and a separate piece of work. The mock fixtures in step 4 (`SAVE10`, `SAVE5`, `EXPIRED`, `NOTYET`) exist and are ready to drive it.

---

## Remaining work

1. **e2e coverage** — blocked on cart e2e infrastructure that does not exist yet (see step 9).
2. **CT mapper unit test** — blocked on there being no test runner in `integrations/*`.
3. **German copy review** by the content owner.
4. **Verify against a real commercetools project.** Everything is typechecked and unit-tested, but the CT path has not been exercised against a live CT project with real discount codes. The two things to confirm there: that `discountCodes[*].discountCode` expansion returns `obj.code` as expected, and that the `DiscountCodeNonApplicable` error body nests errors as `body.errors[]` — [toDiscountCodeError](../integrations/commercetools-api/src/services/cart.service.ts) reads that shape, and it is the one assumption in this feature taken from the SDK's type declarations rather than an observed response.

## Where promo codes come from

The code paths are implemented for every data source. Only the **test data** is mock-only.

| Data source                 | `cartService`     | Codes come from    |
| --------------------------- | ----------------- | ------------------ |
| `mock-set`                  | mock-api          | the fixtures below |
| `commercetools-set`         | commercetools-api | your CT project    |
| `commercetools-algolia-set` | commercetools-api | your CT project    |

`cartService` resolves from the selected set's provider in [data-source.factory.ts](../apps/bff/src/data-source/data-source.factory.ts) — unlike `customerService` / `orderService`, it is **not** forced to commercetools.

### Mock fixtures (`mock-set` only)

Hardcoded in [mock-api/src/services/cart.service.ts](../integrations/mock-api/src/services/cart.service.ts). Case-insensitive.

| Code                         | Result                 |
| ---------------------------- | ---------------------- |
| `SAVE10`                     | applies, 10.00 off     |
| `SAVE5`                      | applies, 5.00 off      |
| `EXPIRED`                    | `expired` error        |
| `NOTYET`                     | `notApplicable` error  |
| anything else                | `invalid` error        |
| any code while one is active | `alreadyApplied` error |

### Real codes (commercetools sets)

**The fixture codes above do not exist in commercetools and will return `invalid` there.** Real codes need two objects, created by hand — there is no seeding path in the repo (`scripts/` is empty, and there is no commercetools migration package the way Contentful has [contentful-migration](../integrations/contentful-migration/)). This matches how CT stores, languages, and countries are already set up manually — see [README.md](../README.md).

1. A **Cart Discount** — which carts qualify and how much comes off.
2. A **Discount Code** referencing it — the string the shopper types.

#### Four settings that decide whether it works here

These come from how _this_ storefront builds carts, and getting any of them wrong produces a code that looks correct but does nothing.

| Setting                    | Value                            | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Target**                 | `totalPrice`                     | The mapper reads `cart.discountOnTotalPrice`, which CT populates **only** for total-price targets. A `lineItems` target quietly reduces the line item totals instead — the shopper's total drops but `discountAmount` stays empty, so **no discount row renders**. See [calculateLineItemsSubtotal](../integrations/commercetools-api/src/mappers/cart.ts) — subtotal is summed from `item.totalPrice`, which already includes line-item discounts. |
| **Store**                  | **none**                         | Carts here are created with `client.me().carts()` and no store, under a project-wide token from `oauth/{projectKey}/anonymous/token` (not the `in-store` variant). A store-restricted discount will never match.                                                                                                                                                                                                                                    |
| **`requiresDiscountCode`** | `true`                           | Otherwise the discount applies automatically and the code is redundant.                                                                                                                                                                                                                                                                                                                                                                             |
| **Currency**               | `USD` for `/en`, `EUR` for `/de` | Must match the cart. From `LOCALE_CONFIG` in [config/constants/src/i18n.ts](../config/constants/src/i18n.ts).                                                                                                                                                                                                                                                                                                                                       |

Also: `sortOrder` must be a decimal **strictly between 0 and 1** and unique across cart discounts (CT rejects `0`, `1`, and duplicates), and `isActive` must be `true` with a validity window covering now.

> Note: the doc comment in [commercetools-auth/src/scopes.ts](../integrations/commercetools-auth/src/scopes.ts) says "the in-store endpoint constrains the token to the store" — that is not what the code does. Both token endpoints are project-wide, so carts are not store-scoped.

#### Exercising each error path

| Reason           | How to reproduce                                                                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invalid`        | Type any string that is not a code in the project.                                                                                                                                                                                                         |
| `expired`        | A discount code with `validUntil` in the past → CT 400, `reason: TimeRangeNonApplicable`.                                                                                                                                                                  |
| `notApplicable`  | A cart discount with a predicate the cart cannot satisfy, e.g. `totalPrice > "100000 USD"` → CT returns **200** with state `DoesNotMatchCart`, and the rollback path removes it. This is the one that exercises the subtle success-but-not-applied branch. |
| `alreadyApplied` | Apply a second valid code while one is active.                                                                                                                                                                                                             |

Creating a real code is also what confirms the two live-CT assumptions under Remaining work.
