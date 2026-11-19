import { NotFoundException } from '@nestjs/common'
import { CartService } from '../cart.service'

describe('CartService.getCart', () => {
  let dataSourceCartService: { getCart: jest.Mock }
  let cartIdService: {
    getGuestCartId: jest.Mock
    deleteGuestCartId: jest.Mock
  }
  let service: CartService

  beforeEach(() => {
    dataSourceCartService = { getCart: jest.fn() }
    cartIdService = {
      getGuestCartId: jest.fn().mockResolvedValue('stale-cart'),
      deleteGuestCartId: jest.fn(),
    }
    const dataSourceFactory = {
      getServices: () => ({ cartService: dataSourceCartService }),
    }
    const tokenProvider = { getAuthStatus: jest.fn().mockResolvedValue(false) }
    const tokenStorageService = { hasAccessToken: () => true }

    service = new CartService(
      dataSourceFactory as never,
      cartIdService as never,
      tokenProvider as never,
      tokenStorageService as never
    )
  })

  it('returns the cart for a known id', async () => {
    const cart = { id: 'stale-cart' }
    dataSourceCartService.getCart.mockResolvedValue(cart)

    await expect(service.getCart()).resolves.toBe(cart)
    expect(cartIdService.deleteGuestCartId).not.toHaveBeenCalled()
  })

  it('clears the cookie and returns null when the stored cart no longer exists', async () => {
    dataSourceCartService.getCart.mockRejectedValue(
      new NotFoundException('Cart not found')
    )

    await expect(service.getCart()).resolves.toBeNull()
    expect(cartIdService.deleteGuestCartId).toHaveBeenCalledTimes(1)
  })

  it('rethrows other errors without clearing the cookie', async () => {
    const error = new Error('boom')
    dataSourceCartService.getCart.mockRejectedValue(error)

    await expect(service.getCart()).rejects.toBe(error)
    expect(cartIdService.deleteGuestCartId).not.toHaveBeenCalled()
  })
})
