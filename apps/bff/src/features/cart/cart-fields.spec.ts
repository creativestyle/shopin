/**
 * `PUT /bff/cart/fields` on a commerce platform without `setCartFields`: 501 naming the provider, before anything
 * is read or written (the scenario test/category-split/shop-write.spec.ts covers a platform that has it).
 */
import { CartService } from './cart.service'

const service = (commerce: object, cartId?: string) =>
  new CartService(
    {} as never,
    { commerce } as never,
    {
      getGuestCartId: async () => cartId,
      getLoggedInCartId: async () => cartId,
    } as never,
    { getAuthStatus: async () => false } as never,
    {} as never
  )

describe('cart fields', () => {
  it('answers 501 naming the provider when the commerce port has no setCartFields', async () => {
    await expect(
      service({}, 'c1').setFields({ giftMessage: 'Hi' })
    ).rejects.toMatchObject({
      status: 501,
      message: expect.stringMatching(/"shop" does not store them/),
    })
  })

  it("hands the shopper's cart id from the session to setCartFields", async () => {
    const setCartFields = jest.fn(async (id: string) => ({ id }))
    await expect(
      service({ setCartFields }, 'c1').setFields({ giftMessage: 'Hi' })
    ).resolves.toEqual({ id: 'c1' })
    expect(setCartFields).toHaveBeenCalledWith('c1', { giftMessage: 'Hi' })
  })
})
