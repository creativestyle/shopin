# @integrations/commercetools-commerce

NestJS module that integrates [Commercetools](https://commercetools.com/) with the SHOPin storefront accelerator. Implements product catalog, cart, checkout, navigation, and customer services against the Commercetools API.

## Overview

This module serves the `commerce` port the BFF uses: catalog, carts, checkout, customers and orders. When the shop configures no search integration, its product search serves `search` too. Sign-in is the separate auth part, [`@integrations/commercetools-auth`](../auth/README.md) (same `commercetools` id); with another identity provider, this part links its customers (below).

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

Every configuration needs `view_stores` (or `manage_stores`) beyond the shopper scopes: the start-up check reads each
configured Store (its distribution channel, below). Without it that read answers 403, the check fails naming the
scope, and the `commerce` category is unavailable (its routes answer 503).

| Configuration                                  | API client scopes beyond the shopper ones                                                      | Checked at start |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------- |
| commercetools commerce, no sign-in             | `view_stores` (`view_types` when the shop has cart fields)                                     | `view_stores`    |
| commercetools commerce + commercetools sign-in | `view_stores`, `manage_customers`                                                              | yes              |
| commercetools commerce + another sign-in       | `view_stores`, `manage_orders`, `manage_customers`, `manage_payments`, `manage_shopping_lists` | yes              |

`manage_project` (an admin client) grants all of them.

## Cart fields

A shop's own cart fields (`contracts.cart` plus `cartFields` in `shopin.config.ts`, set with `PUT /bff/cart/fields`)
are stored as Custom Fields on the cart. A cart without a Custom Type gets the type with the key `shop-cart-fields`,
which the project must have. Nothing creates it: add it once in the Merchant Center or through the API, with
`resourceTypeIds: ["order"]` (carts and orders share the resource type) and one field per name in `cartFields`, for
example a `String` field `giftMessage`. Without it, the BFF answers 501 and names the type. A cart that already has
another Custom Type must have the fields on that type, which the BFF reads with the API client (`view_types`).

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

**Prices** are selected by the request's currency and country and by the store's distribution channel (the first one
the Store lists; none when it lists none), read once at start. Product pages, listings, search (with its price filter,
price facet and price sort) and the wishlist show that price, and a line item added to the cart takes the same channel.
Prices are not selected by customer group (as before): in a project with customer-group prices, a signed-in customer's
cart can charge a different price than the pages show. Stock is not limited to the channel.

Carts are kept per currency, not per store, so stores whose locales share a currency must have the same distribution
channel (or all none). Otherwise the start-up check fails, naming the stores and the currency, and `commerce` is
unavailable.

**Shipping-country dropdown** — the address form in checkout reads the store's `countries` list directly from the commercetools Store resource. To control which countries appear in the dropdown:

1. Open **Merchant Center → Settings → Stores → <your store>**.
2. Under **Countries**, add every ISO 3166-1 alpha-2 code you want to ship to (e.g. `DE`, `AT`, `CH`).
3. Save. No code deployment needed — the storefront reads this list on each request.

If a Store has **no countries configured**, or a later fetch of it fails while the BFF runs (a Store that cannot be read at start fails the start-up check first, above), the storefront logs a warning and `shippingCountries` is `[]` — the shipping country dropdown in checkout will be empty. Likewise, if the commercetools project fetch fails or returns no countries, `projectCountries` is `[]` and billing address forms and customer account address management will render with an empty country dropdown. A sensible fallback varies per project; callers that need a guaranteed non-empty list should pass an explicit `countries` prop to `AddressForm`.

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
