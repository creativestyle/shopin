# @integrations/mock-commerce

NestJS module that provides mock implementations of the SHOPin storefront accelerator data-source services. Provides `commerce` from in-memory fixtures (catalog, carts, wishlist, customers, orders): no accounts or variables needed. With no search integration configured, its product search serves search; CMS content and payment are the separate `@integrations/mock-cms` and `@integrations/mock-psp` packages.

## Overview

Implements the same commerce port as `@integrations/commercetools-commerce`.

## Usage

Import `@integrations/mock-commerce/shopin` in `config/shop/shopin.config.ts` and name it under the categories it should serve, then `npm run setup` (see the [root README](../../../README.md#quick-start)).

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
