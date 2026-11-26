/**
 * In-memory stand-ins for the commercetools project API client (customers, carts, `me`) and for fetch
 * (OAuth). Each records the calls it serves, so a test can list exactly what the integration asked
 * commercetools for. No network.
 */
export interface FakeCustomer {
  id: string
  version: number
  email: string
  externalId?: string
  authenticationMode?: string
  isEmailVerified?: boolean
  firstName?: string
  lastName?: string
}

export interface FakeCart {
  id: string
  version: number
  customerId?: string
  currency?: string
  lineItems?: FakeLineItem[]
  totalPrice?: { centAmount: number; currencyCode: string }
  custom?: {
    type: { typeId: 'type'; id: string }
    fields: Record<string, unknown>
  }
}

/** A Custom Type of the project: its key and the names of its fields. */
export interface FakeType {
  id: string
  key: string
  fieldDefinitions: { name: string }[]
}

export interface FakeLineItem {
  id: string
  productId: string
  variantId: number
  quantity: number
  name: Record<string, string>
  price: { value: { centAmount: number; currencyCode: string } }
  totalPrice: { centAmount: number; currencyCode: string }
}

/** A published product as the product projection API answers it (one variant, one price). */
export interface FakeProduct {
  id: string
  createdAt: string
  name: Record<string, string>
  slug: Record<string, string>
  masterVariant: {
    id: number
    prices: {
      id: string
      value: {
        type: 'centPrecision'
        centAmount: number
        currencyCode: string
        fractionDigits: number
      }
    }[]
  }
}

export interface FakeOrder extends FakeCart {
  orderNumber: string
  createdAt: string
  orderState: string
}

const notFound = () =>
  Object.assign(new Error('not found'), {
    statusCode: 404,
    body: { statusCode: 404 },
  })

/** The project API (server client): customers, carts with line items, orders and product projections. */
export class FakeProjectClient {
  customers_: FakeCustomer[] = []
  carts_: FakeCart[] = []
  orders_: FakeOrder[] = []
  products_: FakeProduct[] = []
  types_: FakeType[] = []
  /** The next cart updates answer 409 (another change came first), this many times. */
  conflicts = 0
  /** Calls on customers, in order. */
  calls: string[] = []
  /** Calls on carts, kept apart from the customer calls. */
  cartCalls: string[] = []
  private n = 0

  private match(where: string): FakeCustomer[] {
    // a predicate string literal: backslash escapes undone
    const literal = (field: string) =>
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
      get: ({ queryArgs }: { queryArgs: { where: string } }) => ({
        execute: async () => {
          this.calls.push(`GET customers where ${queryArgs.where}`)
          return { body: { results: this.match(queryArgs.where).slice(0, 1) } }
        },
      }),
      post: ({ body }: { body: Omit<FakeCustomer, 'id' | 'version'> }) => ({
        execute: async () => {
          this.calls.push(
            `POST customers ${body.authenticationMode} externalId=${body.externalId}`
          )
          const c = { id: `ct-customer-${++this.n}`, version: 1, ...body }
          this.customers_.push(c)
          return { body: { customer: c } }
        },
      }),
      withId: ({ ID }: { ID: string }) => ({
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
        post: ({
          body,
        }: {
          body: {
            version: number
            actions: { action: string; externalId?: string }[]
          }
        }) => ({
          execute: async () => {
            const c = this.customers_.find((x) => x.id === ID)!
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
    const find = (ID: string) => {
      const c = this.carts_.find((x) => x.id === ID)
      if (!c) {
        throw notFound()
      }
      return c
    }
    return {
      get: ({ queryArgs }: { queryArgs: { where?: string | string[] } }) => ({
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
      post: ({ body }: { body: Omit<FakeCart, 'id' | 'version'> }) => ({
        execute: async () => {
          this.cartCalls.push(`POST carts customerId=${body.customerId}`)
          const c: FakeCart = {
            id: `ct-cart-${++this.n}`,
            version: 1,
            ...body,
            lineItems: [],
            totalPrice: { centAmount: 0, currencyCode: body.currency ?? 'USD' },
          }
          this.carts_.push(c)
          return { body: c }
        },
      }),
      withId: ({ ID }: { ID: string }) => ({
        get: () => ({
          execute: async () => {
            this.cartCalls.push(`GET carts/${ID}`)
            return { body: find(ID) }
          },
        }),
        post: ({
          body,
        }: {
          body: {
            actions: {
              action: string
              customerId?: string
              productId?: string
              variantId?: number
              quantity?: number
              type?: { key: string }
              fields?: Record<string, unknown>
              name?: string
              value?: unknown
            }[]
          }
        }) => ({
          execute: async () => {
            const c = find(ID)
            if (this.conflicts > 0) {
              this.conflicts--
              this.cartCalls.push(`POST carts/${ID} 409`)
              throw Object.assign(new Error('conflict'), { statusCode: 409 })
            }
            for (const a of body.actions) {
              this.cartCalls.push(
                `POST carts/${ID} ${a.action} ${a.customerId ?? a.productId ?? ''}`.trim()
              )
              if (a.action === 'setCustomerId') {
                c.customerId = a.customerId
              }
              if (a.action === 'addLineItem') {
                this.addLine(c, a)
              }
              if (a.action === 'setCustomType') {
                const t = this.types_.find((x) => x.key === a.type!.key)
                if (!t) {
                  throw notFound()
                }
                c.custom = {
                  type: { typeId: 'type', id: t.id },
                  fields: { ...a.fields },
                }
              }
              if (a.action === 'setCustomField') {
                if (a.value === undefined) {
                  delete c.custom!.fields[a.name!]
                } else {
                  c.custom!.fields[a.name!] = a.value
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

  private addLine(
    c: FakeCart,
    a: { productId?: string; variantId?: number; quantity?: number }
  ) {
    const p = this.products_.find((x) => x.id === a.productId)
    if (!p) {
      throw notFound()
    }
    const price = p.masterVariant.prices[0]!.value
    const quantity = a.quantity ?? 1
    c.lineItems!.push({
      id: `ct-line-${++this.n}`,
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
      centAmount: c.lineItems!.reduce((s, l) => s + l.totalPrice.centAmount, 0),
      currencyCode: price.currencyCode,
    }
  }

  /** Custom Types, read by id. */
  types() {
    return {
      withId: ({ ID }: { ID: string }) => ({
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
      get: ({ queryArgs }: { queryArgs: { where: string } }) => ({
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
      post: ({
        body,
      }: {
        body: { cart: { id: string }; version: number }
      }) => ({
        execute: async () => {
          this.cartCalls.push(`POST orders from carts/${body.cart.id}`)
          const cart = this.carts_.find((x) => x.id === body.cart.id)
          if (!cart) {
            throw notFound()
          }
          this.carts_.splice(this.carts_.indexOf(cart), 1)
          const order: FakeOrder = {
            ...cart,
            id: `ct-order-${++this.n}`,
            version: 1,
            orderNumber: String(this.orders_.length + 1).padStart(5, '0'),
            createdAt: new Date().toISOString(),
            orderState: 'Open',
          }
          this.orders_.push(order)
          return { body: order }
        },
      }),
      withId: ({ ID }: { ID: string }) => ({
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
}

/**
 * The `me` API of one access token: answers for the carts that token owns (a guest's anonymous session) and
 * for the customer the token belongs to. Records every call with the token it came with.
 */
export class FakeMeClient {
  constructor(
    readonly token: string | undefined,
    private readonly owned: { carts: Set<string>; customer?: FakeCustomer },
    private readonly log: string[]
  ) {}

  me() {
    const log = (what: string) => this.log.push(`${this.token} ${what}`)
    return {
      get: () => ({
        execute: async () => {
          log('GET me')
          if (!this.owned.customer) {
            throw notFound()
          }
          return { body: this.owned.customer }
        },
      }),
      carts: () => ({
        withId: ({ ID }: { ID: string }) => ({
          get: () => ({
            execute: async () => {
              log(`GET me/carts/${ID}`)
              if (!this.owned.carts.has(ID)) {
                throw notFound()
              }
              return { body: { id: ID, version: 1 } }
            },
          }),
        }),
      }),
      // the token owns no order: every order id is "not found" for it
      orders: () => ({
        withId: ({ ID }: { ID: string }) => ({
          get: () => ({
            execute: async () => {
              log(`GET me/orders/${ID}`)
              throw notFound()
            },
          }),
        }),
      }),
    }
  }
}

/** fetch for the OAuth endpoints: answers token requests and records method, URL, headers and form. */
export function fakeOAuthFetch(
  requests: {
    method: string
    url: string
    authorization?: string
    form: Record<string, string>
  }[],
  reply: (url: string) => { status: number; body: unknown }
): typeof fetch {
  return (async (
    input: unknown,
    init?: { method?: string; body?: string; headers?: Record<string, string> }
  ) => {
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
  }) as typeof fetch
}
