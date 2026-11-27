# Extending SHOPin

How a shop adds what SHOPin does not ship, without forking it. Every extension point lives in the shop's own files:
`config/shop/shopin.config.ts` (the BFF side) and `config/storefront/storefront.mts` (the storefront side). SHOPin's
own code under `apps/`, `core/` and `integrations/` stays untouched, so the shop keeps taking SHOPin updates.

## Your own fields on a contract

A shop adds fields to the cart, a product card or the product page by extending the contract and filling the fields
in a mapper hook of each integration that produces it:

```ts
// config/shop/shopin.config.ts
import { z } from "zod";
import { defineConfig } from "@core/integration-kit";
import { CartResponseSchema } from "@core/contracts/cart/cart";
import { commercetools } from "@integrations/commercetools-commerce/shopin";

export const config = defineConfig({
  commerce: commercetools({
    storeKeys: { "en-US": "us-store" },
    mappers: {
      // runs after the built-in mapper: the platform's resource and the mapped contract
      cart: (cart, mapped) => ({
        ...mapped,
        giftMessage: cart.custom?.fields?.giftMessage,
      }),
    },
  }),
  contracts: {
    cart: CartResponseSchema.extend({ giftMessage: z.string().optional() }),
  },
});
```

The BFF parses every cart response with the extended schema. `defineConfig` refuses a config where an integration
that fills the cart has no `mappers.cart` hook, so switching platforms cannot silently drop the field. The extendable
contracts are `cart`, `productCard` and `product`. Each integration documents what its hook receives (for
commercetools: `integrations/commercetools/commerce/src/mapper-hooks.ts`; for the mock: its `options.ts`).

## A field the shopper sets

A field the shopper writes (a gift message, a delivery note) needs no route of the shop's own. List it in
`cartFields`, and SHOPin's `PUT /bff/cart/fields` accepts it:

```ts
export const config = defineConfig({
  // …commerce with its cart hook, contracts.cart with giftMessage, as above
  cartFields: ["giftMessage"],
});
```

- Only listed fields are writable, and none are by default. A field the server decides (a loyalty tier, a discount
  flag) stays read-only even when it is in `contracts.cart`.
- `defineConfig` refuses a name that is not a field of `contracts.cart`, or that is one of SHOPin's own cart fields.
- The BFF checks each value against its schema; `null` removes the field.
- The route needs the CSRF token, like every write.
- The commerce integration stores the fields through its `setCartFields`. commercetools keeps them as Custom Fields on
  the cart; its README section "Cart fields" names the Custom Type the project needs.

On the storefront, the `CartExtra` slot renders under the cart summary and receives the cart and `setFields`:

```tsx
// config/storefront/storefront.mts
export { GiftMessage as CartExtra } from "./gift-message";

// config/storefront/gift-message.tsx
("use client");
import type { StorefrontSlots } from "@core/integration-kit";

type Props = Parameters<NonNullable<StorefrontSlots["CartExtra"]>>[0];

export function GiftMessage({ cart, setFields }: Props) {
  return (
    <textarea
      defaultValue={(cart as { giftMessage?: string }).giftMessage ?? ""}
      onBlur={(e) => setFields({ giftMessage: e.target.value || null })}
    />
  );
}
```

`CartExtra`, `SiteNotice` and `TrackingTags` render in the browser, so their components are client components
(`'use client'`).

## Your own BFF feature

A shop's own routes (a company register, a loyalty program) are ordinary Nest modules, listed in `features`:

```ts
import { Controller, Get, Module } from "@nestjs/common";
import { Reads } from "@core/integration-kit";

@Reads("commerce")
@Controller("loyalty")
class LoyaltyController {
  @Get()
  status() {
    return { points: 0 };
  }
}

@Module({ controllers: [LoyaltyController] })
export class LoyaltyModule {}

export const config = defineConfig({
  // …
  features: [LoyaltyModule],
});
```

- `@Reads(...categories)` names the categories a controller needs. Its routes exist only when those categories are
  served, so a shop without them has no half-working route.
- Every state-changing route of a feature module gets the CSRF check, including routes of the modules it imports.
- A feature reaches commerce data through SHOPin's injectable services, never through a vendor SDK; the boundary lint
  enforces that.

## A kind of port of your own

A shop with its own backend for something SHOPin has no category for (a company register, order rules) declares a
kind of port. The kind becomes a config key like the built-in categories:

```ts
declare module "@core/integration-kit" {
  interface ServingPorts {
    companyRegister?: CompanyRegister;
  }
}
```

An integration package then serves it, through `defineIntegration` and `port('companyRegister', …)`, the same way
SHOPin's integrations serve theirs (`core/integration-kit/README.md`).

## Your own pages

`config/storefront/storefront.mts` exports the shop's storefront slots:

- **`Pages`:** the shop's own pages by path. `{ 'company-register': CompanyRegisterPage }` serves
  `/company-register`, and a shop page wins over a CMS page of the same path. A page gets `path`, `searchParams`,
  `locale` and `bff`, a GET helper for the BFF. Its title and description come from Next's `metadata` or
  `generateMetadata` set on the component.
- **`SiteNotice`, `TrackingTags`, `PaymentStep`, `CartExtra`:** slot components, described in
  `core/integration-kit/src/author/storefront.ts`.
- **`PreviewRequest`:** how the CMS's preview button calls `/api/draft`. The configured CMS integration fills it;
  a shop sets it only for a CMS of its own.

A slot the shop leaves out renders nothing.
