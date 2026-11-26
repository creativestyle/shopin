import { AuthService } from '../auth.service'

describe('AuthService.logout', () => {
  it('ends the session of every data source', async () => {
    const logoutService = { logout: jest.fn() }
    const tokenStorageService = {
      getTokens: jest.fn(async () => ({ accessToken: 'a', refreshToken: 'r' })),
      clearTokens: jest.fn(),
      clearAllTokens: jest.fn(),
    }
    const cartIdService = {
      deleteAllCartIds: jest.fn(),
      deleteCartIdsOfAllDataSources: jest.fn(),
    }
    const wishlistIdService = { deleteAllWishlistIds: jest.fn() }
    const service = new AuthService(
      { getAuthServices: () => ({ logoutService }) } as never,
      tokenStorageService as never,
      cartIdService as never,
      wishlistIdService as never
    )

    await service.logout()

    expect(logoutService.logout).toHaveBeenCalledWith({
      accessToken: 'a',
      refreshToken: 'r',
    })
    expect(tokenStorageService.clearAllTokens).toHaveBeenCalled()
    expect(tokenStorageService.clearTokens).not.toHaveBeenCalled()
    expect(cartIdService.deleteCartIdsOfAllDataSources).toHaveBeenCalled()
    expect(cartIdService.deleteAllCartIds).not.toHaveBeenCalled()
  })
})
