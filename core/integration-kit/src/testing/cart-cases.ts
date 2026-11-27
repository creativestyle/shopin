import assert from 'node:assert/strict'
import { CartResponseSchema } from '@core/contracts/cart/cart'
import { ShippingMethodsResponseSchema } from '@core/contracts/cart/shipping-method'
import type { CaseContext } from './types'
import { rejectsWith, ADDRESS } from './helpers'

/**
 * Cart: create, lines, an unknown cart, discount codes (when the data names two), checkout (addresses, shipping, a
 * payment method). The shop's own fields and attaching a guest cart are order cases (they need customers).
 */
export function cartCases(ctx: CaseContext): void {
  const { port, data, add, unique } = ctx
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
            cartService.getCart(`no-such-cart-${unique()}`)
          )
        },
      }
    )
  }
  if (data.cart && data.discountCodes) {
    const [first, second] = data.discountCodes
    add(
      [
        'productService',
        'cartService.addDiscountCode',
        'cartService.removeDiscountCode',
      ],
      {
        name: 'commerce: a discount code applies and is removed; a second code is refused while one is applied',
        async run() {
          const { cartService: carts, productService } = await port()
          const { product: item } = await productService.getProduct(
            product!.slug
          )
          const cart = await carts.createCart()
          await carts.addToCart(cart.id, item.id, product!.variantId, 1)
          const before = CartResponseSchema.parse(await carts.getCart(cart.id))
          const applied = CartResponseSchema.parse(
            await carts.addDiscountCode(cart.id, first)
          )
          const code = applied.discountCodes?.find((c) => c.applied)
          assert.ok(code, `${first}: the cart holds no applied code`)
          assert.ok(
            applied.grandTotal.regularPriceInCents <
              before.grandTotal.regularPriceInCents,
            `${first}: the grand total did not go down`
          )
          await assert.rejects(
            carts.addDiscountCode(cart.id, second),
            (error: { name?: string; reason?: string }) =>
              error?.name === 'DiscountCodeError' &&
              error.reason === 'alreadyApplied',
            `${second} was not refused (DiscountCodeError alreadyApplied) while ${first} is applied`
          )
          const kept = CartResponseSchema.parse(await carts.getCart(cart.id))
          assert.deepEqual(
            kept.discountCodes?.filter((c) => c.applied).map((c) => c.id),
            [code.id],
            'the refused code changed the codes on the cart'
          )
          const removed = CartResponseSchema.parse(
            await carts.removeDiscountCode(cart.id, code.id)
          )
          assert.equal(
            removed.discountCodes?.some((c) => c.applied) ?? false,
            false
          )
          assert.equal(
            removed.grandTotal.regularPriceInCents,
            before.grandTotal.regularPriceInCents
          )
          const next = CartResponseSchema.parse(
            await carts.addDiscountCode(cart.id, second)
          )
          assert.ok(
            next.discountCodes?.some((c) => c.applied),
            `${second} does not apply once ${first} is removed`
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
