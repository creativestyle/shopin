/**
 * The shop's mapper hooks (`commercetools({ mappers })`, docs/extending.md): each runs after the built-in
 * mapper and gets the commercetools resource, so a custom field or an attribute reaches the contract.
 */
import type { CartResponse } from '@core/contracts/cart/cart'
import { CartService } from '../cart.service'
import { ProductService } from '../product.service'
import { mapShoppingListToWishlist } from '../../mappers/wishlist'
import { mapProjectionsToCards } from '../../mappers/search-results'
import type { MapperHooks } from '../../mapper-hooks'
import type { ProductProjectionApiResponse } from '../../schemas/product-projection'
import commerce from '../../parts/commerce'
import { commercetools } from '../../shopin'
import { MapperHooks as MapperHooksToken } from '../../mapper-hooks'

const cartBody = {
  id: 'cart-1',
  version: 1,
  lineItems: [],
  totalPrice: { centAmount: 0, currencyCode: 'EUR' },
  custom: {
    type: { typeId: 'type', id: 't1' },
    fields: { giftMessage: 'Happy birthday' },
  },
}

const processCart = (hooks?: MapperHooks): Promise<CartResponse> => {
  const service = new CartService(
    {} as never,
    {} as never,
    { getCurrentLanguage: () => 'en-US' } as never,
    hooks
  ) as unknown as {
    processCartResponse(body: unknown, language: string): Promise<CartResponse>
  }
  return service.processCartResponse(cartBody, 'en-US')
}

const projection = {
  id: 'p1',
  createdAt: '2026-01-01T00:00:00.000Z',
  name: { 'en-US': 'Pool' },
  slug: { 'en-US': 'pool' },
  masterVariant: {
    id: 1,
    attributes: [{ name: 'poolType', value: 'above-ground' }],
  },
} as unknown as ProductProjectionApiResponse

/** A client whose product projection query answers `results`. */
const projectionsClient = (results: unknown[]) => ({
  productProjections: () => ({
    get: () => ({ execute: async () => ({ body: { results } }) }),
  }),
})
const english = { getCurrentLanguage: () => 'en-US' }
const poolType = (
  raw: { masterVariant: { attributes?: { name: string; value: unknown }[] } },
  mapped: object
) => ({
  ...mapped,
  poolType: raw.masterVariant.attributes?.find((a) => a.name === 'poolType')
    ?.value as string,
})

describe('commercetools mapper hooks', () => {
  it('the cart hook reads the cart custom field after the built-in mapper', async () => {
    const cart = await processCart({
      cart: (raw, mapped) => ({
        ...mapped,
        giftMessage: raw.custom?.fields?.giftMessage as string,
      }),
    })
    expect(cart).toMatchObject({ id: 'cart-1', giftMessage: 'Happy birthday' })
  })

  it('without a hook the cart has no shop field', async () => {
    const cart = await processCart()
    expect(cart).not.toHaveProperty('giftMessage')
  })

  it('the card hook reads a product attribute for search results and category pages', () => {
    const [card] = mapProjectionsToCards(
      ['p1'],
      [projection],
      'en-US',
      (raw, mapped) => ({
        ...mapped,
        poolType: raw.masterVariant.attributes?.find(
          (a) => a.name === 'poolType'
        )?.value as string,
      })
    )
    expect(card).toMatchObject({ id: 'p1', poolType: 'above-ground' })
    const [plain] = mapProjectionsToCards(['p1'], [projection], 'en-US')
    expect(plain).not.toHaveProperty('poolType')
  })

  it('the product hook reads a product attribute for the product page', async () => {
    const hooked = new ProductService(
      projectionsClient([projection]) as never,
      english as never,
      { product: poolType } as never
    )
    expect((await hooked.getProduct('pool')).product).toMatchObject({
      id: 'p1',
      name: 'Pool',
      poolType: 'above-ground',
    })
    const plain = new ProductService(
      projectionsClient([projection]) as never,
      english as never
    )
    expect((await plain.getProduct('pool')).product).not.toHaveProperty(
      'poolType'
    )
  })

  it('the card hook reads a product attribute for the cards of a wishlist', async () => {
    const list = {
      id: 'w1',
      version: 1,
      lineItems: [
        {
          id: 'l1',
          productId: 'p1',
          name: { 'en-US': 'Pool' },
          variant: {
            id: 1,
            prices: [
              {
                value: {
                  centAmount: 100,
                  currencyCode: 'EUR',
                  fractionDigits: 2,
                },
              },
            ],
          },
        },
      ],
    }
    const wishlist = await mapShoppingListToWishlist(
      list as never,
      'en-US',
      projectionsClient([projection]) as never,
      poolType as never
    )
    expect(wishlist.items[0]).toMatchObject({
      id: 'l1',
      product: { id: 'p1', slug: 'pool', poolType: 'above-ground' },
    })
    const plain = await mapShoppingListToWishlist(
      list as never,
      'en-US',
      projectionsClient([projection]) as never
    )
    expect(plain.items[0]!.product).not.toHaveProperty('poolType')
  })

  it('the descriptor hands the hooks to the commerce port', () => {
    const cart = (_: unknown, mapped: CartResponse) => mapped
    const integration = commercetools({ mappers: { cart } })
    for (const load of [integration.ports.commerce]) {
      const hooks = (
        load().providers as { provide?: unknown; useValue?: unknown }[]
      ).find((p) => p.provide === MapperHooksToken)
      expect(hooks?.useValue).toEqual({ cart })
    }
    expect(commerce.category).toBe('commerce')
  })
})
