# @integrations/commercetools-commerce

NestJS module that integrates [Commercetools](https://commercetools.com/) with the SHOPin storefront accelerator. Implements product catalog, cart, checkout, navigation, and customer services against the Commercetools API.

## Overview

This module implements the data-source service interfaces used by the BFF. It provides the categories `commerce`, `search` and `auth` (commercetools customer accounts); its `commerce` part has the `customer-link` capability.

## Environment Variables

Set in the repository root `.env`; `npm run setup` adds the required ones (empty) when the config names
commercetools. Create an API client in the project (Merchant Center → Settings → Developer settings → API clients):

- `COMMERCETOOLS_CLIENT_ID`, `COMMERCETOOLS_CLIENT_SECRET`, `COMMERCETOOLS_PROJECT_KEY` — the API client
- `COMMERCETOOLS_API_URL`, `COMMERCETOOLS_AUTH_URL` — the project's region URLs, e.g.
  `https://api.europe-west1.gcp.commercetools.com` and `https://auth.europe-west1.gcp.commercetools.com`
- `COMMERCETOOLS_STORE_KEYS` (optional) — the Store of a locale `commercetools({ storeKeys })` leaves out:
  `en-US:shopin-us,de-DE:shopin-de` (the option wins for a locale it names)
- `COMMERCETOOLS_LINK_CUSTOMERS` (optional) — `1` lets sign-in through another identity provider create or link
  customers (below)

## Sign-in through another identity provider

With `auth` served by another integration (your identity provider) and `commerce: commercetools()`, the BFF links
each signed-in identity to a commercetools customer (`externalId`), creating the customer when there is none. That
writes customers into the project, so it needs `COMMERCETOOLS_LINK_CUSTOMERS=1`; without it the BFF does not start
and says so.

Such a customer has no commercetools token of their own, so their cart, orders, payments and shopping lists are read
and written through the project API with the API client, always filtered by that customer. The API client then needs
the scopes `manage_orders`, `manage_customers`, `manage_payments` and `manage_shopping_lists`. With
`COMMERCETOOLS_LINK_CUSTOMERS=1` the BFF checks them at start and names the missing ones. Scopes of an existing API
client cannot be changed: create a new one.

A customer of commercetools' own sign-in (`auth: commercetoolsAuth()`) needs none of the order, payment and
shopping-list scopes: the BFF acts with that customer's own token (the `me` endpoints), so commercetools itself limits
every call to the customer, and the guest cart is merged into the customer's at sign-in. The sign-in itself needs
`manage_customers` (sign-up creates customers; sign-in and the session re-check read them); the BFF checks it at
start.

| Configuration                                  | API client scopes beyond the shopper ones                                       | Checked at start |
| ---------------------------------------------- | ------------------------------------------------------------------------------- | ---------------- |
| commercetools commerce, no sign-in             | none                                                                            | —                |
| commercetools commerce + commercetools sign-in | `manage_customers`                                                              | yes              |
| commercetools commerce + another sign-in       | `manage_orders`, `manage_customers`, `manage_payments`, `manage_shopping_lists` | yes              |

`manage_project` (an admin client) grants all of them.

## Configuring stores and shipping destinations

Each locale of the shop (`config/locales.json`) reads one commercetools **Store**. The integration's option names
them, in `config/shop/shopin.config.ts`:

```ts
import { commercetools } from '@integrations/commercetools-commerce/shopin'

const ct = commercetools({
  storeKeys: { 'en-US': 'us-store', 'de-DE': 'eu-store' },
})
```

A locale the option leaves out takes its store from `COMMERCETOOLS_STORE_KEYS=en-US:my-us-store,de-DE:my-de-store`
(per environment); for a locale the option names, the option wins. Every locale
needs a store: the BFF's start names a locale without one, and a store key for a locale the shop does not have.

**When adding a new locale**, create (or designate) a matching Store in the Merchant Center with its language and
countries, then add its key to `storeKeys`.

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

## Usage

Import `@integrations/commercetools-commerce/shopin` in `config/shop/shopin.config.ts` and name it under the categories it should serve, then `npm run setup` (see the [root README](../../../README.md#quick-start)).

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
