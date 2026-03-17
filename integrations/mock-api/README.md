# @integrations/mock-api

NestJS module that provides mock implementations of the SHOPin storefront starter data-source services. Used for local development, demos, and testing when the data source is `mock-set` (no Commercetools or Contentful required).

## Overview

Implements the same service interfaces as `@integrations/commercetools-api` and `@integrations/contentful-api` with in-memory/faker data. The BFF uses this module when the selected data source is `mock-set`.

## Service Provider

The module includes `MockServiceProvider` that implements the `DataSourceServiceProvider` interface, providing access to all mock services through a unified interface.

## Usage

This module is used by the BFF (Backend for Frontend) service. It's imported and configured in `apps/bff/src/data-source/data-source.module.ts` and used by the `DataSourceFactory` to route requests to mock data when the data source is set to `mock-set`.

## Integration

The module is automatically loaded by the BFF's `DataSourceModule` and provides services when the `mock-set` data source is selected (default fallback).

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
