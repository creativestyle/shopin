import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { CartResponseSchema } from '@core/contracts/cart/cart'
import { ShippingMethodsResponseSchema } from '@core/contracts/cart/shipping-method'
import type { CaseContext } from './types'
import { rejectsWith, ADDRESS } from './helpers'

/** Cart: create, lines, discount codes, shipping, own fields, attach a guest cart. */
export function cartCases(ctx: CaseContext): void {
  const { port, data, add } = ctx
  const { product } = data
  if (data.cart) {
    assert.ok(product, 'commerceContract: the cart cases need `product`')
    add(
      ['cartService', 'productService'],
      {
        name: 'commerce: a new cart is empty; add, change and remove a line keep the cart contract',
        async run() {
          const { cartService: carts, productService } = await port()
          const { product: item } = await productService.getProduct(
            product!.slug
          )
          const cart = CartResponseSchema.parse(await carts.createCart())
          assert.deepEqual([cart.lineItems.length, cart.itemCount], [0, 0])
          const added = CartResponseSchema.parse(
            await carts.addToCart(cart.id, item.id, product!.variantId, 2)
          )
          assert.equal(added.id, cart.id)
          assert.equal(added.lineItems.length, 1)
          assert.equal(added.itemCount, 2)
          const line = added.lineItems[0]!
          const read = CartResponseSchema.parse(await carts.getCart(cart.id))
          assert.deepEqual(
            read.lineItems.map((l) => [l.id, l.quantity]),
            [[line.id, 2]]
          )
          const changed = CartResponseSchema.parse(
            await carts.updateCartItem(cart.id, line.id, 3)
          )
          assert.equal(changed.itemCount, 3)
          const removed = CartResponseSchema.parse(
            await carts.removeCartItem(cart.id, line.id)
          )
          assert.deepEqual(
            [removed.lineItems.length, removed.itemCount],
            [0, 0]
          )
        },
      },
      {
        name: 'commerce: an unknown cart is 404',
        async run() {
          const { cartService } = await port()
          await rejectsWith(
            404,
            cartService.getCart(`no-such-cart-${randomUUID()}`)
          )
        },
      }
    )
  }
  if (data.cart) {
    add(
      [
        'productService',
        'cartService.setShippingAddress',
        'cartService.setBillingAddress',
        'cartService.getShippingMethods',
        'cartService.setShippingMethod',
        'cartPaymentService.setPaymentMethod',
        'cartPaymentService.verifyAndUpdatePaymentAmounts',
      ],
      {
        name: 'commerce: checkout: a cart takes addresses, a shipping method of its own list and a payment method',
        async run() {
          const {
            cartService: carts,
            cartPaymentService,
            productService,
          } = await port()
          const { product: item } = await productService.getProduct(
            product!.slug
          )
          const cart = await carts.createCart()
          await carts.addToCart(cart.id, item.id, product!.variantId, 1)
          const shipped = CartResponseSchema.parse(
            await carts.setShippingAddress(cart.id, ADDRESS)
          )
          assert.equal(shipped.shippingAddress?.city, ADDRESS.city)
          const billed = CartResponseSchema.parse(
            await carts.setBillingAddress(cart.id, {
              ...ADDRESS,
              city: 'Billington',
            })
          )
          assert.equal(billed.billingAddress?.city, 'Billington')
          const { shippingMethods } = ShippingMethodsResponseSchema.parse(
            await carts.getShippingMethods(cart.id)
          )
          assert.ok(shippingMethods.length > 0, 'no shipping method')
          CartResponseSchema.parse(
            await carts.setShippingMethod(cart.id, {
              shippingMethodId: shippingMethods[0]!.id,
            })
          )
          CartResponseSchema.parse(
            await cartPaymentService.setPaymentMethod(cart.id, {
              paymentMethodId: 'contract-invoice',
              paymentInterface: 'contract-psp',
              paymentMethodName: 'Invoice',
            })
          )
          await cartPaymentService.verifyAndUpdatePaymentAmounts(cart.id)
        },
      }
    )
  }
}
