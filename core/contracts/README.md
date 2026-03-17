# @core/contracts

Shared TypeScript interfaces, types, and Zod schemas used across the SHOPin storefront accelerator (BFF, presentation, and integrations). Single source of truth for API contracts and domain types.

**Objects in general should be defined here** — use this package for interfaces, object-shaped types, and API/domain contracts. For primitive constants and small derived types (e.g. from `as const`), use `@config/constants` instead.

## Features

- **Type Safety**: Full TypeScript support with strict type checking
- **Organized Structure**: Interfaces are organized by domain (core, navigation, products, responses)
- **Automatic Compilation**: TypeScript files are automatically compiled to JavaScript
- **Wildcard Exports**: No index files needed - automatic discovery of all types

## Scripts

### Build

```bash
npm run build
```

Compiles TypeScript source files to JavaScript in the `dist/` directory.

### Development Mode

```bash
npm run dev
```

Watches for changes in TypeScript files and automatically rebuilds.

### Type Checking

```bash
npm run check-types
```

Runs TypeScript compiler to check for type errors without emitting files.

### Linting

```bash
npm run lint
```

Runs ESLint to check code quality.

### Formatting

```bash
npm run format
```

Runs Prettier to format code.

## Adding New Interfaces

1. **Create your interface file** in the appropriate directory under `src/`
2. **The interface is automatically available** - no index files needed
3. **Import using subpath**: `@core/contracts/products/your-new-interface`

## Important Notes

- **No index files** - everything is handled automatically by wildcard exports
- **Use `npm run dev`** during development for automatic rebuilding
- **All interfaces are automatically discoverable** through the export patterns
- **Compiled JavaScript files** are available in the `dist/` directory

## Example Usage

```typescript
// Import specific types using subpaths
import { ProductDetailsResponse } from '@core/contracts/product/product-details'
import { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import { ProductPageResponse } from '@core/contracts/product/product-page'

// Your code here...
```

## Build Process

The module automatically compiles TypeScript to JavaScript, making it compatible with:

- **Pipeline builds** - compiled files are available for imports
- **Development workflows** - automatic rebuilding on file changes
- **Type safety** - full TypeScript support during development

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
