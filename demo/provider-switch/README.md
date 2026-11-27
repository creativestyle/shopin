# @demo/provider-switch

The demo's per-request provider choice: the `/setup` page lets a presenter switch, say, commerce between
commercetools and mock data while the site runs. A real shop does not use it.

## Turning it on

The SHOPin demo has it on: `demo/shop/config/shopin.config.ts`, turned on by `npm run use demo`. In a
config of your own, give the switch the integrations per category (the first is the default) and let it serve those
categories; add its route for the /setup page:

```ts
import { defineConfig } from '@core/integration-kit'
import { commercetools } from '@integrations/commercetools-commerce/shopin'
import { mock } from '@integrations/mock-commerce/shopin'
import { mockIdentity } from '@integrations/mock-auth/shopin'
import { providerSwitch } from '@demo/provider-switch'
import { SwitchModule } from '@demo/provider-switch/module'

const switched = providerSwitch({
  commerce: [commercetools(), mock()],
  auth: [commercetools(), mockIdentity()],
})

export const config = defineConfig({
  commerce: switched,
  auth: switched,
  features: [SwitchModule],
})
```

## How it works

It uses the kit's public seams only; the framework names no switch.

- **BFF.** `providerSwitch` returns one integration that serves the listed categories through the listed ones
  (`delegates`): the BFF loads each of their ports with its own options, vault and customer and hands them to the
  switch's ports (`Delegates`). Each request picks a provider per category with its `X-<Category>-Provider` header
  (`RequestContext.header`), after the requirements (`requires`: e.g. mock sign-in only over mock commerce); a
  category no listed provider can serve for that request answers `501` with the reason. `servedBy` tells the BFF
  which one serves (it keys the shopper's tokens, customer link and sign-in by it). A delegate without its variables,
  or whose credentials check failed, is passed over.
- **Storefront.** The switch declares the storefront's variants (`storefront.variants`): one dimension per category
  with a choice (cookie `shopin-<category>`, header `X-<Category>-Provider`) and, per combination, what it serves or
  falls back to. The storefront renders one static variant per combination (`app/[variant]/`) and sends the headers.
- **The page.** `SwitchModule` adds `GET /bff/switch` (the view and this request's choice); `@demo/data-source-selector`
  renders it as the shop page `/setup` (`Pages` in `demo/storefront/src/storefront.mts`).
- **Tests.** `test/*.test.mjs` (resolution, forwarding, variants) and `../switch-scenarios` (the switch in the real BFF,
  through the framework's scenario harness).

Switching commerce or sign-in changes cart, wishlist and session: each commerce provider keeps its own cart and
session, so the panel says that the switch signs the shopper out and starts an empty cart before it applies it.
