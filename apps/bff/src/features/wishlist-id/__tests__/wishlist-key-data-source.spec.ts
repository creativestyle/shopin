import { WishlistKeyService } from '../wishlist-key.service'
import { getWishlistKey } from '../wishlist.utils'

describe('wishlist keys across data sources', () => {
  it('keeps the existing keys for commercetools data sources', () => {
    expect(getWishlistKey(true, 'commercetools-set')).toBe('wishlist-guest')
    expect(getWishlistKey(false, 'commercetools-algolia-set')).toBe(
      'wishlist-logged'
    )
  })

  it('gives mock-set its own keys, so a switch keeps both wishlists', () => {
    const mock = new WishlistKeyService('mock-set')
    const commercetools = new WishlistKeyService('commercetools-set')

    expect(mock.getGuestWishlistKey()).toBe('wishlist-guest-mock')
    expect(mock.getLoggedInWishlistKey()).toBe('wishlist-logged-mock')
    expect(commercetools.getGuestWishlistKey()).not.toBe(
      mock.getGuestWishlistKey()
    )
  })
})
