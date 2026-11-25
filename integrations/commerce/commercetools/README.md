# @integrations/commerce-commercetools

NestJS module that integrates [Commercetools](https://commercetools.com/) with the SHOPin storefront accelerator. Implements product catalog, cart, checkout, navigation, and customer services against the Commercetools API.

## Overview

This module implements the data-source service interfaces used by the BFF. When the data source is `commercetools-set`, the BFF routes product, cart, order, and navigation requests through this integration.

## Environment Variables

Env are set in the **repo root `.env`**. See [root `.env.example`](../../../.env.example) for descriptions. This module uses: `COMMERCETOOLS_CLIENT_ID`, `COMMERCETOOLS_CLIENT_SECRET`, `COMMERCETOOLS_PROJECT_KEY`, `COMMERCETOOLS_API_URL`, `COMMERCETOOLS_AUTH_URL`, `COMMERCETOOLS_STORE_KEYS`.

## Configuring stores and shipping destinations

Each storefront locale maps to a commercetools **Store**. The supported locales are declared in [`config/constants/src/i18n.ts`](../../../config/constants/src/i18n.ts) — **that file is the first thing to update when adding a new locale**. It carries the default `ctStoreKey` per locale. See [`config/constants/README.md`](../../../config/constants/README.md) for the full checklist.

Override the store key per-environment via `COMMERCETOOLS_STORE_KEYS`:

```
COMMERCETOOLS_STORE_KEYS=en-US:my-us-store,de-DE:my-de-store
```

When this var is unset, every language falls back to the `ctStoreKey` defined in `LOCALE_CONFIG`.

**When adding a new locale**, also create (or designate) a matching Store in the Merchant Center with the correct languages configured, then add its key to `COMMERCETOOLS_STORE_KEYS`.

**Shipping-country dropdown** — the address form in checkout reads the store's `countries` list directly from the commercetools Store resource. To control which countries appear in the dropdown:

1. Open **Merchant Center → Settings → Stores → <your store>**.
2. Under **Countries**, add every ISO 3166-1 alpha-2 code you want to ship to (e.g. `DE`, `AT`, `CH`).
3. Save. No code deployment needed — the storefront reads this list on each request.

If a Store has **no countries configured** or the Store fetch fails, the storefront logs a warning and `shippingCountries` is `[]` — the shipping country dropdown in checkout will be empty. Likewise, if the commercetools project fetch fails or returns no countries, `projectCountries` is `[]` and billing address forms and customer account address management will render with an empty country dropdown. A sensible fallback varies per project; callers that need a guaranteed non-empty list should pass an explicit `countries` prop to `AddressForm`.

## Shipping method delivery time

The delivery estimate shown next to each option in the checkout delivery step, on the order confirmation page and in the account's last-order summary comes from a custom field on the shipping method. Commercetools has no built-in field for it, so the project needs this custom Type:

| Setting          | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| Resource type id | `shipping-method`                                      |
| Field name       | `deliveryTime` (`SHIPPING_METHOD_DELIVERY_TIME_FIELD`) |
| Field type       | `LocalizedString`                                      |

Create the Type in **Merchant Center → Settings → Project settings → Custom Types** (or through the API), then set a value per language on each shipping method under **Settings → Project settings → Shipping methods**, e.g. `en-US: "2-3 business days"`, `de-DE: "2-3 Werktage"`. The storefront puts the value after a label ("Delivery in {time}" in English, "Lieferzeit: {time}" in German), so enter only the time span.

Without the Type, or for a method without a value, no delivery time is shown and everything else works as before. A field with a different type (e.g. a plain `String`) is ignored rather than failing the cart or order request.

## Service Provider

The module includes `CommercetoolsServiceProvider` that implements the `DataSourceServiceProvider` interface, providing access to all Commercetools services through a unified interface.

## Usage

This module is used by the BFF (Backend for Frontend) service. It's imported and configured in `apps/bff/src/data-source/data-source.module.ts` and used by the `DataSourceFactory` to route requests to Commercetools when the data source is set to `commercetools-set`.

## Integration

The module is automatically loaded by the BFF's `DataSourceModule` and provides services when the `commercetools-set` data source is selected.

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
