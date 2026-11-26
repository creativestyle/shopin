import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common'
import { CustomerContext, TokenVault } from '@core/integration-kit'
import type {
  Cart,
  CartPagedQueryResponse,
  CartUpdateAction,
  Customer,
  CustomerUpdateAction,
  MyCartDraft,
  MyCustomerUpdateAction,
  MyPaymentDraft,
  MyPaymentUpdateAction,
  MyShoppingListDraft,
  MyShoppingListUpdateAction,
  Order,
  OrderPagedQueryResponse,
  PaymentUpdateAction,
  ShoppingList,
  ShoppingListPagedQueryResponse,
} from '@commercetools/platform-sdk'
import {
  COMMERCETOOLS_CLIENT,
  type Client,
} from '@integrations/commercetools-core'
import { UserClientService } from '@integrations/commercetools-core'
import { isNotFoundError } from '../helpers/is-not-found-error'
import { quoted } from '@integrations/commercetools-core'

type Expand = { expand?: string[] }
type Query = {
  where?: string | string[]
  sort?: string | string[]
  limit?: number
  offset?: number
} & Expand

/**
 * What the commerce services do for the shopper of this request, whoever signed them in.
 * The services call this; they never pick between `me()` and the project API themselves.
 */
export interface ShopperApi {
  customer: {
    get(): Promise<Customer>
    update(
      version: number,
      actions: MyCustomerUpdateAction[]
    ): Promise<Customer>
    changePassword(
      version: number,
      currentPassword: string,
      newPassword: string
    ): Promise<void>
  }
  carts: {
    /** The shopper's cart; any other id answers 404. */
    get(cartId: string, expand?: string[]): Promise<Cart>
    query(args: Query): Promise<CartPagedQueryResponse>
    create(draft: MyCartDraft): Promise<Cart>
    update(
      cartId: string,
      version: number,
      actions: CartUpdateAction[],
      expand?: string[]
    ): Promise<Cart>
  }
  orders: {
    get(orderId: string, expand?: string[]): Promise<Order>
    query(args: Query): Promise<OrderPagedQueryResponse>
    createFromCart(
      cartId: string,
      version: number,
      expand?: string[]
    ): Promise<Order>
  }
  payments: {
    create(draft: MyPaymentDraft): Promise<string>
    /** A payment of one of the shopper's carts: `cartId` is checked first, then the payment must be on it. */
    update(
      cartId: string,
      paymentId: string,
      version: number,
      actions: MyPaymentUpdateAction[]
    ): Promise<void>
  }
  shoppingLists: {
    get(id: string, expand?: string[]): Promise<ShoppingList>
    query(args: Query): Promise<ShoppingListPagedQueryResponse>
    create(draft: MyShoppingListDraft): Promise<ShoppingList>
    update(
      id: string,
      version: number,
      actions: MyShoppingListUpdateAction[],
      expand?: string[]
    ): Promise<ShoppingList>
  }
}

const notFound = (what: string, id: string) =>
  new NotFoundException(`${what} not found: ${id}`)

/** 404 from commercetools becomes NotFoundException; anything else is rethrown. */
async function orNotFound<T>(
  what: string,
  id: string,
  call: () => Promise<T>
): Promise<T> {
  try {
    return await call()
  } catch (error) {
    if (isNotFoundError(error)) {
      throw notFound(what, id)
    }
    throw error
  }
}

const and = (scope: string, where?: string | string[]) => [
  scope,
  ...(where === undefined ? [] : [where].flat()),
]

/**
 * Who the commerce part acts for, and with which key:
 * - a guest, or a customer who signed in with commercetools itself (the vault entry holds that customer's token):
 *   the `me()` API with the shopper's own token, so commercetools itself limits every call to that shopper and the
 *   API client needs only shopper scopes (as before the migration);
 * - a customer of another identity provider (CustomerContext from the SHOPin session, no commercetools token): the
 *   project API through the server client, every read and write scoped to that customer id, and every id the caller
 *   passes checked to belong to them (otherwise 404). Customers with `authenticationMode: ExternalAuth` work, but the
 *   API client needs `PROJECT_SCOPES` (parts/commerce.ts), checked at start when customer linking is on.
 */
@Injectable()
export class CustomerScope {
  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly server: Client,
    private readonly user: UserClientService,
    private readonly vault: TokenVault,
    @Optional() private readonly context?: CustomerContext
  ) {}

  /** The linked customer id at commercetools for this request; undefined for a guest. */
  async customerId(): Promise<string | undefined> {
    return (await this.context?.customerId()) || undefined
  }

  /** The server client only for a customer without a commercetools token of their own (another identity provider). */
  private async useServer(): Promise<string | undefined> {
    const id = await this.customerId()
    if (!id) {
      return undefined
    }
    return (await this.vault.get())?.customer ? undefined : id
  }

  /** Client for calls that are not about the shopper's own resources (catalog, shipping methods). */
  async client(): Promise<Client> {
    return (await this.useServer()) ? this.server : this.user.getClient()
  }

  async api(): Promise<ShopperApi> {
    const id = await this.useServer()
    return id
      ? this.forCustomer(id)
      : this.forShopperToken(await this.user.getClient())
  }

  /** The `me()` API with the shopper's own token: a guest's anonymous token or a commercetools customer's token. */
  private forShopperToken(c: Client): ShopperApi {
    const api: ShopperApi = {
      customer: {
        get: async () => (await c.me().get().execute()).body,
        update: async (version, actions) =>
          (await c.me().post({ body: { version, actions } }).execute()).body,
        changePassword: async (version, currentPassword, newPassword) => {
          await c
            .me()
            .password()
            .post({ body: { version, currentPassword, newPassword } })
            .execute()
        },
      },
      carts: {
        get: (id, expand) =>
          orNotFound(
            'Cart',
            id,
            async () =>
              (
                await c
                  .me()
                  .carts()
                  .withId({ ID: id })
                  .get({ queryArgs: { expand } })
                  .execute()
              ).body
          ),
        query: async (args) =>
          (await c.me().carts().get({ queryArgs: args }).execute()).body,
        create: async (draft) =>
          (await c.me().carts().post({ body: draft }).execute()).body,
        update: async (id, version, actions, expand) =>
          (
            await c
              .me()
              .carts()
              .withId({ ID: id })
              .post({
                body: { version, actions: actions as never },
                queryArgs: { expand },
              })
              .execute()
          ).body,
      },
      orders: {
        get: (id, expand) =>
          orNotFound(
            'Order',
            id,
            async () =>
              (
                await c
                  .me()
                  .orders()
                  .withId({ ID: id })
                  .get({ queryArgs: { expand } })
                  .execute()
              ).body
          ),
        query: async (args) =>
          (await c.me().orders().get({ queryArgs: args }).execute()).body,
        createFromCart: async (cartId, version, expand) =>
          (
            await c
              .me()
              .orders()
              .post({ body: { id: cartId, version }, queryArgs: { expand } })
              .execute()
          ).body,
      },
      payments: {
        create: async (draft) =>
          (await c.me().payments().post({ body: draft }).execute()).body.id,
        update: async (_cartId, paymentId, version, actions) => {
          await c
            .me()
            .payments()
            .withId({ ID: paymentId })
            .post({ body: { version, actions } })
            .execute()
        },
      },
      shoppingLists: {
        get: (id, expand) =>
          orNotFound(
            'Wishlist',
            id,
            async () =>
              (
                await c
                  .me()
                  .shoppingLists()
                  .withId({ ID: id })
                  .get({ queryArgs: { expand } })
                  .execute()
              ).body
          ),
        query: async (args) =>
          (await c.me().shoppingLists().get({ queryArgs: args }).execute())
            .body,
        create: async (draft) =>
          (await c.me().shoppingLists().post({ body: draft }).execute()).body,
        update: async (id, version, actions, expand) =>
          (
            await c
              .me()
              .shoppingLists()
              .withId({ ID: id })
              .post({ body: { version, actions }, queryArgs: { expand } })
              .execute()
          ).body,
      },
    }
    return api
  }

  private forCustomer(customerId: string): ShopperApi {
    const c = this.server
    const customer = { typeId: 'customer' as const, id: customerId }

    /**
     * A cart without a customer is taken over only when this shopper's own anonymous session can read it
     * through `me()` (the guest cart they filled before signing in). Any other cart answers 404.
     */
    const adopt = async (cart: Cart, expand?: string[]): Promise<Cart> => {
      const guest = await this.user.getClient()
      const own = await guest
        .me()
        .carts()
        .withId({ ID: cart.id })
        .get()
        .execute()
        .then(
          () => true,
          // only a 404 says "not this shopper's"; an expired token or an outage must not lose the cart as "not yours"
          (error: unknown) => {
            if (isNotFoundError(error)) {
              return false
            }
            throw error
          }
        )
      // an ordered or merged cart is no guest cart any more: never handed to a customer
      if (!own || (cart.cartState && cart.cartState !== 'Active')) {
        throw notFound('Cart', cart.id)
      }
      return (
        await c
          .carts()
          .withId({ ID: cart.id })
          .post({
            body: {
              version: cart.version,
              actions: [{ action: 'setCustomerId', customerId }],
            },
            queryArgs: { expand },
          })
          .execute()
      ).body
    }

    const ownCart = async (id: string, expand?: string[]): Promise<Cart> => {
      const cart = await orNotFound(
        'Cart',
        id,
        async () =>
          (
            await c
              .carts()
              .withId({ ID: id })
              .get({ queryArgs: { expand } })
              .execute()
          ).body
      )
      if (cart.customerId === customerId) {
        return cart
      }
      if (!cart.customerId) {
        return adopt(cart, expand)
      }
      throw notFound('Cart', id)
    }

    const ownOrder = async (id: string, expand?: string[]): Promise<Order> => {
      const order = await orNotFound(
        'Order',
        id,
        async () =>
          (
            await c
              .orders()
              .withId({ ID: id })
              .get({ queryArgs: { expand } })
              .execute()
          ).body
      )
      if (order.customerId !== customerId) {
        throw notFound('Order', id)
      }
      return order
    }

    const ownList = async (
      id: string,
      expand?: string[]
    ): Promise<ShoppingList> => {
      const list = await orNotFound(
        'Wishlist',
        id,
        async () =>
          (
            await c
              .shoppingLists()
              .withId({ ID: id })
              .get({ queryArgs: { expand } })
              .execute()
          ).body
      )
      if (list.customer?.id !== customerId) {
        throw notFound('Wishlist', id)
      }
      return list
    }

    const byCustomer = `customerId=${quoted(customerId)}`

    return {
      customer: {
        get: async () =>
          (await c.customers().withId({ ID: customerId }).get().execute()).body,
        update: async (version, actions) =>
          (
            await c
              .customers()
              .withId({ ID: customerId })
              .post({
                body: { version, actions: actions as CustomerUpdateAction[] },
              })
              .execute()
          ).body,
        changePassword: async (version, currentPassword, newPassword) => {
          await c
            .customers()
            .password()
            .post({
              body: { id: customerId, version, currentPassword, newPassword },
            })
            .execute()
        },
      },
      carts: {
        get: ownCart,
        query: async (args) =>
          (
            await c
              .carts()
              .get({
                queryArgs: { ...args, where: and(byCustomer, args.where) },
              })
              .execute()
          ).body,
        create: async (draft) =>
          (
            await c
              .carts()
              .post({ body: { ...draft, customerId } })
              .execute()
          ).body,
        update: async (id, version, actions, expand) => {
          await ownCart(id, [])
          return (
            await c
              .carts()
              .withId({ ID: id })
              .post({ body: { version, actions }, queryArgs: { expand } })
              .execute()
          ).body
        },
      },
      orders: {
        get: ownOrder,
        query: async (args) =>
          (
            await c
              .orders()
              .get({
                queryArgs: { ...args, where: and(byCustomer, args.where) },
              })
              .execute()
          ).body,
        createFromCart: async (cartId, version, expand) => {
          await ownCart(cartId, [])
          return (
            await c
              .orders()
              .post({
                body: { cart: { typeId: 'cart', id: cartId }, version },
                queryArgs: { expand },
              })
              .execute()
          ).body
        },
      },
      payments: {
        create: async (draft) =>
          (
            await c
              .payments()
              .post({ body: { ...draft, customer } })
              .execute()
          ).body.id,
        update: async (cartId, paymentId, version, actions) => {
          const cart = await ownCart(cartId, [])
          if (!cart.paymentInfo?.payments.some((p) => p.id === paymentId)) {
            throw notFound('Payment', paymentId)
          }
          await c
            .payments()
            .withId({ ID: paymentId })
            .post({
              body: { version, actions: actions as PaymentUpdateAction[] },
            })
            .execute()
        },
      },
      shoppingLists: {
        get: ownList,
        query: async (args) =>
          (
            await c
              .shoppingLists()
              .get({
                queryArgs: {
                  ...args,
                  where: and(`customer(id=${quoted(customerId)})`, args.where),
                },
              })
              .execute()
          ).body,
        create: async (draft) =>
          (
            await c
              .shoppingLists()
              .post({ body: { ...draft, customer } })
              .execute()
          ).body,
        update: async (id, version, actions, expand) => {
          await ownList(id, [])
          return (
            await c
              .shoppingLists()
              .withId({ ID: id })
              .post({ body: { version, actions }, queryArgs: { expand } })
              .execute()
          ).body
        },
      },
    }
  }
}
