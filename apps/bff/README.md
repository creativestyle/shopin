# @apps/bff

NestJS Backend for Frontend (BFF) for the SHOPin storefront starter. Exposes a unified REST API for products, cart, checkout, auth, content, and navigation; routes requests to [integrations](../../integrations) (e.g. Commercetools, Contentful, mock) based on the selected data source.

## Overview

The BFF sits between the Next.js storefront and e-commerce/CMS back ends. It provides a single, consistent API regardless of whether the data comes from Commercetools or the mock integration.

## Architecture

### Core Components

- **DataSourceModule**: Manages data source selection and routing

### Data Sources

The BFF supports multiple data sources. Implementations live in the **[integrations](../../integrations)** directory (see [integrations README](../../integrations/README.md) for an overview and links to each integration).

### Data Source Management

The BFF provides flexible data source management through its `DataSourceFactory`:

- **Per-Request Selection**: Each API request can use a different data source (via header or default)
- **Service-Level Routing**: Services get catalog, content, and navigation from the selected source
- **Mixed Sources**: Customer/order always from Commercetools; payment from mock; catalog/content/navigation from the selected data source

#### Example Use Cases:

- **A/B Testing**: Route different user segments to different data sources
- **Gradual Migration**: Gradually shift from one data source to another
- **Feature Flags**: Enable new data sources for specific features

#### How it works

The following describes the **current state of possibilities**; it will grow as new data sources and routing strategies are added.

Controllers inject feature services (e.g. `ProductCollectionService`, `ContentService`, `NavigationService`); those services inject `DataSourceFactory`. The factory resolves the current data source (from request header or default) and returns the right set of services. For `commercetools-set`, catalog and content may come from Commercetools + Contentful (or mock content if Contentful is disabled); for `mock-set`, everything comes from the mock provider. Customer, address and order are always from Commercetools; payment is always from mock.

**Example – controllers (real routes):**

```typescript
@Controller('productCollection')
export class ProductCollectionController {
  @Get('slug/:productCollectionSlug/page')
  async getProductCollectionPage(...) {
    return this.productCollectionService.getProductCollectionPage(...)
  }
}

@Controller('content')
export class ContentController {
  @Get('page/:slug')
  async getContentPage(...) {
    return this.contentService.getContentPage(...)  // page/layout from selected source (Contentful or mock)
  }
  @Get('header')
  async getHeader() { ... }
  @Get('footer')
  async getFooter() { ... }
}

@Controller('navigation')
export class NavigationController {
  @Get()
  async getNavigation() {
    return this.navigationService.getNavigation()   // from selected data source
  }
}
```

**Example – DataSourceFactory (simplified):**

The factory builds a map from data source name to a service provider and selects the provider using the current `DATA_SOURCE` (from request header or default). Then it merges in fixed sources (customer/order from Commercetools, payment from mock):

```typescript
// In constructor: map each data source to its provider
this.serviceProviderMap = new Map<DataSource, DataSourceServiceProvider>([
  ['commercetools-set', commercetoolsWithCMS],  // Commercetools + Contentful (or mock page/layout)
  ['mock-set', this.mockServiceProvider],
])

// getServices(): resolve provider by current data source, then merge fixed services
getServices(): AllServices {
  const serviceProvider = this.serviceProviderMap.get(this.dataSource)
  if (!serviceProvider) {
    throw new Error(`Unknown data source: ${this.dataSource}. Allowed: ${ALLOWED_DATA_SOURCES.join(', ')}`)
  }
  const baseServices = serviceProvider.getServices()
  const { customerService, customerAddressService, orderService } =
    this.commercetoolsServiceProvider.getServices()
  const { paymentService } = this.mockServiceProvider.getServices()
  return {
    ...baseServices,
    customerService,
    customerAddressService,
    cartPaymentService: baseServices.cartPaymentService,
    paymentService,
    orderService,
  }
}
```

Auth is separate: `getAuthServices()` always comes from `COMMERCETOOLS_AUTH_SERVICE_PROVIDER`. See [data-source.factory.ts](src/data-source/data-source.factory.ts) for the full implementation.

**Customizing the factory:** The DataSourceFactory is something you can adjust to your project’s requirements. The current implementation is one possible approach (per-request data source, merged services, fixed customer/order and payment sources). You might use a different strategy—e.g. different fallbacks, different mixing rules, or additional data sources—depending on your needs.

## Environment Variables

The BFF reads env from the **repo root `.env`**. Variables used by the BFF itself:

- **`FRONTEND_URL`** – CORS origin for the frontend
- **`LOG_LEVEL`**, **`LOG_PRETTY_PRINT`** – Logging (via `@core/logger-config`)
- **`BFF_RATE_LIMIT_*`** – Rate limiting (optional)
- **`JWT_ENCRYPTION_KEY`**, **`JWT_SIGNING_KEY`** – Token encryption/signing
- **`CSRF_TOKEN_ENCRYPTION_KEY`**, **`CSRF_TOKEN_SIGNING_KEY`** – CSRF token handling
- **`NEXT_DRAFT_MODE_SECRET`** – Contentful draft/preview (when Contentful is enabled)

The Commercetools and Contentful integration modules (used by the BFF) read **`COMMERCETOOLS_*`** and **`CONTENTFUL_*`** from the same `.env`. For the full list and descriptions, see [root `.env.example`](../../.env.example) and the [root README – Installation](../../README.md#installation).

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
