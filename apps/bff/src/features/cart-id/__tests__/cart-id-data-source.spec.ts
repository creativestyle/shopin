import type { DataSource } from '@config/constants'
import { CartIdService } from '../cart-id.service'
import { CartKeyService } from '../cart-key.service'
import { getCartKey } from '../cart.utils'

function createCookieJar() {
  const jar = new Map<string, string>()
  return {
    jar,
    getCookie: (name: string) => jar.get(name),
    setCookie: (name: string, value: string) => {
      jar.set(name, value)
    },
    clearCookie: (name: string) => {
      jar.delete(name)
    },
    createCookieOptions: () => ({}),
    getAllCookieNames: () => Array.from(jar.keys()),
  }
}

function createCartIdService(
  cookies: ReturnType<typeof createCookieJar>,
  dataSource: DataSource
) {
  const languageProvider = { getCurrentLanguage: () => 'en-US' }
  const cartKeyService = new CartKeyService(
    languageProvider as never,
    dataSource
  )
  return new CartIdService(cartKeyService, cookies as never)
}

describe('getCartKey', () => {
  it('keeps the existing key for commercetools data sources', () => {
    expect(getCartKey('USD', true, 'commercetools-set')).toBe('cart-guest-USD')
    expect(getCartKey('USD', false, 'commercetools-algolia-set')).toBe(
      'cart-logged-USD'
    )
  })

  it('gives mock-set its own key', () => {
    expect(getCartKey('USD', true, 'mock-set')).toBe('cart-guest-USD-mock')
    expect(getCartKey('EUR', false, 'mock-set')).toBe('cart-logged-EUR-mock')
  })
})

describe('CartIdService across data sources', () => {
  it('does not hand a commercetools cart id to mock-set after a switch', async () => {
    const cookies = createCookieJar()
    await createCartIdService(cookies, 'commercetools-set').setGuestCartId(
      'ct-cart-1'
    )

    const mock = createCartIdService(cookies, 'mock-set')
    expect(await mock.getGuestCartId()).toBeUndefined()

    await mock.setGuestCartId('mock-cart-1')
    expect(
      await createCartIdService(cookies, 'commercetools-set').getGuestCartId()
    ).toBe('ct-cart-1')
    expect(await mock.getGuestCartId()).toBe('mock-cart-1')
  })

  it('shares the cart between commercetools-set and commercetools-algolia-set', async () => {
    const cookies = createCookieJar()
    await createCartIdService(cookies, 'commercetools-set').setGuestCartId(
      'ct-cart-1'
    )

    expect(
      await createCartIdService(
        cookies,
        'commercetools-algolia-set'
      ).getGuestCartId()
    ).toBe('ct-cart-1')
  })

  it.each([
    ['mock-set', 'cart-guest-USD'],
    ['commercetools-set', 'cart-logged-USD-mock'],
  ] as const)(
    'clears only the cart cookies of %s, keeping %s',
    async (dataSource, keptKey) => {
      const cookies = createCookieJar()
      await createCartIdService(cookies, 'commercetools-set').setGuestCartId(
        'ct-cart-1'
      )
      await createCartIdService(cookies, 'mock-set').setLoggedInCartId(
        'mock-cart-1'
      )

      await createCartIdService(cookies, dataSource).deleteAllCartIds()

      expect([...cookies.jar.keys()]).toEqual([keptKey])
    }
  )

  it('clears the cart cookies of every data source on sign-out', async () => {
    const cookies = createCookieJar()
    await createCartIdService(cookies, 'commercetools-set').setGuestCartId(
      'ct-cart-1'
    )
    await createCartIdService(cookies, 'mock-set').setLoggedInCartId(
      'mock-cart-1'
    )

    await createCartIdService(
      cookies,
      'mock-set'
    ).deleteCartIdsOfAllDataSources()

    expect(cookies.jar.size).toBe(0)
  })
})
