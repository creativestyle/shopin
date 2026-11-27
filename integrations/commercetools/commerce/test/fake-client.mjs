/**
 * In-memory stand-ins for the commercetools project API client (customers, carts, `me`) and for fetch
 * (OAuth). Each records the calls it serves, so a test can list exactly what the integration asked
 * commercetools for. No network.
 */

/**
 * @typedef {{
 *   id: string
 *   version: number
 *   email: string
 *   externalId?: string
 *   authenticationMode?: string
 *   isEmailVerified?: boolean
 *   firstName?: string
 *   lastName?: string
 * }} FakeCustomer
 */

/**
 * @typedef {{
 *   id: string
 *   version: number
 *   customerId?: string
 *   currency?: string
 *   lineItems?: FakeLineItem[]
 *   totalPrice?: { centAmount: number; currencyCode: string }
 *   custom?: { type: { typeId: 'type'; id: string }; fields: Record<string, unknown> }
 * }} FakeCart
 */

/**
 * A Custom Type of the project: its key and the names of its fields.
 * @typedef {{ id: string; key: string; fieldDefinitions: { name: string }[] }} FakeType
 */

/**
 * @typedef {{
 *   id: string
 *   productId: string
 *   variantId: number
 *   quantity: number
 *   name: Record<string, string>
 *   price: { value: { centAmount: number; currencyCode: string } }
 *   totalPrice: { centAmount: number; currencyCode: string }
 * }} FakeLineItem
 */

/**
 * A published product as the product projection API answers it (one variant, one price).
 * @typedef {{
 *   id: string
 *   createdAt: string
 *   name: Record<string, string>
 *   slug: Record<string, string>
 *   masterVariant: {
 *     id: number
 *     prices: {
 *       id: string
 *       value: { type: 'centPrecision'; centAmount: number; currencyCode: string; fractionDigits: number }
 *     }[]
 *   }
 * }} FakeProduct
 */

/** @typedef {FakeCart & { orderNumber: string; createdAt: string; orderState: string }} FakeOrder */

const notFound = () =>
  Object.assign(new Error('not found'), {
    statusCode: 404,
    body: { statusCode: 404 },
  })

/** The project API (server client): customers, carts with line items, orders and product projections. */
export class FakeProjectClient {
  /** @type {FakeCustomer[]} */
  customers_ = []
  /** @type {FakeCart[]} */
  carts_ = []
  /** @type {FakeOrder[]} */
  orders_ = []
  /** @type {FakeProduct[]} */
  products_ = []
  /** @type {FakeType[]} */
  types_ = []
  /** Shopping lists; `customer` is the owner's reference. @type {{ id: string; version: number; customer?: { id: string }; lineItems: object[] }[]} */
  lists_ = []
  /** Calls on shopping lists. @type {string[]} */
  listCalls = []
  /** The next cart updates answer 409 (another change came first), this many times. */
  conflicts = 0
  /** The error code of those 409s (commercetools' version conflict by default). */
  conflictCode = 'ConcurrentModification'
  /** Calls on customers, in order. @type {string[]} */
  calls = []
  /** Calls on carts, kept apart from the customer calls. @type {string[]} */
  cartCalls = []
  #n = 0

  #match(where) {
    // a predicate string literal: backslash escapes undone
    const literal = (field) =>
      where.match(new RegExp(`^${field}="(.*)"$`))?.[1]?.replace(/\\(.)/g, '$1')
    const ext = literal('externalId')
    const email = literal('lowercaseEmail')
    return this.customers_.filter((c) =>
      ext !== undefined
        ? c.externalId === ext
        : email !== undefined
          ? c.email.toLowerCase() === email
          : false
    )
  }

  customers() {
    return {
      get: ({ queryArgs }) => ({
        execute: async () => {
          this.calls.push(`GET customers where ${queryArgs.where}`)
          // as commercetools: at most `limit` results (its default is 20)
          return {
            body: {
              results: this.#match(queryArgs.where).slice(
                0,
                queryArgs.limit ?? 20
              ),
            },
          }
        },
      }),
      post: ({ body }) => ({
        execute: async () => {
          this.calls.push(
            `POST customers ${body.authenticationMode} externalId=${body.externalId}`
          )
          const c = { id: `ct-customer-${++this.#n}`, version: 1, ...body }
          this.customers_.push(c)
          return { body: { customer: c } }
        },
      }),
      withId: ({ ID }) => ({
        get: () => ({
          execute: async () => {
            this.calls.push(`GET customers/${ID}`)
            const c = this.customers_.find((x) => x.id === ID)
            if (!c) {
              throw notFound()
            }
            return { body: c }
          },
        }),
        post: ({ body }) => ({
          execute: async () => {
            const c = this.customers_.find((x) => x.id === ID)
            for (const a of body.actions) {
              this.calls.push(
                `POST customers/${ID} v${body.version} ${a.action} ${a.externalId}`
              )
              if (a.action === 'setExternalId') {
                c.externalId = a.externalId
              }
            }
            c.version++
            return { body: c }
          },
        }),
      }),
    }
  }

  carts() {
    const find = (ID) => {
      const c = this.carts_.find((x) => x.id === ID)
      if (!c) {
        throw notFound()
      }
      return c
    }
    return {
      get: ({ queryArgs }) => ({
        execute: async () => {
          const where = [queryArgs.where ?? []].flat()
          this.cartCalls.push(`GET carts where ${where.join(' and ')}`)
          const id = where
            .map((w) => w.match(/^customerId="(.*)"$/)?.[1])
            .find(Boolean)
          const results = this.carts_.filter((c) => c.customerId === id)
          return {
            body: { results, limit: 1, offset: 0, count: results.length },
          }
        },
      }),
      post: ({ body }) => ({
        execute: async () => {
          this.cartCalls.push(`POST carts customerId=${body.customerId}`)
          const c = {
            id: `ct-cart-${++this.#n}`,
            version: 1,
            ...body,
            lineItems: [],
            totalPrice: { centAmount: 0, currencyCode: body.currency ?? 'USD' },
          }
          this.carts_.push(c)
          return { body: c }
        },
      }),
      withId: ({ ID }) => ({
        get: () => ({
          execute: async () => {
            this.cartCalls.push(`GET carts/${ID}`)
            return { body: find(ID) }
          },
        }),
        post: ({ body }) => ({
          execute: async () => {
            const c = find(ID)
            if (this.conflicts > 0) {
              this.conflicts--
              this.cartCalls.push(`POST carts/${ID} 409`)
              throw Object.assign(new Error('conflict'), {
                statusCode: 409,
                body: { errors: [{ code: this.conflictCode }] },
              })
            }
            for (const a of body.actions) {
              this.cartCalls.push(
                `POST carts/${ID} ${a.action} ${a.customerId ?? a.productId ?? ''}`.trim()
              )
              if (a.action === 'setCustomerId') {
                c.customerId = a.customerId
              }
              if (a.action === 'addLineItem') {
                this.#addLine(c, a)
              }
              if (a.action === 'setCustomType') {
                const t = this.types_.find((x) => x.key === a.type.key)
                if (!t) {
                  // as commercetools answers a reference to a type the project lacks
                  const message = `The referenced object of type 'type' with key '${a.type.key}' was not found. It either doesn't exist, or it can't be accessed from this endpoint.`
                  throw Object.assign(new Error(message), {
                    statusCode: 400,
                    body: {
                      statusCode: 400,
                      message,
                      errors: [{ code: 'ReferencedResourceNotFound', message }],
                    },
                  })
                }
                c.custom = {
                  type: { typeId: 'type', id: t.id },
                  fields: { ...a.fields },
                }
              }
              if (a.action === 'setCustomField') {
                if (a.value === undefined) {
                  delete c.custom.fields[a.name]
                } else {
                  c.custom.fields[a.name] = a.value
                }
              }
            }
            c.version++
            return { body: c }
          },
        }),
      }),
    }
  }

  #addLine(c, a) {
    const p = this.products_.find((x) => x.id === a.productId)
    if (!p) {
      throw notFound()
    }
    const price = p.masterVariant.prices[0].value
    const quantity = a.quantity ?? 1
    c.lineItems.push({
      id: `ct-line-${++this.#n}`,
      productId: p.id,
      variantId: a.variantId ?? p.masterVariant.id,
      quantity,
      name: p.name,
      price: { value: price },
      totalPrice: {
        centAmount: price.centAmount * quantity,
        currencyCode: price.currencyCode,
      },
    })
    c.totalPrice = {
      centAmount: c.lineItems.reduce((s, l) => s + l.totalPrice.centAmount, 0),
      currencyCode: price.currencyCode,
    }
  }

  /** Custom Types, read by id. */
  types() {
    return {
      withId: ({ ID }) => ({
        get: () => ({
          execute: async () => {
            this.cartCalls.push(`GET types/${ID}`)
            const t = this.types_.find((x) => x.id === ID)
            if (!t) {
              throw notFound()
            }
            return { body: t }
          },
        }),
      }),
    }
  }

  /** Published product projections, found by slug (`where: slug(<locale>="<slug>")`). */
  productProjections() {
    return {
      get: ({ queryArgs }) => ({
        execute: async () => {
          const slug = queryArgs.where.match(/^slug\([^=]+="(.*)"\)$/)?.[1]
          const results = this.products_.filter((p) =>
            Object.values(p.slug).includes(slug ?? '')
          )
          return {
            body: { results, total: results.length, offset: 0, limit: 1 },
          }
        },
      }),
    }
  }

  /** Orders: created from a cart (it then is ordered, not active), read by id. */
  orders() {
    return {
      post: ({ body }) => ({
        execute: async () => {
          this.cartCalls.push(`POST orders from carts/${body.cart.id}`)
          const cart = this.carts_.find((x) => x.id === body.cart.id)
          if (!cart) {
            throw notFound()
          }
          this.carts_.splice(this.carts_.indexOf(cart), 1)
          const order = {
            ...cart,
            id: `ct-order-${++this.#n}`,
            version: 1,
            orderNumber: String(this.orders_.length + 1).padStart(5, '0'),
            createdAt: new Date().toISOString(),
            orderState: 'Open',
          }
          this.orders_.push(order)
          return { body: order }
        },
      }),
      withId: ({ ID }) => ({
        get: () => ({
          execute: async () => {
            this.cartCalls.push(`GET orders/${ID}`)
            const order = this.orders_.find((x) => x.id === ID)
            if (!order) {
              throw notFound()
            }
            return { body: order }
          },
        }),
      }),
    }
  }

  /** Shopping lists (the wishlist): queried by customer, created, read and changed by id. Calls go to `listCalls`. */
  shoppingLists() {
    const find = (ID) => {
      const l = this.lists_.find((x) => x.id === ID)
      if (!l) {
        throw notFound()
      }
      return l
    }
    return {
      get: ({ queryArgs }) => ({
        execute: async () => {
          const where = [queryArgs.where ?? []].flat()
          this.listCalls.push(`GET shopping-lists where ${where.join(' and ')}`)
          const id = where
            .map((w) => w.match(/^customer\(id="(.*)"\)$/)?.[1])
            .find(Boolean)
          const results = this.lists_.filter((l) => l.customer?.id === id)
          return {
            body: { results, limit: 1, offset: 0, count: results.length },
          }
        },
      }),
      post: ({ body }) => ({
        execute: async () => {
          this.listCalls.push(
            `POST shopping-lists customer=${body.customer?.id}`
          )
          const l = { id: `ct-list-${++this.#n}`, version: 1, ...body }
          l.lineItems = []
          this.lists_.push(l)
          return { body: l }
        },
      }),
      withId: ({ ID }) => ({
        get: () => ({
          execute: async () => {
            this.listCalls.push(`GET shopping-lists/${ID}`)
            return { body: find(ID) }
          },
        }),
        post: ({ body }) => ({
          execute: async () => {
            const l = find(ID)
            for (const a of body.actions) {
              this.listCalls.push(
                `POST shopping-lists/${ID} ${a.action} ${a.productId ?? a.lineItemId ?? ''}`.trim()
              )
              if (a.action === 'addLineItem') {
                l.lineItems.push({
                  id: `ct-list-line-${++this.#n}`,
                  productId: a.productId,
                  name: { 'en-US': a.productId },
                  variant: { id: a.variantId ?? 1 },
                  quantity: a.quantity ?? 1,
                })
              }
            }
            l.version++
            return { body: l }
          },
        }),
      }),
    }
  }
}

/**
 * The `me` API of one access token: answers for the carts that token owns (a guest's anonymous session) and
 * for the customer the token belongs to. Records every call with the token it came with.
 *
 * Given `owned.data` (the token owner's carts, orders and shopping lists on the project's side), it also answers
 * what commercetools' own sign-in does through `me()`: cart updates, orders from a cart, the shopper's shopping
 * lists, and catalog reads with that token. Without it, carts read as `{ id, version: 1 }` and no order is owned.
 */
export class FakeMeClient {
  #owned
  #log

  /**
   * @param {string | undefined} token
   * @param {{ carts: Set<string>; customer?: FakeCustomer; data?: FakeProjectClient; orders?: Set<string> }} owned the token owner's carts and customer; with `data`, their data and (filled here) the orders made through `me()`
   * @param {string[]} log
   */
  constructor(token, owned, log) {
    this.token = token
    this.#owned = owned
    this.#log = log
  }

  #say(what) {
    this.#log.push(`${this.token} ${what}`)
  }

  /** The token's own cart, or 404. */
  #cart(ID) {
    if (!this.#owned.carts.has(ID)) {
      throw notFound()
    }
  }

  me() {
    const log = (what) => this.#say(what)
    const data = this.#owned.data
    const orders = (this.#owned.orders ??= new Set())
    return {
      get: () => ({
        execute: async () => {
          log('GET me')
          if (!this.#owned.customer) {
            throw notFound()
          }
          return { body: this.#owned.customer }
        },
      }),
      carts: () => ({
        withId: ({ ID }) => ({
          get: () => ({
            execute: async () => {
              log(`GET me/carts/${ID}`)
              this.#cart(ID)
              return data
                ? data.carts().withId({ ID }).get().execute()
                : { body: { id: ID, version: 1 } }
            },
          }),
          post: (args) => ({
            execute: async () => {
              log(
                `POST me/carts/${ID} ${args.body.actions.map((a) => a.action).join(',')}`
              )
              this.#cart(ID)
              return data.carts().withId({ ID }).post(args).execute()
            },
          }),
        }),
      }),
      orders: () => ({
        post: ({ body, queryArgs }) => ({
          execute: async () => {
            log(`POST me/orders from carts/${body.id}`)
            this.#cart(body.id)
            const made = await data
              .orders()
              .post({
                body: {
                  cart: { typeId: 'cart', id: body.id },
                  version: body.version,
                },
                queryArgs,
              })
              .execute()
            orders.add(made.body.id)
            return made
          },
        }),
        withId: ({ ID }) => ({
          get: (args) => ({
            execute: async () => {
              log(`GET me/orders/${ID}`)
              if (!orders.has(ID)) {
                throw notFound()
              }
              return data.orders().withId({ ID }).get(args).execute()
            },
          }),
        }),
      }),
      shoppingLists: () => ({
        get: (args) => ({
          execute: async () => {
            log('GET me/shopping-lists')
            const results = data.lists_
            return {
              body: { results, limit: 1, offset: 0, count: results.length },
            }
          },
        }),
        post: (args) => ({
          execute: async () => {
            log('POST me/shopping-lists')
            return data.shoppingLists().post(args).execute()
          },
        }),
        withId: ({ ID }) => ({
          get: (args) => ({
            execute: async () => {
              log(`GET me/shopping-lists/${ID}`)
              return data.shoppingLists().withId({ ID }).get(args).execute()
            },
          }),
          post: (args) => ({
            execute: async () => {
              log(
                `POST me/shopping-lists/${ID} ${args.body.actions.map((a) => a.action).join(',')}`
              )
              return data.shoppingLists().withId({ ID }).post(args).execute()
            },
          }),
        }),
      }),
    }
  }

  /** Catalog reads with this token (wishlist prices, product pages). */
  productProjections() {
    return {
      get: (args) => ({
        execute: async () => {
          this.#say('GET product-projections')
          return this.#owned.data.productProjections().get(args).execute()
        },
      }),
    }
  }
}

/**
 * fetch for the OAuth endpoints: answers token requests and records method, URL, headers and form.
 * @param {{ method: string; url: string; authorization?: string; form: Record<string, string> }[]} requests
 * @param {(url: string) => { status: number; body: unknown }} reply
 * @returns {typeof fetch}
 */
export function fakeOAuthFetch(requests, reply) {
  return async (input, init) => {
    const url = String(input)
    requests.push({
      method: init?.method ?? 'GET',
      url,
      authorization: init?.headers?.['Authorization'],
      form: Object.fromEntries(new URLSearchParams(init?.body ?? '')),
    })
    const { status, body } = reply(url)
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  }
}
