# Demo Workspace

⚠️ **DEMO ONLY** — This workspace contains optional demo packages for the SHOPin storefront accelerator. None of these packages are required for production.

Demo functionality showcases multi–data-source switching (the demo payment page lives in `integrations/psp/mock-payment-page`); you can remove this entire workspace when building a production storefront.

## Packages

- **data-source-selector** — React components for data source selection (used by presentation and Storybook)
  - `DataSourceSelector` — Dropdown for switching between data sources
  - `DataSourceIndicator` — Visual indicator of the current data source (shown in the top bar)
  - `getDataSourceHeader` — Utility for sending the data-source header to the BFF

- **demo-disclaimer** — React modal dialog shown on first visit; warns visitors this is a sandbox with no real orders or payments. Stores acknowledgment in a cookie for 30 days. Copy is hardcoded (EN/DE) — no i18n changes needed.

- **mock-tracking-tags** — Mock analytics and marketing tags that only run once the visitor consents to that cookie category. They set identifier cookies (`_analytics_id`, `_mkt_id`) and push `window.dataLayer` events, with no real tracker behind them.

- **data-source-header-reader** — NestJS middleware for the BFF that reads the `x-data-source` header and sets the active data source on the request. Required for the selector to actually switch backends.

## Usage

- **Presentation** depends on `@demo/data-source-selector`, `@demo/demo-disclaimer`, `@demo/mock-tracking-tags`, and `@integrations/psp-mock-payment-page`.
- **Storybook** depends on `@demo/data-source-selector` and `@integrations/psp-mock-payment-page`.
- **BFF** depends on `@demo/data-source-header-reader` so that the data-source selector can switch backends.

## Removing Demo Functionality

If you don't need the demo functionality, you can remove this entire workspace:

1. **Remove dependencies**
   - From `apps/presentation/package.json`: remove `@demo/data-source-selector`, `@demo/demo-disclaimer`, `@demo/mock-tracking-tags`, and `@integrations/psp-mock-payment-page`
   - From `apps/bff/package.json`: remove `@demo/data-source-header-reader`
   - From `apps/storybook/package.json` (if you use it): remove `@demo/data-source-selector` and `@integrations/psp-mock-payment-page`

2. **Remove usage in presentation**
   - `DataSourceIndicator` — `apps/presentation/components/layout/top-bar.tsx`
   - `DemoDisclaimerModal` — remove from `apps/presentation/app/[locale]/layout.tsx` and remove `@source '../../../demo/demo-disclaimer/'` from `apps/presentation/app/globals.css`
   - `MockTrackingTags` — remove `<DemoTrackingTagsWrapper />` from `apps/presentation/app/[variant]/[locale]/layout.tsx` and delete `demo-tracking-tags-wrapper.tsx` next to it
   - `getDataSourceHeader` — `apps/presentation/lib/bff/core/bff-fetch.ts`
   - **Demo payment**: Remove `PaymentDemo` from `apps/presentation/app/[variant]/[locale]/demo/mocked-payment-step/[paymentId]/page.tsx`, or delete the whole `app/[variant]/[locale]/demo/` route. Then update **`integrations/commerce/mock`**: the mock payment service (`integrations/commerce/mock/src/services/payment.service.ts`) currently returns a payment link to `/demo/mocked-payment-step/${cartId}`. Change `getPaymentLink()` to return your real payment provider URL (or a placeholder), otherwise checkout with the mock data source will redirect to a broken link.
   - In `apps/presentation/app/globals.css`, remove the line: `@source '../../../demo/data-source-selector/';`
   - **Data-source selector page**: delete the `/setup` route (`apps/presentation/app/[variant]/[locale]/(main)/setup/`), which renders `DataSourceSelector`.
   - **Mock data source**: remove `'mock-set'` from `ALLOWED_DATA_SOURCES` in `config/constants/src/data-source/index.ts`, so a leftover `data-source=mock-set` cookie can't select the mock variant.

3. **Remove usage in BFF**
   - In `apps/bff/src/data-source/data-source.module.ts`: remove the `@demo/data-source-header-reader` import (`dataSourceHeaderMiddleware`, `DataSourceRequest`), remove the `configure()` implementation (or the whole `implements NestModule`), and change the `DATA_SOURCE` provider to use `DEFAULT_DATA_SOURCE` only (no request-based switching).

4. **Delete the demo workspace**

   ```bash
   rm -rf demo
   ```

5. **Reinstall dependencies**

   ```bash
   npm install
   ```

## License

OSL-3.0 — see [root LICENSE](../LICENSE).
