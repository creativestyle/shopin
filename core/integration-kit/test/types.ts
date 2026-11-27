/** Type tests (tsc -p test): the config only accepts an integration that provides the category. */
import {
  defineConfig,
  defineIntegration,
  port,
  type Port,
  type ServingPorts,
  type StorefrontSlots,
} from '../src'

interface OrderRules {
  check(cartId: string): Promise<boolean>
}

// a kind of port the shop serves itself: its package adds it to ServingPorts once (docs/extending.md), which
// makes it a config key and types its port
declare module '../src' {
  interface ServingPorts {
    orderRules?: OrderRules
  }
}

const shop = defineIntegration({
  id: 'shop',
  ports: {
    commerce: () => port('commerce', { useFactory: () => ({}) as never }),
    search: () => port('search', { useFactory: () => ({}) as never }),
  },
})
const pages = defineIntegration({
  id: 'pages',
  ports: { cms: () => port('cms', { useFactory: () => ({}) as never }) },
})

defineConfig({ commerce: shop, search: shop, cms: pages })

// a misspelled category: Object literal may only specify known properties ... Did you mean to write 'search'?
// @ts-expect-error
defineConfig({ commerce: shop, serach: shop })

// a key nobody declared
// @ts-expect-error
defineConfig({ commerce: shop, companyRegister: pages })

const rules = defineIntegration({
  id: 'rules',
  ports: {
    orderRules: () =>
      port('orderRules', { useFactory: () => ({ check: async () => true }) }),
  },
})
defineConfig({ commerce: shop, orderRules: rules })

// the kind's port is typed by the declaration: a factory must return it
defineIntegration({
  id: 'bad-rules',
  ports: {
    // @ts-expect-error Property 'check' is missing
    orderRules: () => port('orderRules', { useFactory: () => ({}) }),
  },
})

// a shop feature reads the kind, typed, from the serving ports
const readRules = (ports: ServingPorts): OrderRules | undefined =>
  ports.orderRules
const rulesPort: Port<'orderRules'> = { check: async () => false }
void readRules
void rulesPort

// the shop's BFF features: module classes
class LookupModule {}
defineConfig({ commerce: shop, features: [LookupModule] })
// @ts-expect-error an object, not a module class
defineConfig({ commerce: shop, features: [{}] })

// slots typed with the shop's own fields (optional, as the contract requires) fit the slot
type ShopCart = Parameters<
  NonNullable<StorefrontSlots['CartExtra']>
>[0]['cart'] & {
  giftMessage?: string
}
const GiftMessage = ({ cart }: { cart: ShopCart }) => cart.giftMessage ?? null
const extra: StorefrontSlots['CartExtra'] = GiftMessage
void extra
// a slot that needs a field the contract does not always carry does not fit
const Strict = ({ cart }: { cart: { giftMessage: string } }) => cart.giftMessage
// @ts-expect-error Property 'giftMessage' is missing
const strict: StorefrontSlots['CartExtra'] = Strict
void strict

// the declared kind still needs an integration that provides it
// @ts-expect-error
defineConfig({ commerce: shop, orderRules: pages })

// a CMS integration under commerce: Property 'commerce' is missing in type ... 'pages'
// @ts-expect-error
defineConfig({ commerce: pages })

// commerce is required
// @ts-expect-error
defineConfig({ cms: pages })

// a port must return the category's interface
defineIntegration({
  id: 'bad',
  ports: {
    // @ts-expect-error Type '{ nope: boolean; }' is not assignable to type 'Pick<AllServices, "pageService" | "layoutService">'
    cms: () => port('cms', { useFactory: () => ({ nope: true }) }),
  },
})

// a port of another category under a key: Type 'PortDefinition<"search">' is not assignable to 'PortDefinition<"cms">'
defineIntegration({
  id: 'mixed',
  ports: {
    // @ts-expect-error
    cms: () => port('search', { useFactory: () => ({}) as never }),
  },
})

// The descriptor names an integration (`label`) and says what it does (`description`), each one text or one per
// language (`en` required); the /setup switcher shows both.
defineIntegration({
  id: 'described',
  label: { en: 'Sample data', de: 'Beispieldaten' },
  description: { en: 'Generated, no account', de: 'Erzeugt, ohne Konto' },
  ports: { cms: () => port('cms', { useFactory: () => ({}) as never }) },
})
defineIntegration({
  id: 'described-plain',
  label: 'Sample data',
  description: 'Generated, no account',
  ports: { cms: () => port('cms', { useFactory: () => ({}) as never }) },
})
defineIntegration({
  id: 'described-no-en',
  // @ts-expect-error Property 'en' is missing
  description: { de: 'Erzeugt, ohne Konto' },
  ports: { cms: () => port('cms', { useFactory: () => ({}) as never }) },
})

// Storefront slots are optional: a shop file written before a slot existed (here: only the first three) still
// type-checks, so a release that adds a slot never breaks it; a misspelled slot name still fails.
const PaymentPage = () => null
;({
  SiteNotice: undefined,
  PaymentStep: PaymentPage,
  TrackingTags: undefined,
}) satisfies StorefrontSlots
// @ts-expect-error Object literal may only specify known properties ('PaymnetStep')
;({ PaymnetStep: PaymentPage }) satisfies StorefrontSlots
// Only slots the storefront mounts exist: a slot nothing renders is not offered (no product extra, payment
// note or shop texts until the storefront wires them).
// @ts-expect-error Object literal may only specify known properties ('ProductExtra')
;({ ProductExtra: PaymentPage }) satisfies StorefrontSlots
// @ts-expect-error Object literal may only specify known properties ('PaymentNote')
;({ PaymentNote: PaymentPage }) satisfies StorefrontSlots
// @ts-expect-error Object literal may only specify known properties ('Messages')
;({ Messages: {} }) satisfies StorefrontSlots

// The BFF URL has no default: loadPorts needs it from the caller (the BFF's own config), never a hardcoded host.
import { loadPorts, resolveConfig } from '../src/core'
const resolved = resolveConfig({})
// @ts-expect-error Property 'bffUrl' is missing
loadPorts(resolved, { get: () => undefined })
loadPorts(resolved, { get: () => undefined, bffUrl: 'https://bff.example/bff' })
