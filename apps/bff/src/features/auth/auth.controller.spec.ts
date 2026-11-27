/**
 * The cart and wishlist around sign-in and registration (the controller's order of steps): a registration signs no
 * one in, so the guest keeps the cart; a sign-in renews an expired guest token first, takes the cart over, and drops
 * the guest token only after the take-over succeeded.
 */
import { AuthController } from './auth.controller'

function setup(opts: { setupFails?: boolean } = {}) {
  const calls: string[] = []
  const log = (name: string) => () => {
    calls.push(name)
  }
  const authService = {
    renewGuestSession: jest.fn(async () => log('renewGuestSession')()),
    login: jest.fn(async () => (calls.push('login'), { success: true })),
    register: jest.fn(async () => (calls.push('register'), { success: true })),
    dropGuestSession: jest.fn(async () => log('dropGuestSession')()),
  }
  const cartService = {
    setupCartAfterLogin: jest.fn(async () => {
      calls.push('setupCartAfterLogin')
      if (opts.setupFails) {
        throw new Error('platform unavailable')
      }
    }),
  }
  const cartIdService = { getGuestCartId: jest.fn(async () => 'guest-cart') }
  const wishlistService = {
    getGuestWishlistItemsForMerge: jest.fn(async () => []),
    setupWishlistAfterLogin: jest.fn(async () => undefined),
  }
  const wishlistIdService = {
    getGuestWishlistId: jest.fn(async () => undefined),
  }
  const controller = new AuthController(
    authService as never,
    cartService as never,
    cartIdService as never,
    wishlistService as never,
    wishlistIdService as never,
    { log: jest.fn() } as never
  )
  return { controller, calls, authService, cartService, cartIdService }
}
const req = { headers: {}, ip: '127.0.0.1' } as never

describe('cart and wishlist around sign-in', () => {
  it('a registration signs no one in: the guest keeps the cart (nothing taken over, nothing dropped)', async () => {
    const { controller, calls, cartIdService } = setup()
    await controller.register(req, {
      firstName: 'A',
      lastName: 'B',
      email: 'a@example.com',
      password: 'Secret12345',
      acceptTerms: true,
    } as never)
    expect(calls).toEqual(['register'])
    expect(cartIdService.getGuestCartId).not.toHaveBeenCalled()
  })

  it('a sign-in renews the guest token, signs in, takes the cart over, then drops the guest token', async () => {
    const { controller, calls, cartService } = setup()
    await controller.login(req, { email: 'a@example.com', password: 'x' })
    expect(calls).toEqual([
      'renewGuestSession',
      'login',
      'setupCartAfterLogin',
      'dropGuestSession',
    ])
    expect(cartService.setupCartAfterLogin).toHaveBeenCalledWith('guest-cart')
  })

  it('a take-over that fails keeps the guest token (the cart is not lost); the sign-in still succeeds', async () => {
    const { controller, calls } = setup({ setupFails: true })
    await expect(
      controller.login(req, { email: 'a@example.com', password: 'x' })
    ).resolves.toMatchObject({ success: true })
    expect(calls).not.toContain('dropGuestSession')
  })
})
