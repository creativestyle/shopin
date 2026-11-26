import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { CartResponseSchema } from '@core/contracts/cart/cart'
import { CustomerResponseSchema } from '@core/contracts/customer/customer'
import {
  AddressesResponseSchema,
  AddressResponseSchema,
} from '@core/contracts/customer/address'
import { OrdersResponseSchema } from '@core/contracts/order/order'
import { COMMERCE, type CaseContext } from './types'
import { rejectsWith, ADDRESS } from './helpers'

/** Orders: checkout, the order list, and that one customer never sees another's orders. */
export function orderCases(ctx: CaseContext): void {
  const { port, data, add } = ctx
  const { product } = data
  const orders = data.orders
  /** Two customers of the platform: given, or created through `customers`. */
  const customerPair = async (): Promise<[string, string]> => {
    if (orders !== true) {
      return orders!.customers
    }
    const { customers } = await port()
    assert.ok(
      customers,
      'orders: true needs the `customers` member to create two customers'
    )
    const make = (n: string) =>
      customers.create(
        {
          subject: n,
          email: `contract-${n}@example.com`,
          emailVerified: true,
        },
        `contract-idp:${n}`
      )
    return [
      await make(randomUUID().slice(0, 8)),
      await make(randomUUID().slice(0, 8)),
    ]
  }
  if (data.orders) {
    assert.ok(
      data.cart && product,
      'commerceContract: the order cases need `cart` and `product`'
    )
    add(['orderService', 'cartService', 'productService'], {
      name: "commerce: a customer's order is readable by that customer only (not another customer, not a guest)",
      async run() {
        const [owner, stranger] = await customerPair()
        const mine = await port({ customerId: owner })
        const { product: item } = await mine.productService.getProduct(
          product!.slug
        )
        const cart = await mine.cartService.createCart()
        await mine.cartService.addToCart(
          cart.id,
          item.id,
          product!.variantId,
          1
        )
        const order = await mine.orderService.createOrder({ cartId: cart.id })
        assert.equal((await mine.orderService.getOrder(order.id)).id, order.id)
        const theirs = await port({ customerId: stranger })
        await rejectsWith([403, 404], theirs.orderService.getOrder(order.id))
        const guest = await port()
        await rejectsWith(
          [401, 403, 404],
          guest.orderService.getOrder(order.id)
        )
      },
    })
    add(['orderService', 'cartService', 'productService'], {
      name: 'commerce: ordering the same cart twice is refused as a conflict (409), not as a missing cart',
      async run() {
        const [owner] = await customerPair()
        const mine = await port({ customerId: owner })
        const { product: item } = await mine.productService.getProduct(
          product!.slug
        )
        const cart = await mine.cartService.createCart()
        await mine.cartService.addToCart(
          cart.id,
          item.id,
          product!.variantId,
          1
        )
        await mine.orderService.createOrder({ cartId: cart.id })
        // the BFF drops the stale cart cookie and the storefront says "order already exists" only on 409
        await rejectsWith(
          [409],
          mine.orderService.createOrder({ cartId: cart.id })
        )
      },
    })
  }
  if (data.orders) {
    add(
      ['customerService.getCurrentCustomer', 'customerService.updateCustomer'],
      {
        name: 'commerce: the signed-in customer reads and updates its own data',
        async run() {
          const [owner] = await customerPair()
          const mine = await port({ customerId: owner })
          const me = CustomerResponseSchema.parse(
            await mine.customerService.getCurrentCustomer()
          )
          assert.equal(me.id, owner)
          const updated = CustomerResponseSchema.parse(
            await mine.customerService.updateCustomer({
              firstName: 'Contract',
              lastName: 'Updated',
            })
          )
          assert.deepEqual(
            [updated.firstName, updated.lastName],
            ['Contract', 'Updated']
          )
          assert.equal(
            (await mine.customerService.getCurrentCustomer()).lastName,
            'Updated'
          )
          await rejectsWith(
            [401, 403, 404],
            (await port()).customerService.getCurrentCustomer()
          )
        },
      }
    )
    add(
      COMMERCE.customerAddressService!.methods.map(
        (m) => `customerAddressService.${m}`
      ),
      {
        name: "commerce: a customer's addresses: add, update, defaults, delete; another customer does not see them",
        async run() {
          const [owner, stranger] = await customerPair()
          const { customerAddressService: book } = await port({
            customerId: owner,
          })
          const added = AddressResponseSchema.parse(
            await book.addAddress(ADDRESS)
          )
          assert.ok(added.id, 'the added address has no id')
          const id = added.id
          const listed = AddressesResponseSchema.parse(
            await book.getAddresses()
          )
          assert.ok(listed.addresses.some((a) => a.id === id))
          const changed = AddressResponseSchema.parse(
            await book.updateAddress({ ...ADDRESS, id: id, city: 'Newtown' })
          )
          assert.equal(changed.city, 'Newtown')
          await book.setDefaultShippingAddress(id)
          await book.setDefaultBillingAddress(id)
          const defaults = AddressesResponseSchema.parse(
            await book.getAddresses()
          )
          assert.deepEqual(
            [
              defaults.defaultShippingAddressId,
              defaults.defaultBillingAddressId,
            ],
            [id, id]
          )
          const theirs = await port({ customerId: stranger })
          assert.ok(
            !(
              await theirs.customerAddressService.getAddresses()
            ).addresses.some((a) => a.id === id),
            'another customer sees the address'
          )
          await book.deleteAddress(id)
          assert.ok(
            !(await book.getAddresses()).addresses.some((a) => a.id === id),
            'the address is still there after delete'
          )
        },
      }
    )
    add(
      [
        'orderService.createOrder',
        'orderService.getOrders',
        'cartService',
        'productService',
      ],
      {
        name: "commerce: the order list holds the customer's own orders only",
        async run() {
          const [owner, stranger] = await customerPair()
          const mine = await port({ customerId: owner })
          const { product: item } = await mine.productService.getProduct(
            product!.slug
          )
          const cart = await mine.cartService.createCart()
          await mine.cartService.addToCart(
            cart.id,
            item.id,
            product!.variantId,
            1
          )
          const order = await mine.orderService.createOrder({
            cartId: cart.id,
          })
          const list = OrdersResponseSchema.parse(
            await mine.orderService.getOrders()
          )
          assert.ok(
            list.orders.some((o) => o.id === order.id),
            "the customer's order is not in its list"
          )
          const theirs = await port({ customerId: stranger })
          assert.ok(
            !(await theirs.orderService.getOrders()).orders.some(
              (o) => o.id === order.id
            ),
            "another customer's list holds the order"
          )
        },
      }
    )
  }
  if (data.orders) {
    add(['cartService', 'productService'], {
      name: "commerce: a customer's cart is that customer's: another customer and a guest can neither read nor change it",
      async run() {
        const [owner, stranger] = await customerPair()
        const mine = await port({ customerId: owner })
        const { product: item } = await mine.productService.getProduct(
          product!.slug
        )
        const cart = await mine.cartService.createCart()
        await mine.cartService.addToCart(
          cart.id,
          item.id,
          product!.variantId,
          1
        )
        for (const [who, other] of [
          ['another customer', await port({ customerId: stranger })],
          ['a guest', await port()],
        ] as const) {
          await rejectsWith(
            [401, 403, 404],
            other.cartService.getCart(cart.id)
          ).catch((e) => assert.fail(`${who} reads it: ${e.message}`))
          await rejectsWith(
            [401, 403, 404],
            other.cartService.addToCart(cart.id, item.id, product!.variantId, 1)
          ).catch((e) => assert.fail(`${who} changes it: ${e.message}`))
        }
        assert.equal(
          (await mine.cartService.getCart(cart.id)).lineItems.length,
          1,
          "the customer's cart changed"
        )
      },
    })
    add(['setCartFields', 'cartService'], {
      name: "commerce: setCartFields writes the shop's fields to the customer's own cart and returns it; another customer and a guest are refused",
      async run() {
        const fields =
          typeof data.cart === 'object' ? data.cart.fields : undefined
        if (!fields) {
          return "not tested: name fields your platform's cart takes in the suite's data (`cart: { fields }`)"
        }
        const [owner, stranger] = await customerPair()
        const mine = await port({ customerId: owner })
        const cart = await mine.cartService.createCart()
        const set = CartResponseSchema.parse(
          await mine.setCartFields!(cart.id, fields)
        )
        assert.equal(set.id, cart.id)
        for (const other of [
          await port({ customerId: stranger }),
          await port(),
        ]) {
          await rejectsWith(
            [401, 403, 404],
            other.setCartFields!(cart.id, fields)
          )
        }
      },
    })
  }
  if (data.orders) {
    add(['attachGuestCart', 'cartService', 'productService'], {
      name: "commerce: at sign-in a guest cart is attached to the customer (attachGuestCart); another customer's cart is refused",
      async run() {
        const [owner, stranger] = await customerPair()
        const guest = await port()
        const { product: item } = await guest.productService.getProduct(
          product!.slug
        )
        const cart = await guest.cartService.createCart()
        await guest.cartService.addToCart(
          cart.id,
          item.id,
          product!.variantId,
          1
        )
        const mine = await port({ customerId: owner })
        const attached = CartResponseSchema.parse(
          await mine.attachGuestCart!(cart.id)
        )
        assert.equal(attached.lineItems.length, 1, "the guest's line is kept")
        assert.equal(
          (await mine.cartService.getCart(attached.id)).id,
          attached.id,
          'the customer reads the attached cart'
        )
        const theirs = await port({ customerId: stranger })
        await rejectsWith([403, 404], theirs.attachGuestCart!(attached.id))
        await rejectsWith([403, 404], theirs.cartService.getCart(attached.id))
      },
    })
  }
}
