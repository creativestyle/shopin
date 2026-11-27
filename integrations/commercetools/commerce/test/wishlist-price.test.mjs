import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import wishlistService from '../dist/services/wishlist.service.js'
import customerScope from '../dist/shared/customer-scope.service.js'

const { WishlistService } = wishlistService
const { CustomerScope } = customerScope

/** The store has no distribution channel (StoreChannels): prices by currency and country. */
const noChannel = { priceChannel: () => undefined }

/**
 * Jest's `toHaveBeenCalledWith({ queryArgs: expect.objectContaining(fields) })`: some call had exactly one
 * argument, `{ queryArgs }`, whose `queryArgs` holds each of the fields.
 */
const assertCalledWithQueryArgs = (fn, fields) =>
  assert.ok(
    fn.mock.calls.some(
      ({ arguments: args }) =>
        args.length === 1 &&
        isDeepStrictEqual(Object.keys(args[0]), ['queryArgs']) &&
        Object.entries(fields).every(([k, v]) =>
          isDeepStrictEqual(args[0].queryArgs[k], v)
        )
    ),
    `no call with queryArgs containing ${JSON.stringify(fields)}: ${JSON.stringify(fn.mock.calls.map((c) => c.arguments))}`
  )

/** Jest's `toEqual` ignores properties set to undefined: compare the defined fields only. */
const definedFields = (value) =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined))

function price(id, centAmount, currencyCode, country) {
  return {
    id,
    value: {
      centAmount,
      currencyCode,
      type: 'centPrecision',
      fractionDigits: 2,
    },
    ...(country && { country }),
  }
}

function lineItem(id, prices) {
  return {
    id,
    productId: `product-${id}`,
    name: { 'de-DE': `Product ${id}` },
    variant: { id: 1, prices },
  }
}

// The product projection as commercetools returns it with Price Selection:
// `price` is the one price it picked for the store, absent when it picked none.
function projection(id, selected) {
  return {
    id: `product-${id}`,
    createdAt: '2020-01-01T00:00:00.000Z',
    name: { 'de-DE': `Product ${id}` },
    slug: { 'de-DE': `product-${id}` },
    masterVariant: { id: 1, ...(selected && { price: selected }) },
  }
}

function createService(language, lineItems, projections) {
  const shoppingList = { id: 'wishlist-1', version: 1, lineItems }
  const execute = (body) => ({
    execute: mock.fn(async () => ({ body })),
  })
  const projectionsResult = execute({ results: projections })
  const projectionsGet = mock.fn(() => projectionsResult)
  const client = {
    me: () => ({
      shoppingLists: () => ({
        withId: () => ({ get: () => execute(shoppingList) }),
      }),
    }),
    productProjections: () => ({ get: projectionsGet }),
  }
  const userClientService = { getClient: async () => client }
  const languageProvider = { getCurrentLanguage: () => language }
  const service = new WishlistService(
    new CustomerScope({}, userClientService, { get: async () => undefined }),
    languageProvider,
    noChannel
  )
  return { service, projectionsGet }
}

describe('CommercetoolsWishlistService price selection', () => {
  it('shows the price commercetools selected for the store, not one from the line item list', async () => {
    const { service, projectionsGet } = createService(
      'de-DE',
      [
        lineItem('a', [
          price('usd', 9900, 'USD', 'US'),
          price('eur-at', 8800, 'EUR', 'AT'),
        ]),
      ],
      [projection('a', price('eur-de', 3000, 'EUR', 'DE'))]
    )

    const wishlist = await service.getWishlist('wishlist-1')

    assertCalledWithQueryArgs(projectionsGet, {
      priceCurrency: 'EUR',
      priceCountry: 'DE',
    })
    assert.deepEqual(definedFields(wishlist.items[0]?.product.price), {
      regularPriceInCents: 3000,
      currency: 'EUR',
      fractionDigits: 2,
    })
    assert.equal(wishlist.items[0]?.product.slug, 'product-a')
  })

  it('keeps an item commercetools selected no price for, without a price', async () => {
    const { service } = createService(
      'de-DE',
      [lineItem('a', [price('eur-de', 3000, 'EUR', 'DE')])],
      [projection('a')]
    )

    const wishlist = await service.getWishlist('wishlist-1')

    assert.equal(wishlist.itemCount, 1)
    assert.equal(wishlist.items[0]?.product.price, undefined)
  })
})
