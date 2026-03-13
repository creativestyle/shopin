# Demo Workspace

⚠️ **DEMO ONLY** — This workspace contains optional demo packages for the SHOPin storefront starter. None of these packages are required for production.

Demo functionality showcases multi–data-source switching and mocked payment; you can remove this entire workspace when building a production storefront.

## Packages

- **data-source-selector**: React components for demonstrating data source selection functionality
  - `DataSourceSelector` - Dropdown component for switching between data sources
  - `DataSourceIndicator` - Visual indicator showing the current data source
  - Utility functions for managing data source cookies and headers

- **mocked-payment-service-provider**: React components for demonstrating mocked payment functionality
  - `PaymentDemo` - Demo payment page component with payment simulation buttons

## Usage

These packages are automatically included in the presentation app for demo purposes.

## Removing Demo Functionality

If you don't need the demo functionality, you can easily remove this entire workspace:

1. **Remove dependencies** from `apps/presentation/package.json`:

   ```json
   {
     "dependencies": {
       "@demo/data-source-selector": "*", // Remove this line
       "@demo/mocked-payment-service-provider": "*" // Remove this line
     }
   }
   ```

2. **Remove component imports** from your React components:
   - Remove `DataSourceSelector` from `apps/presentation/app/page.tsx`
   - Remove `DataSourceIndicator` from `apps/presentation/components/ui/top-bar.tsx`
   - Remove `getDataSourceHeader` from `apps/presentation/lib/bff-client.ts`
   - Remove `PaymentDemo` from `apps/presentation/app/[locale]/demo/mocked-payment-step/[paymentId]/page.tsx`

3. **Remove styles**
   @source "../../../demo/data-source-selector/";

4. **Delete the demo workspace**:

   ```bash
   rm -rf demo
   ```

5. **Update dependencies**:
   ```bash
   npm install
   ```

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
