# Demo Workspace

⚠️ **DEMO ONLY** — This workspace contains optional demo packages for the SHOPin storefront starter. None of these packages are required for production.

Demo functionality showcases multi–data-source switching and mocked payment; you can remove this entire workspace when building a production storefront.

## Packages

- **data-source-selector** — React components for data source selection (used by presentation and Storybook)
  - `DataSourceSelector` — Dropdown for switching between data sources
  - `DataSourceIndicator` — Visual indicator of the current data source (shown in the top bar)
  - `getDataSourceHeader` — Utility for sending the data-source header to the BFF

- **data-source-header-reader** — NestJS middleware for the BFF that reads the `x-data-source` header and sets the active data source on the request. Required for the selector to actually switch backends.

- **mocked-payment-service-provider** — React components for mocked payment (used by presentation and Storybook). The **mock integration** (`integrations/mock-api`) redirects checkout to the demo payment page at `/demo/mocked-payment-step/[paymentId]`; removing this package requires updating that integration to use a different payment link.
  - `PaymentDemo` — Demo payment page with payment simulation buttons

## Usage

- **Presentation** and **Storybook** depend on `@demo/data-source-selector` and `@demo/mocked-payment-service-provider`.
- **BFF** depends on `@demo/data-source-header-reader` so that the data-source selector can switch backends.

## Removing Demo Functionality

If you don't need the demo functionality, you can remove this entire workspace:

1. **Remove dependencies**
   - From `apps/presentation/package.json`: remove `@demo/data-source-selector` and `@demo/mocked-payment-service-provider`
   - From `apps/bff/package.json`: remove `@demo/data-source-header-reader`
   - From `apps/storybook/package.json` (if you use it): remove `@demo/data-source-selector` and `@demo/mocked-payment-service-provider`

2. **Remove usage in presentation**
   - `DataSourceIndicator` — `apps/presentation/components/layout/top-bar.tsx`
   - `getDataSourceHeader` — `apps/presentation/lib/bff/core/bff-fetch.ts`
   - **Demo payment**: Remove `PaymentDemo` from `apps/presentation/app/[locale]/demo/mocked-payment-step/[paymentId]/page.tsx`, or delete the whole `app/[locale]/demo/` route. Then update **`integrations/mock-api`**: the mock payment service (`integrations/mock-api/src/services/payment.service.ts`) currently returns a payment link to `/demo/mocked-payment-step/${cartId}`. Change `getPaymentLink()` to return your real payment provider URL (or a placeholder), otherwise checkout with the mock data source will redirect to a broken link.
   - In `apps/presentation/app/globals.css`, remove the line: `@source '../../../demo/data-source-selector/';`

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
