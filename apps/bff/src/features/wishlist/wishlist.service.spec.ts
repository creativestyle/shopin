import { NotFoundException } from '@nestjs/common'
import { WishlistService } from './wishlist.service'

const STALE_ID = 'stale-wishlist'
const FRESH_ID = 'fresh-wishlist'

function createWishlist(id: string) {
  return { id, version: 1, items: [], itemCount: 0 }
}

describe('WishlistService', () => {
  let dataSourceWishlistService: {
    getWishlist: jest.Mock
    getOrCreateWishlist: jest.Mock
    addToWishlist: jest.Mock
    removeFromWishlist: jest.Mock
  }
  let wishlistIdService: {
    getLoggedInWishlistId: jest.Mock
    getGuestWishlistId: jest.Mock
    setLoggedInWishlistId: jest.Mock
    setGuestWishlistId: jest.Mock
    deleteLoggedInWishlistId: jest.Mock
    deleteGuestWishlistId: jest.Mock
  }
  let tokenProvider: { getAuthStatus: jest.Mock }
  let service: WishlistService

  beforeEach(() => {
    dataSourceWishlistService = {
      getWishlist: jest.fn(),
      getOrCreateWishlist: jest.fn(),
      addToWishlist: jest.fn(),
      removeFromWishlist: jest.fn(),
    }
    wishlistIdService = {
      getLoggedInWishlistId: jest.fn(),
      getGuestWishlistId: jest.fn().mockResolvedValue(STALE_ID),
      setLoggedInWishlistId: jest.fn(),
      setGuestWishlistId: jest.fn(),
      deleteLoggedInWishlistId: jest.fn(),
      deleteGuestWishlistId: jest.fn().mockImplementation(async () => {
        wishlistIdService.getGuestWishlistId.mockResolvedValue(undefined)
      }),
    }
    const dataSourceFactory = {
      getServices: () => ({ wishlistService: dataSourceWishlistService }),
    }
    tokenProvider = { getAuthStatus: jest.fn().mockResolvedValue(false) }
    const tokenStorageService = { hasAccessToken: () => true }

    service = new WishlistService(
      dataSourceFactory as never,
      wishlistIdService as never,
      tokenProvider as never,
      tokenStorageService as never
    )
  })

  it('keeps the wishlist ID and rethrows when a nested resource is missing', async () => {
    const itemNotFound = new NotFoundException('Wishlist item not found')
    dataSourceWishlistService.removeFromWishlist.mockRejectedValue(itemNotFound)
    dataSourceWishlistService.getWishlist.mockResolvedValue(
      createWishlist(STALE_ID)
    )

    await expect(
      service.removeFromWishlist({ lineItemId: 'gone' })
    ).rejects.toBe(itemNotFound)

    expect(dataSourceWishlistService.getWishlist).toHaveBeenCalledWith(STALE_ID)
    expect(wishlistIdService.deleteGuestWishlistId).not.toHaveBeenCalled()
    expect(dataSourceWishlistService.getOrCreateWishlist).not.toHaveBeenCalled()
    expect(dataSourceWishlistService.removeFromWishlist).toHaveBeenCalledTimes(
      1
    )
  })

  it('clears the stale ID and retries on a fresh wishlist when the wishlist is missing', async () => {
    const freshWishlist = createWishlist(FRESH_ID)
    dataSourceWishlistService.addToWishlist
      .mockRejectedValueOnce(new NotFoundException('Wishlist not found'))
      .mockResolvedValueOnce(freshWishlist)
    dataSourceWishlistService.getWishlist.mockRejectedValue(
      new NotFoundException('Wishlist not found')
    )
    dataSourceWishlistService.getOrCreateWishlist.mockResolvedValue(
      freshWishlist
    )

    const result = await service.addToWishlist({ productId: 'p1' })

    expect(result).toBe(freshWishlist)
    expect(wishlistIdService.deleteGuestWishlistId).toHaveBeenCalledTimes(1)
    expect(wishlistIdService.setGuestWishlistId).toHaveBeenCalledWith(FRESH_ID)
    expect(dataSourceWishlistService.addToWishlist).toHaveBeenNthCalledWith(
      1,
      STALE_ID,
      { productId: 'p1' }
    )
    expect(dataSourceWishlistService.addToWishlist).toHaveBeenNthCalledWith(
      2,
      FRESH_ID,
      { productId: 'p1' }
    )
  })

  it('clears the guest cookie a logged-in user fell back to when its wishlist is missing', async () => {
    tokenProvider.getAuthStatus.mockResolvedValue(true)
    wishlistIdService.getLoggedInWishlistId.mockResolvedValue(undefined)
    dataSourceWishlistService.getWishlist.mockRejectedValue(
      new NotFoundException('Wishlist not found')
    )

    await expect(service.getWishlist()).resolves.toBeNull()

    expect(wishlistIdService.deleteGuestWishlistId).toHaveBeenCalledTimes(1)
    expect(wishlistIdService.deleteLoggedInWishlistId).not.toHaveBeenCalled()
  })

  it('rethrows non-404 errors without checking the wishlist', async () => {
    const failure = new Error('boom')
    dataSourceWishlistService.addToWishlist.mockRejectedValue(failure)

    await expect(service.addToWishlist({ productId: 'p1' })).rejects.toBe(
      failure
    )

    expect(dataSourceWishlistService.getWishlist).not.toHaveBeenCalled()
    expect(wishlistIdService.deleteGuestWishlistId).not.toHaveBeenCalled()
  })
})
