# @demo/data-source-header-reader

⚠️ **DEMO ONLY** — For demonstration only; not for production.

NestJS middleware that reads the `x-data-source` header and sets the active data source on the request. Enables switching between Commercetools and mock via HTTP headers (used with the demo data-source-selector UI).

## Usage

```typescript
import {
  dataSourceHeaderMiddleware,
  type DataSourceRequest,
} from '@demo/data-source-header-reader'

@Global()
@Module({
  // ... your module configuration
})
export class DataSourceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(dataSourceHeaderMiddleware).forRoutes('*path')
  }
}
```

## What it does

1. **Reads `x-data-source` header** from incoming requests
2. **Validates the header value** against allowed data sources
3. **Sets `req.dataSource`** on the request object
4. **Falls back to default** if header is missing or invalid

## Removal

See [demo/README.md](../README.md) for removal steps.

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
