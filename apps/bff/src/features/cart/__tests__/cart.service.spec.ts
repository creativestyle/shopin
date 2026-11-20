import { DiscountCodeError } from '@core/contracts/cart/cart'
import type { CartResponse } from '@core/contracts/cart/cart'
import { CartService } from '../cart.service'
import { FrontendSafeException } from '../../../common/errors/frontend-safe.exception'

const CART = { id: 'cart-1' } as CartResponse

function createService({
  cart = CART,
  addDiscountCode = jest.fn().mockResolvedValue(CART),
}: {
  cart?: CartResponse
  addDiscountCode?: jest.Mock
} = {}) {
  const getCart = jest.fn().mockResolvedValue(cart)
  const dataSourceFactory = {
    getServices: () => ({ cartService: { getCart, addDiscountCode } }),
  }
  const service = new CartService(
    dataSourceFactory as never,
    {} as never,
    {} as never,
    {} as never
  )
  jest.spyOn(service, 'getOrCreateCartId').mockResolvedValue('cart-1')
  return { service, addDiscountCode }
}

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error)
}

describe('CartService.applyDiscountCode', () => {
  it('applies the code to the current cart', async () => {
    const { service, addDiscountCode } = createService()

    await expect(service.applyDiscountCode({ code: 'SAVE10' })).resolves.toBe(
      CART
    )
    expect(addDiscountCode).toHaveBeenCalledWith('cart-1', 'SAVE10')
  })

  it('rejects with alreadyApplied when a working code is on the cart', async () => {
    const { service, addDiscountCode } = createService({
      cart: {
        ...CART,
        discountCodes: [{ id: 'dc-1', code: 'SAVE5', applied: true }],
      },
    })

    const error = await catchError(service.applyDiscountCode({ code: 'X' }))

    expect(error).toBeInstanceOf(FrontendSafeException)
    expect((error as FrontendSafeException).reason).toBe('alreadyApplied')
    expect(addDiscountCode).not.toHaveBeenCalled()
  })

  it('lets a new code through when the existing one no longer applies', async () => {
    const { service, addDiscountCode } = createService({
      cart: {
        ...CART,
        discountCodes: [{ id: 'dc-1', code: 'SAVE5', applied: false }],
      },
    })

    await service.applyDiscountCode({ code: 'SAVE10' })

    expect(addDiscountCode).toHaveBeenCalledWith('cart-1', 'SAVE10')
  })

  it('translates DiscountCodeError into a frontend-safe reason', async () => {
    const { service } = createService({
      addDiscountCode: jest
        .fn()
        .mockRejectedValue(new DiscountCodeError('expired')),
    })

    const error = await catchError(service.applyDiscountCode({ code: 'OLD' }))

    expect(error).toBeInstanceOf(FrontendSafeException)
    expect((error as FrontendSafeException).reason).toBe('expired')
  })

  it('rethrows other integration errors unchanged', async () => {
    const failure = new Error('commercetools unavailable')
    const { service } = createService({
      addDiscountCode: jest.fn().mockRejectedValue(failure),
    })

    await expect(service.applyDiscountCode({ code: 'SAVE10' })).rejects.toBe(
      failure
    )
  })
})
