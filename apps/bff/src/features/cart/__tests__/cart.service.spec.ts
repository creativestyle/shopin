import { NotFoundException } from '@nestjs/common'
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
    expect(addDiscountCode).toHaveBeenCalledWith('cart-1', 'SAVE10', [])
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

  it('replaces a code that no longer applies instead of keeping it next to the new one', async () => {
    const { service, addDiscountCode } = createService({
      cart: {
        ...CART,
        discountCodes: [{ id: 'dc-1', code: 'SAVE5', applied: false }],
      },
    })

    await service.applyDiscountCode({ code: 'SAVE10' })

    expect(addDiscountCode).toHaveBeenCalledWith('cart-1', 'SAVE10', ['dc-1'])
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

const STALE_ID = 'stale-cart'
const FRESH_ID = 'fresh-cart'

describe('CartService stale cart recovery', () => {
  let dataSourceCartService: {
    getCart: jest.Mock
    createCart: jest.Mock
    addToCart: jest.Mock
    updateCartItem: jest.Mock
    removeCartItem: jest.Mock
    getActiveCart: jest.Mock
    getShippingMethods: jest.Mock
  }
  let cartIdService: {
    getGuestCartId: jest.Mock
    getLoggedInCartId: jest.Mock
    setGuestCartId: jest.Mock
    setLoggedInCartId: jest.Mock
    deleteGuestCartId: jest.Mock
    deleteLoggedInCartId: jest.Mock
  }
  let tokenProvider: { getAuthStatus: jest.Mock }
  let service: CartService

  beforeEach(() => {
    dataSourceCartService = {
      getCart: jest.fn(),
      createCart: jest.fn().mockResolvedValue({ id: FRESH_ID }),
      addToCart: jest.fn(),
      updateCartItem: jest.fn(),
      removeCartItem: jest.fn(),
      getActiveCart: jest.fn().mockResolvedValue(null),
      getShippingMethods: jest.fn(),
    }
    cartIdService = {
      getGuestCartId: jest.fn().mockResolvedValue(STALE_ID),
      getLoggedInCartId: jest.fn().mockResolvedValue(STALE_ID),
      setGuestCartId: jest.fn(),
      setLoggedInCartId: jest.fn(),
      deleteGuestCartId: jest.fn(),
      deleteLoggedInCartId: jest.fn(),
    }
    const dataSourceFactory = {
      getServices: () => ({ cartService: dataSourceCartService }),
    }
    tokenProvider = { getAuthStatus: jest.fn().mockResolvedValue(false) }
    const tokenStorageService = { hasAccessToken: () => true }

    service = new CartService(
      dataSourceFactory as never,
      cartIdService as never,
      tokenProvider as never,
      tokenStorageService as never
    )
  })

  describe('getCart', () => {
    it('returns the cart for a known id', async () => {
      const cart = { id: STALE_ID }
      dataSourceCartService.getCart.mockResolvedValue(cart)

      await expect(service.getCart()).resolves.toBe(cart)
      expect(cartIdService.deleteGuestCartId).not.toHaveBeenCalled()
    })

    it('clears the guest cookie and returns null when the stored cart no longer exists', async () => {
      dataSourceCartService.getCart.mockRejectedValue(
        new NotFoundException('Cart not found')
      )

      await expect(service.getCart()).resolves.toBeNull()
      expect(cartIdService.deleteGuestCartId).toHaveBeenCalledTimes(1)
      expect(cartIdService.deleteLoggedInCartId).not.toHaveBeenCalled()
    })

    it('clears the logged-in cookie for a signed-in shopper', async () => {
      tokenProvider.getAuthStatus.mockResolvedValue(true)
      dataSourceCartService.getCart.mockRejectedValue(
        new NotFoundException('Cart not found')
      )

      await expect(service.getCart()).resolves.toBeNull()
      expect(cartIdService.deleteLoggedInCartId).toHaveBeenCalledTimes(1)
      expect(cartIdService.deleteGuestCartId).not.toHaveBeenCalled()
    })

    it('rethrows other errors without clearing the cookie', async () => {
      const error = new Error('boom')
      dataSourceCartService.getCart.mockRejectedValue(error)

      await expect(service.getCart()).rejects.toBe(error)
      expect(cartIdService.deleteGuestCartId).not.toHaveBeenCalled()
    })
  })

  describe('getOrCreateCart', () => {
    it('creates and stores a new cart when the stored one no longer exists', async () => {
      dataSourceCartService.getCart.mockRejectedValue(
        new NotFoundException('Cart not found')
      )

      await expect(service.getOrCreateCart()).resolves.toEqual({
        id: FRESH_ID,
      })
      expect(cartIdService.deleteGuestCartId).toHaveBeenCalledTimes(1)
      expect(dataSourceCartService.createCart).toHaveBeenCalledTimes(1)
      expect(cartIdService.setGuestCartId).toHaveBeenCalledWith(FRESH_ID)
    })
  })

  describe('addToCart', () => {
    const request = { productId: 'p1', variantId: '1', quantity: 1 }

    it('clears a stale id, creates a new cart and retries once', async () => {
      const updated = { id: FRESH_ID, itemCount: 1 }
      dataSourceCartService.addToCart
        .mockRejectedValueOnce(new NotFoundException('Cart not found'))
        .mockResolvedValueOnce(updated)
      dataSourceCartService.getCart.mockRejectedValue(
        new NotFoundException('Cart not found')
      )

      await expect(service.addToCart(request)).resolves.toBe(updated)
      expect(cartIdService.deleteGuestCartId).toHaveBeenCalledTimes(1)
      expect(cartIdService.setGuestCartId).toHaveBeenCalledWith(FRESH_ID)
      expect(dataSourceCartService.addToCart).toHaveBeenNthCalledWith(
        1,
        STALE_ID,
        'p1',
        '1',
        1
      )
      expect(dataSourceCartService.addToCart).toHaveBeenNthCalledWith(
        2,
        FRESH_ID,
        'p1',
        '1',
        1
      )
    })

    it('keeps the cart and rethrows when a nested resource is missing', async () => {
      const nested = new NotFoundException('Line item not found')
      dataSourceCartService.addToCart.mockRejectedValue(nested)
      dataSourceCartService.getCart.mockResolvedValue({ id: STALE_ID })

      await expect(service.addToCart(request)).rejects.toBe(nested)
      expect(cartIdService.deleteGuestCartId).not.toHaveBeenCalled()
      expect(dataSourceCartService.createCart).not.toHaveBeenCalled()
      expect(dataSourceCartService.addToCart).toHaveBeenCalledTimes(1)
    })
  })

  describe('line-item mutations', () => {
    beforeEach(() => {
      dataSourceCartService.getCart.mockRejectedValue(
        new NotFoundException('Cart not found')
      )
    })

    it('updateCartItem returns a new empty cart instead of retrying on a stale id', async () => {
      dataSourceCartService.updateCartItem.mockRejectedValue(
        new NotFoundException('Cart not found')
      )

      await expect(
        service.updateCartItem({ lineItemId: 'li-1', quantity: 2 })
      ).resolves.toEqual({ id: FRESH_ID })
      expect(cartIdService.deleteGuestCartId).toHaveBeenCalledTimes(1)
      expect(cartIdService.setGuestCartId).toHaveBeenCalledWith(FRESH_ID)
      expect(dataSourceCartService.updateCartItem).toHaveBeenCalledTimes(1)
    })

    it('removeCartItem returns a new empty cart instead of retrying on a stale id', async () => {
      dataSourceCartService.removeCartItem.mockRejectedValue(
        new NotFoundException('Cart not found')
      )

      await expect(
        service.removeCartItem({ lineItemId: 'li-1' })
      ).resolves.toEqual({ id: FRESH_ID })
      expect(cartIdService.deleteGuestCartId).toHaveBeenCalledTimes(1)
      expect(dataSourceCartService.removeCartItem).toHaveBeenCalledTimes(1)
    })
  })

  describe('getShippingMethods', () => {
    it('clears a stale id and returns no shipping methods', async () => {
      dataSourceCartService.getShippingMethods.mockRejectedValue(
        new NotFoundException('Cart not found')
      )
      dataSourceCartService.getCart.mockRejectedValue(
        new NotFoundException('Cart not found')
      )

      await expect(service.getShippingMethods()).resolves.toEqual({
        shippingMethods: [],
      })
      expect(cartIdService.deleteGuestCartId).toHaveBeenCalledTimes(1)
    })
  })
})
