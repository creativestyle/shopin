/**
 * Kit unit tests: one case per validation rule of defineConfig, env loading, start-up serving and the
 * provider resolution. Runs against the built dist (npm test builds first).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import kit from '../dist/index.js'
import core from '../dist/core.js'

/** The BFF's public URL in these tests (the BFF passes its own; there is no default). */
const BFF = 'https://bff.test/bff'
/** loadPorts with the tests' positional arguments: the variable reader, locales, the names the env sets, the BFF URL. */
const load = (config, get, locales = [], present = [], bffUrl = BFF) =>
  core.loadPorts(config, { get, bffUrl, locales, present })

const { defineConfig, Reads } = kit
const {
  configErrors,
  requiredEnv,
  resolveConfig,
  storefrontData,
  readsOf,
  validateConfig,
} = core

const port = (category) => () => ({ category, useFactory: () => ({}) })
const integ = (id, provides, extra = {}) => ({
  id,
  label: id,
  ports: Object.fromEntries(provides.map((c) => [c, port(c)])),
  ...extra,
})
const shop = integ('shop', ['commerce', 'search', 'auth'], {
  requires: {
    search: {
      needs: { commerce: 'shop' },
      reason: 'shop search reads the shop catalog',
    },
    auth: {
      needs: { commerce: 'shop' },
      reason: 'shop sign-in uses shop customers',
    },
  },
  env: {
    commerce: { key: { env: 'SHOP_KEY' } },
    search: { key: { env: 'SHOP_KEY' } },
  },
})
const other = integ('other', ['commerce', 'cms'])
const idp = integ('idp', ['auth'])
const errorsOf = (config) => configErrors(config)
const has = (config, text) =>
  assert.ok(
    errorsOf(config).some((e) => e.includes(text)),
    `${text} in ${errorsOf(config)}`
  )

test('a valid config passes and returns the config', () => {
  const config = {
    integrations: [shop, other],
    providers: { commerce: 'shop', search: 'shop', cms: 'other' },
  }
  assert.deepEqual(errorsOf(config), [])
  assert.deepEqual(
    defineConfig({ commerce: shop, search: shop, cms: other }),
    config
  )
})

test('rule: a commerce provider is required', () =>
  has(
    { integrations: [other], providers: { cms: 'other' } },
    'no commerce provider'
  ))

test('rule: a provider must be configured', () =>
  has(
    { integrations: [shop], providers: { commerce: 'shpo' } },
    'commerce uses "shpo", which is not configured'
  ))

test('rule: a provider must provide the category', () =>
  has(
    {
      integrations: [shop, other],
      providers: { commerce: 'shop', cms: 'shop' },
    },
    '"shop" does not provide cms'
  ))

test('rule: a requirement may only point at an earlier category', () => {
  const bad = integ('bad', ['commerce'], {
    requires: { commerce: { needs: { search: 'x' }, reason: 'r' } },
  })
  has(
    { integrations: [bad], providers: { commerce: 'bad' } },
    'may only need an earlier category, not search'
  )
})

test('rule: a requirement must be configured in its category', () =>
  has(
    {
      integrations: [shop, other],
      providers: { commerce: 'other', search: 'shop' },
    },
    '"shop" as search needs commerce "shop": shop search reads the shop catalog. Fix: serve commerce with "shop" too, or drop search'
  ))

test('rule: one integration with different options under two categories is refused (its hooks would vanish)', () => {
  const make = (mappers) =>
    integ('mock', ['commerce', 'search', 'cms'], { mappers })
  const card = (_raw, mapped) => mapped
  assert.throws(
    () =>
      defineConfig({
        commerce: make({ cart: card }),
        search: make({ productCard: card }),
      }),
    /"mock" is given different options under commerce and search: .*const shop = mock\(\{ … \}\)/
  )
  assert.throws(
    () => defineConfig({ commerce: make({ cart: card }), cms: make() }),
    /under commerce and cms/
  )
  // one shared instance, or instances made with the same options, are fine
  const shared = make({ cart: card, productCard: card })
  assert.doesNotThrow(() => defineConfig({ commerce: shared, search: shared }))
  assert.doesNotThrow(() =>
    defineConfig({ commerce: make(), search: make(), cms: make() })
  )
  const hooks = { cart: card }
  assert.doesNotThrow(() =>
    defineConfig({ commerce: make(hooks), search: make(hooks) })
  )
})

test("a vendor's parts (one package per category, one id) are merged into one provider", () => {
  const card = (_raw, mapped) => mapped
  const commerce = integ('acme', ['commerce'], {
    mappers: { cart: card },
    env: { commerce: { key: { env: 'ACME_KEY' } } },
    storefront: { productImages: ['img.acme.test'] },
  })
  const auth = integ('acme', ['auth'], {
    label: 'acme sign-in',
    env: { auth: { key: { env: 'ACME_KEY' } } },
    requires: {
      auth: { needs: { commerce: 'acme' }, reason: 'acme customers' },
    },
  })
  const config = defineConfig({ commerce, auth, cms: other })
  const acme = config.integrations.filter((i) => i.id === 'acme')
  assert.equal(acme.length, 1)
  assert.deepEqual(Object.keys(acme[0].ports).sort(), ['auth', 'commerce'])
  assert.deepEqual(Object.keys(acme[0].env).sort(), ['auth', 'commerce'])
  assert.equal(acme[0].mappers.cart, card)
  assert.equal(acme[0].label, 'acme')
  assert.deepEqual(acme[0].storefront.productImages, ['img.acme.test'])
  assert.deepEqual(config.providers, {
    commerce: 'acme',
    cms: 'other',
    auth: 'acme',
  })
  assert.deepEqual(errorsOf(config), [])
  // the same part twice with different options is still refused
  assert.throws(
    () =>
      defineConfig({
        commerce,
        search: integ('acme', ['commerce', 'search'], {
          mappers: { productCard: card },
        }),
      }),
    /"acme" is given different options under commerce and search/
  )
})

test("a vendor's parts as one provider keep the descriptor's description next to its name", () => {
  const commerce = integ('acme', ['commerce'], { label: 'Acme' })
  const auth = integ('acme', ['auth'], {
    label: 'Acme sign-in',
    description: {
      en: 'Sign-in with Acme accounts',
      de: 'Anmeldung mit Acme-Konten',
    },
  })
  const [merged] = defineConfig({ commerce, auth }).integrations.filter(
    (i) => i.id === 'acme'
  )
  assert.equal(merged.label, 'Acme')
  assert.deepEqual(merged.description, {
    en: 'Sign-in with Acme accounts',
    de: 'Anmeldung mit Acme-Konten',
  })
  const described = integ('acme', ['commerce'], {
    label: 'Acme',
    description: 'Catalog and carts',
  })
  const [first] = defineConfig({
    commerce: described,
    auth,
  }).integrations.filter((i) => i.id === 'acme')
  assert.equal(first.description, 'Catalog and carts')
})

test("rule: different options are refused at any delegate depth (a nested instance would replace the shop's own)", () => {
  const inner = (label) => integ('inner', ['commerce', 'search'], { label })
  const nest = (delegate) =>
    integ('top', ['commerce'], {
      delegates: [integ('mid', ['commerce'], { delegates: [delegate] })],
    })
  assert.throws(
    () =>
      defineConfig({ commerce: nest(inner('nested')), search: inner('own') }),
    /"inner" is given different options under commerce and search/
  )
  const one = inner('one')
  assert.equal(
    validateConfig({ commerce: nest(one), search: one }).errors.some((e) =>
      e.includes('different options')
    ),
    false
  )
})

test('rule: a category takes one integration (one that serves through others names them in delegates)', () =>
  assert.throws(
    () => defineConfig({ commerce: [shop, other] }),
    /commerce lists several integrations: one serves a category/
  ))

test('defineConfig: one integration per category key, the same integration under several keys counts once', () => {
  const config = defineConfig({
    commerce: shop,
    search: shop,
    cms: other,
  })
  assert.deepEqual(
    config.integrations.map((i) => i.id),
    ['shop', 'other']
  )
  assert.deepEqual(config.providers, {
    commerce: 'shop',
    search: 'shop',
    cms: 'other',
  })
})

test('rule: a part may not declare a core variable', () => {
  const sneaky = integ('sneaky', ['cms'], {
    env: { cms: { key: { env: 'JWT_SIGNING_KEY' } } },
  })
  has(
    {
      integrations: [shop, sneaky],
      providers: { commerce: 'shop', cms: 'sneaky' },
    },
    '"sneaky" declares the core variable JWT_SIGNING_KEY'
  )
})

test('rule: a part may not declare a system variable', () => {
  for (const name of ['PATH', 'NODE_OPTIONS', 'HOME']) {
    const greedy = integ('greedy', ['cms'], {
      env: { cms: { key: { env: name } } },
    })
    has(
      {
        integrations: [shop, greedy],
        providers: { commerce: 'shop', cms: 'greedy' },
      },
      `"greedy" declares the system variable ${name}`
    )
  }
})

test("rule: a part may not declare another integration's variable", () => {
  const thief = integ('thief', ['cms'], {
    env: { cms: { key: { env: 'SHOP_KEY' } } },
  })
  has(
    {
      integrations: [shop, thief],
      providers: { commerce: 'shop', cms: 'thief' },
    },
    'SHOP_KEY is declared by both "shop" and "thief"'
  )
})

test('rule: an unknown category key stops the config (a typo does not drop a category silently)', () =>
  assert.throws(
    () => defineConfig({ commerce: shop, payment: other }),
    /unknown key "payment" \(categories: commerce, search, cms, psp, auth, or a kind of port the integration under it provides\)/
  ))

const hooked = (i, mappers) => ({ ...i, mappers })
const hook = (_raw, mapped) => mapped

test('contracts: an extension of an extendable contract is kept for the BFF', () => {
  const cart = { parse: (x) => x }
  assert.equal(
    defineConfig({
      commerce: hooked(shop, { cart: hook }),
      contracts: { cart },
    }).contracts.cart,
    cart
  )
})

test('cartFields: the writable cart fields are kept for the BFF; a name the cart contract lacks is refused', () => {
  const cart = { parse: (x) => x, shape: { giftMessage: {}, loyaltyTier: {} } }
  const commerce = hooked(shop, { cart: hook })
  assert.deepEqual(
    defineConfig({ commerce, contracts: { cart }, cartFields: ['giftMessage'] })
      .cartFields,
    ['giftMessage']
  )
  assert.throws(
    () =>
      defineConfig({
        commerce,
        contracts: { cart },
        cartFields: ['giftMesage'],
      }),
    /cartFields: "giftMesage" is not a field of contracts\.cart/
  )
  // SHOPin's own cart fields are never the shop's to open, even when the extension redeclares them
  assert.throws(
    () =>
      defineConfig({
        commerce,
        contracts: {
          cart: { ...cart, shape: { ...cart.shape, shippingAddress: {} } },
        },
        cartFields: ['shippingAddress'],
      }),
    /cartFields: "shippingAddress" is SHOPin's own cart field/
  )
  assert.throws(
    () =>
      defineConfig({ commerce, contracts: { cart }, cartFields: ['toString'] }),
    /cartFields: "toString" is not a field of contracts\.cart/
  )
  // not set: nothing is writable (the BFF opens no field)
  assert.equal(
    defineConfig({ commerce, contracts: { cart } }).cartFields,
    undefined
  )
})

test('rule: every integration that fills an extended contract has its mapper hook (a swap cannot drop the field)', () => {
  const productCard = { parse: (x) => x }
  const commerce = hooked(integ('ct', ['commerce', 'search']), {
    productCard: hook,
  })
  // search moves from the commerce platform to another search integration without a card hook
  assert.throws(
    () =>
      defineConfig({
        commerce,
        search: integ('algolia', ['search']),
        contracts: { productCard },
      }),
    /contracts\.productCard adds the shop's fields, but "algolia" fills productCard without a mappers\.productCard hook/
  )
  assert.doesNotThrow(() =>
    defineConfig({
      commerce,
      search: hooked(integ('algolia', ['search']), { productCard: hook }),
      contracts: { productCard },
    })
  )
  // category pages come from commerce: its card hook is needed too
  assert.throws(
    () =>
      defineConfig({
        commerce: integ('ct', ['commerce']),
        search: hooked(integ('algolia', ['search']), { productCard: hook }),
        contracts: { productCard },
      }),
    /"ct" fills productCard without a mappers\.productCard hook/
  )
  // a cart extension needs a cart hook on commerce, not a card hook
  assert.throws(
    () =>
      defineConfig({
        commerce,
        search: commerce,
        contracts: { cart: productCard },
      }),
    /"ct" fills cart without a mappers\.cart hook/
  )
})

test("rule: the product page's product comes from commerce: an extension needs its product hook there", () => {
  const product = { parse: (x) => x }
  assert.throws(
    () =>
      defineConfig({
        commerce: hooked(integ('ct', ['commerce']), { productCard: hook }),
        contracts: { product },
      }),
    /"ct" fills product without a mappers\.product hook/
  )
  // search serves no product page: its card hook is enough for it
  assert.doesNotThrow(() =>
    defineConfig({
      commerce: hooked(integ('ct', ['commerce']), { product: hook }),
      search: integ('algolia', ['search']),
      contracts: { product },
    })
  )
})

test("features: the shop's own BFF modules are module classes, kept for the BFF", () => {
  class Feature {}
  const feature = Feature
  assert.deepEqual(
    defineConfig({ commerce: shop, features: [feature] }).features,
    [feature]
  )
  assert.throws(
    () => defineConfig({ commerce: shop, features: [{}] }),
    /features\[0\]: not a Nest module class/
  )
  // the index is the entry's place in the shop's list, not among the bad ones
  assert.throws(
    () => defineConfig({ commerce: shop, features: [feature, {}] }),
    /features\[1\]: not a Nest module class/
  )
})

test('Reads marks the categories a controller reads; an unmarked controller has none', () => {
  class Lookup {}
  Reads('companyRegister')(Lookup)
  assert.deepEqual(readsOf(Lookup), ['companyRegister'])
  class Open {}
  Reads()(Open)
  assert.deepEqual(readsOf(Open), [])
  assert.equal(readsOf(class Unmarked {}), undefined)
})

test('rule: contracts names only extendable contracts, each a schema', () => {
  assert.throws(
    () =>
      defineConfig({
        commerce: shop,
        contracts: { order: { parse: (x) => x } },
      }),
    /contracts\.order: not a schema of an extendable contract \(cart, productCard, product\)/
  )
  assert.throws(
    () => defineConfig({ commerce: shop, contracts: { cart: {} } }),
    /contracts\.cart: not a schema/
  )
})

const rules = integ('rules', ['orderRules'], {
  env: { orderRules: { blocked: { env: 'RULES_BLOCKED', optional: true } } },
  requires: {
    orderRules: {
      needs: { commerce: 'shop' },
      reason: 'rules read the shop catalog',
    },
  },
})

test("a shop's own kind of port is a config key served like a category, after SHOPin's", () => {
  const config = defineConfig({ commerce: shop, orderRules: rules })
  assert.deepEqual(Object.keys(config.providers), ['commerce', 'orderRules'])
  assert.equal(config.providers.orderRules, 'rules')
  const loaded = load(config, (n) => (n === 'SHOP_KEY' ? 'k' : undefined)).ports
  assert.deepEqual(
    loaded.map((p) => `${p.category}:${p.id}`),
    ['commerce:shop', 'orderRules:rules']
  )
})

test('rule: a shop kind needs an integration that provides it, and its requirements hold', () => {
  assert.throws(
    () => defineConfig({ commerce: shop, orderRules: other }),
    /unknown key "orderRules"/
  )
  assert.throws(
    () => defineConfig({ commerce: other, orderRules: rules }),
    /"rules" as orderRules needs commerce "shop": rules read the shop catalog/
  )
})

test('every problem is reported in one error', () => {
  const ghost = { ...other, id: 'ghost' }
  assert.throws(
    () =>
      defineConfig({
        commerce: [shop, ghost],
        search: other,
        cms: integ('pages', ['cms'], {
          env: { cms: { key: { env: 'JWT_SIGNING_KEY' } } },
        }),
      }),
    (e) =>
      /commerce lists several integrations/.test(e.message) &&
      /"other" does not provide search/.test(e.message) &&
      /declares the core variable JWT_SIGNING_KEY/.test(e.message)
  )
})

test('loadPorts reads only the serving ports and names every missing variable once, by integration', () => {
  const two = integ('two', ['cms', 'psp'], {
    env: {
      cms: { a: { env: 'TWO_A' }, s: { env: 'TWO_SHARED' } },
      psp: { b: { env: 'TWO_B' }, s: { env: 'TWO_SHARED' } },
    },
  })
  const config = {
    integrations: [shop, two],
    providers: {
      commerce: 'shop',
      search: 'shop',
      cms: 'two',
      psp: 'two',
    },
  }
  assert.throws(() => load(config, () => undefined), {
    message:
      'shopin.config: missing env for the chosen providers:\n' +
      '  - shop: SHOP_KEY\n' +
      '  - two: TWO_A, TWO_SHARED, TWO_B',
  })
  const read = []
  const loaded = load(config, (n) => (read.push(n), ` ${n}-value `)).ports
  assert.deepEqual(
    loaded.map((p) => `${p.category}:${p.id}`),
    ['commerce:shop', 'search:shop', 'cms:two', 'psp:two']
  )
  assert.equal(loaded[2].options.a, 'TWO_A-value')
  assert.deepEqual([...new Set(read)].sort(), [
    'SHOP_KEY',
    'TWO_A',
    'TWO_B',
    'TWO_SHARED',
  ])
})

test('loadPorts refuses a port declared for another category', () => {
  const wrong = integ('wrong', ['cms'])
  wrong.ports.cms = () => ({ category: 'search', useFactory: () => ({}) })
  assert.throws(
    () =>
      load(
        {
          integrations: [shop, wrong],
          providers: { commerce: 'shop', cms: 'wrong' },
        },
        () => 'v'
      ),
    /"wrong" ports.cms must return port\('cms', …\)/
  )
})

test("optional services follow the commerce provider: a descriptor's omits reach the storefront's capabilities", () => {
  const plain = integ('plain', ['commerce'], { omits: ['wishlist'] })
  const services = (i) =>
    storefrontData({ integrations: [i], providers: { commerce: i.id } })
      .variants.combinations[''].services
  assert.deepEqual(services(plain), { wishlist: false })
  assert.deepEqual(services(other), { wishlist: true })
})

test("a reason given per language is read in the shopper's language, English by default and as fallback", () => {
  const translated = integ('shop', ['commerce', 'search'], {
    requires: {
      search: {
        needs: { commerce: 'shop' },
        reason: { en: 'reads the shop catalog', de: 'liest den Shop-Katalog' },
      },
    },
  })
  const unavailable = (language) =>
    core.reasonIn(translated.requires.search.reason, language)
  assert.equal(unavailable(), 'reads the shop catalog')
  assert.equal(unavailable('de-DE'), 'liest den Shop-Katalog')
  assert.equal(unavailable('de'), 'liest den Shop-Katalog')
  assert.equal(unavailable('fr-FR'), 'reads the shop catalog')
  // boot errors are English
  has(
    {
      integrations: [translated, other],
      providers: { commerce: 'other', search: 'shop' },
    },
    'needs commerce "shop": reads the shop catalog'
  )
})

test('without an integration that declares variants the storefront has one combination: the configured providers', () => {
  const config = {
    integrations: [shop, other],
    providers: { commerce: 'shop', cms: 'other' },
  }
  const { variants, labels } = storefrontData(config)
  assert.deepEqual(variants.dimensions, [])
  assert.deepEqual(variants.combinations[''].providers, {
    commerce: 'shop',
    cms: 'other',
  })
  assert.deepEqual(labels, { shop: 'shop', other: 'other' })
})

test("delegates: the BFF loads each delegate's port next to the serving one; one without its variables is unavailable, not a boot error", () => {
  const keyed = integ('keyed', ['commerce'], {
    env: { commerce: { k: { env: 'KEYED_KEY' } } },
  })
  const router = integ('router', ['commerce'], { delegates: [keyed, other] })
  const config = resolveConfig({ commerce: router, cms: other })
  assert.deepEqual(
    config.integrations.map((i) => i.id),
    ['router', 'keyed', 'other']
  )
  const { ports, unavailable } = load(config, () => undefined)
  assert.deepEqual(
    ports.map((p) => `${p.category}:${p.id}${p.via ? `<${p.via}` : ''}`),
    ['commerce:other<router', 'commerce:router', 'cms:other']
  )
  assert.deepEqual(unavailable, [
    {
      category: 'commerce',
      id: 'keyed',
      via: 'router',
      reason: 'its variables are not set (KEYED_KEY): add them to .env',
    },
  ])
})

test('delegates: the variants a serving integration declares reach the storefront, with the fixed categories and services filled in', () => {
  const plain = integ('plain', ['commerce'], { omits: ['wishlist'] })
  const variants = {
    dimensions: [
      {
        name: 'commerce',
        cookie: 'c',
        header: 'X-C',
        values: ['plain', 'other'],
        default: 'plain',
      },
    ],
    combinations: {
      plain: { providers: { commerce: 'plain' }, unavailable: {} },
      other: { providers: { commerce: 'other' }, unavailable: {} },
    },
  }
  const config = resolveConfig({
    commerce: integ('router', ['commerce'], {
      delegates: [plain, other],
      storefront: { variants },
    }),
    cms: other,
  })
  const data = storefrontData(config).variants
  assert.deepEqual(data.dimensions, variants.dimensions)
  assert.deepEqual(data.combinations.plain, {
    providers: { cms: 'other', commerce: 'plain' },
    unavailable: {},
    services: { wishlist: false },
  })
  assert.equal(data.combinations.other.services.wishlist, true)
})

test('the slots a serving integration fills reach the storefront data; the first delegate of a category wins', () => {
  const pay = (id, ref) =>
    integ(id, ['commerce', 'psp'], {
      storefront: { slots: { psp: { PaymentStep: ref } } },
    })
  const a = pay('a', '@x/a-ui#AStep')
  const config = resolveConfig({
    commerce: a,
    psp: integ('router', ['psp'], {
      delegates: [a, pay('b', '@x/b-ui#BStep')],
    }),
  })
  assert.deepEqual(storefrontData(config).slots, {
    PaymentStep: { from: '@x/a-ui', name: 'AStep', by: 'a (psp)' },
  })
  const unused = resolveConfig({ commerce: integ('c', ['commerce']) })
  assert.deepEqual(storefrontData(unused).slots, {})
})

test("delegates: a delegate's need on a category its integration does not serve holds for the config", () => {
  const router = integ('router', ['search'], { delegates: [shop, other] })
  assert.doesNotThrow(() => defineConfig({ commerce: shop, search: router }))
  assert.throws(
    () => defineConfig({ commerce: other, search: router }),
    /"shop" as search \(through "router"\) needs commerce "shop": shop search reads the shop catalog/
  )
})

test("conditional variables: setup's list and the BFF's first message name the same variables, with why", () => {
  const shopCommerce = integ('shop', ['commerce'], {
    env: {
      commerce: {
        key: { env: 'SHOP_KEY' },
        stores: {
          env: 'SHOP_STORES',
          optional: true,
          requiredWhen: ({ locales }) =>
            locales.length > 1
              ? `a store per locale (${locales.join(', ')})`
              : undefined,
        },
        link: {
          env: 'SHOP_LINK',
          optional: true,
          requiredWhen: ({ providers }) =>
            providers.auth?.some((id) => id !== 'shop')
              ? 'sign-in through another provider links customers'
              : undefined,
        },
      },
    },
  })
  const config = resolveConfig({ commerce: shopCommerce, auth: idp })
  const listed = requiredEnv(config, ['en-US', 'de-DE'])
  assert.deepEqual(listed.required, {
    shop: ['SHOP_KEY', 'SHOP_STORES', 'SHOP_LINK'],
  })
  assert.match(listed.reasons.shop.SHOP_LINK, /links customers/)
  // the BFF asks for exactly these, in one message
  assert.throws(
    () => load(config, () => undefined, ['en-US', 'de-DE']),
    (e) =>
      /shop: SHOP_KEY, SHOP_STORES, SHOP_LINK/.test(e.message) &&
      /SHOP_LINK: sign-in through/.test(e.message)
  )
  const set = new Set(Object.values(listed.required).flat())
  assert.doesNotThrow(() =>
    load(config, (n) => (set.has(n) ? 'x' : undefined), ['en-US', 'de-DE'])
  )
  // one locale and no other sign-in: neither is needed
  assert.deepEqual(
    requiredEnv(resolveConfig({ commerce: shopCommerce }), ['en-US']).required,
    { shop: ['SHOP_KEY'] }
  )
})

test('checkEndpoint: an unreachable host, refused credentials and a missing resource each name the host and the variable', async () => {
  const { checkEndpoint } = kit
  const vars = {
    host: 'VENDOR_URL',
    credentials: 'VENDOR_TOKEN',
    notFound: 'VENDOR_INDEX',
  }
  // port 9 on the loopback: nothing listens there
  await assert.rejects(checkEndpoint('http://127.0.0.1:9/x', {}, vars), (e) => {
    assert.match(
      e.message,
      /^127\.0\.0\.1:9 cannot be reached \(VENDOR_URL\): \S+/
    )
    assert.doesNotMatch(e.message, /^fetch failed$/)
    return true
  })
  const { createServer } = await import('node:http')
  const server = createServer((req, res) => {
    res.statusCode =
      req.url === '/missing' ? 404 : req.url === '/ok' ? 200 : 401
    res.end()
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    await assert.rejects(
      checkEndpoint(`${base}/secret`, {}, vars),
      /refused the credentials \(VENDOR_TOKEN\): HTTP 401/
    )
    await assert.rejects(
      checkEndpoint(`${base}/missing`, {}, vars),
      /has nothing at \/missing \(VENDOR_INDEX\): HTTP 404/
    )
    await checkEndpoint(`${base}/ok`, {}, vars)
  } finally {
    server.close()
  }
})

test('requiredEnv: declared-optional variables and those of an integration that only serves through another are optional, with why', () => {
  const keyed = integ('keyed', ['commerce'], {
    env: {
      commerce: {
        k: { env: 'KEYED_KEY' },
        secret: { env: 'KEYED_SECRET', optional: true },
      },
    },
  })
  const router = integ('router', ['commerce'], { delegates: [keyed, other] })
  const listed = requiredEnv(resolveConfig({ commerce: router, cms: other }))
  // the BFF starts without them (the delegate is unavailable), so setup lists them as optional
  assert.deepEqual(listed.required, {})
  assert.deepEqual(Object.keys(listed.optional.keyed), [
    'KEYED_KEY',
    'KEYED_SECRET',
  ])
  assert.match(
    listed.optional.keyed.KEYED_KEY,
    /^optional: without it "keyed" is unavailable and "router" serves without it$/
  )
  // serving directly: the needed one is required, the declared-optional one stays optional
  const direct = requiredEnv(resolveConfig({ commerce: keyed }))
  assert.deepEqual(direct.required, { keyed: ['KEYED_KEY'] })
  assert.deepEqual(direct.optional, {
    keyed: { KEYED_SECRET: 'optional (its README says when to set it)' },
  })
})

test('a misspelled config key comes with the key it is close to', () => {
  const shop = integ('shop', ['commerce', 'search'])
  assert.throws(
    () => defineConfig({ commerce: shop, serch: shop }),
    /unknown key "serch" \(did you mean "search"\?\)/
  )
  assert.throws(
    () => defineConfig({ commerce: shop, zzzz: shop }),
    (e) => /unknown key "zzzz" \(categories/.test(e.message)
  )
})

test("the BFF's missing-variable message names a misspelling the environment sets", () => {
  const cms = integ('cms-x', ['cms'], {
    env: { cms: { space: { env: 'CONTENTFUL_SPACE' } } },
  })
  const config = resolveConfig({ commerce: integ('c', ['commerce']), cms })
  assert.throws(
    () => load(config, () => undefined, [], ['CONTENTFUL_SAPCE', 'LOG_LEVEL']),
    /CONTENTFUL_SPACE: did you mean it\? \.env sets CONTENTFUL_SAPCE/
  )
})

test("{BFF_URL} in a default or a value stands for the BFF's public URL; a value set wins", () => {
  const idp = integ('idp-x', ['auth'], {
    env: {
      auth: {
        redirectUri: {
          env: 'X_REDIRECT_URI',
          default: '{BFF_URL}/auth/redirect/callback',
        },
      },
    },
  })
  const config = resolveConfig({
    commerce: integ('c', ['commerce']),
    auth: idp,
  })
  const optionsOf = (get) =>
    load(config, get, [], [], 'https://shop.example/bff').ports.find(
      (p) => p.category === 'auth'
    ).options
  assert.equal(
    optionsOf(() => undefined).redirectUri,
    'https://shop.example/bff/auth/redirect/callback'
  )
  assert.equal(
    optionsOf(() => 'https://other.example/cb').redirectUri,
    'https://other.example/cb'
  )
  assert.equal(
    optionsOf(() => '{BFF_URL}/cb').redirectUri,
    'https://shop.example/bff/cb'
  )
})

test("checkEndpoint: a vendor's fixed host names no variable when unreachable, it points at the network", async () => {
  await assert.rejects(
    kit.checkEndpoint(
      'http://127.0.0.1:9/x',
      {},
      { credentials: 'VENDOR_TOKEN' }
    ),
    (e) =>
      /^127\.0\.0\.1:9 cannot be reached \(the vendor's fixed host: check this machine's network or proxy\): \S+/.test(
        e.message
      )
  )
})

test('port() tags a definition with its category; defineIntegration returns the descriptor as given', () => {
  const definition = kit.port('cms', { useFactory: () => ({}) })
  assert.equal(definition.category, 'cms')
  assert.equal(typeof definition.useFactory, 'function')
  const descriptor = { id: 'acme', ports: { cms: () => definition } }
  assert.equal(kit.defineIntegration(descriptor), descriptor)
  assert.equal(descriptor.ports.cms().category, 'cms')
})

test('loadPorts: a port whose package is not installed says to run setup; any other error passes through unchanged', () => {
  const failing = (id, error) => {
    const i = integ(id, ['cms'])
    i.ports.cms = () => {
      throw error
    }
    return { integrations: [shop, i], providers: { commerce: 'shop', cms: id } }
  }
  const missing = Object.assign(
    new Error("Cannot find module '@x/cms'\nRequire stack:\n- /app/x.js"),
    { code: 'MODULE_NOT_FOUND' }
  )
  assert.throws(() => load(failing('absent', missing), () => 'v'), {
    message:
      'shopin.config: "absent" (cms) cannot load: Cannot find module \'@x/cms\'. Its packages are not installed for this config: run npm run setup',
  })
  const boom = new Error('boom')
  assert.throws(
    () => load(failing('broken', boom), () => 'v'),
    (e) => e === boom
  )
})

test('requiredEnv: a variable with a default is listed under defaults, not required; its form reaches forms', () => {
  const hooked = integ('hooked', ['commerce'], {
    env: {
      commerce: {
        url: {
          env: 'HOOKED_URL',
          default: '{BFF_URL}/hook',
          form: '<BFF URL>/hook',
        },
        key: { env: 'HOOKED_KEY' },
      },
    },
  })
  const listed = requiredEnv(resolveConfig({ commerce: hooked }))
  assert.deepEqual(listed.required, { hooked: ['HOOKED_KEY'] })
  assert.deepEqual(listed.defaults, {
    hooked: { HOOKED_URL: '{BFF_URL}/hook' },
  })
  assert.deepEqual(listed.forms, { hooked: { HOOKED_URL: '<BFF URL>/hook' } })
})

test('storefrontData: image hosts come only from integrations that serve a category', () => {
  const pictured = (id) =>
    integ(id, ['commerce', 'cms'], {
      storefront: {
        productImages: { hosts: [`${id}.test`] },
        contentImages: { hosts: [`cdn.${id}.test`] },
      },
    })
  const data = storefrontData({
    integrations: [pictured('used'), pictured('listed')],
    providers: { commerce: 'used', cms: 'used' },
  })
  assert.deepEqual(data.productImages, [{ hosts: ['used.test'] }])
  assert.deepEqual(data.contentImages, [{ hosts: ['cdn.used.test'] }])
})

test('storefrontData: preview origins come only from the integration serving cms', () => {
  const framing = (id, serves) =>
    integ(id, serves, {
      storefront: { previewOrigins: [`https://editor.${id}.test`] },
    })
  const data = storefrontData({
    integrations: [
      framing('shop', ['commerce']),
      framing('pages', ['cms']),
      framing('unused', ['cms']),
    ],
    providers: { commerce: 'shop', cms: 'pages' },
  })
  assert.deepEqual(data.previewOrigins, ['https://editor.pages.test'])
  assert.deepEqual(
    storefrontData({
      integrations: [integ('shop', ['commerce'])],
      providers: { commerce: 'shop' },
    }).previewOrigins,
    []
  )
})
