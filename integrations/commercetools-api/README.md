# @integrations/commercetools-api

NestJS module that integrates [Commercetools](https://commercetools.com/) with the SHOPin storefront starter. Implements product catalog, cart, checkout, navigation, and customer services against the Commercetools API.

## Overview

This module implements the data-source service interfaces used by the BFF. When the data source is `commercetools-set`, the BFF routes product, cart, order, and navigation requests through this integration.

## Environment Variables

Env are set in the **repo root `.env`**. See [root `.env.example`](../../.env.example) for descriptions. This module uses: `COMMERCETOOLS_CLIENT_ID`, `COMMERCETOOLS_CLIENT_SECRET`, `COMMERCETOOLS_PROJECT_KEY`, `COMMERCETOOLS_API_URL`, `COMMERCETOOLS_AUTH_URL`.

## Service Provider

The module includes `CommercetoolsServiceProvider` that implements the `DataSourceServiceProvider` interface, providing access to all Commercetools services through a unified interface.

## Usage

This module is used by the BFF (Backend for Frontend) service. It's imported and configured in `apps/bff/src/data-source/data-source.module.ts` and used by the `DataSourceFactory` to route requests to Commercetools when the data source is set to `commercetools-set`.

## Integration

The module is automatically loaded by the BFF's `DataSourceModule` and provides services when the `commercetools-set` data source is selected.

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
