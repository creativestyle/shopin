# @integrations/mock-commerce

NestJS module that provides mock implementations of the SHOPin storefront accelerator data-source services. Provides `commerce`, `search`, `cms` and `payment` from in-memory fixtures: no accounts or variables needed.

## Overview

Implements the same service interfaces as `@integrations/commercetools-commerce` and `@integrations/contentful-cms`.

## Usage

Import `@integrations/mock-commerce/shopin` in `config/shop/shopin.config.ts` and name it under the categories it should serve, then `npm run setup` (see the [root README](../../../README.md#quick-start)).

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
