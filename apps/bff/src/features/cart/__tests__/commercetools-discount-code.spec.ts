import { Logger } from '@nestjs/common'
import { DiscountCodeError } from '@core/contracts/cart/cart'
import {
  CartService,
  findRejectedDiscountCode,
  toDiscountCodeError,
  type CartApiResponse,
} from '@integrations/commercetools-api'

function apiCart(
  discountCodes: { id: string; code: string; state: string }[] = []
): CartApiResponse {
  return {
    id: 'cart-1',
    version: 3,
    totalPrice: { centAmount: 2000, currencyCode: 'EUR' },
    discountCodes: discountCodes.map(({ id, code, state }) => ({
      discountCode: { typeId: 'discount-code', id, obj: { code } },
      state,
    })),
  } as CartApiResponse
}

function ctError(code: string, reason?: string) {
  return { statusCode: 400, body: { errors: [{ code, reason }] } }
}

describe('findRejectedDiscountCode', () => {
  it('returns nothing when the code matches the cart', () => {
    const cart = apiCart([{ id: 'dc-1', code: 'SAVE10', state: 'MatchesCart' }])

    expect(findRejectedDiscountCode(cart, 'SAVE10')).toBeUndefined()
  })

  it('returns nothing when the code is not on the cart', () => {
    expect(findRejectedDiscountCode(apiCart(), 'SAVE10')).toBeUndefined()
  })

  it.each([
    ['NotValid', 'expired'],
    ['NotActive', 'invalid'],
    ['DoesNotMatchCart', 'notApplicable'],
    ['MaxApplicationReached', 'notApplicable'],
    ['ApplicationStoppedByPreviousDiscount', 'notApplicable'],
    ['ApplicationStoppedByGroupBestDeal', 'notApplicable'],
    ['SomeFutureState', 'notApplicable'],
  ])('maps state %s to %s', (state, reason) => {
    const cart = apiCart([{ id: 'dc-1', code: 'SAVE10', state }])

    expect(findRejectedDiscountCode(cart, 'SAVE10')).toEqual({
      id: 'dc-1',
      reason,
    })
  })
})

describe('toDiscountCodeError', () => {
  it('maps TimeRangeNonApplicable to expired', () => {
    const error = toDiscountCodeError(
      ctError('DiscountCodeNonApplicable', 'TimeRangeNonApplicable')
    )

    expect(error).toBeInstanceOf(DiscountCodeError)
    expect((error as DiscountCodeError).reason).toBe('expired')
  })

  it.each([['DoesNotExist'], [undefined]])(
    'maps DiscountCodeNonApplicable with reason %s to invalid',
    (reason) => {
      const error = toDiscountCodeError(
        ctError('DiscountCodeNonApplicable', reason)
      )

      expect((error as DiscountCodeError).reason).toBe('invalid')
    }
  )

  it.each([
    ['another CT error', ctError('ConcurrentModification')],
    ['a plain error', new Error('network down')],
    ['undefined', undefined],
  ])('returns %s unchanged', (_label, input) => {
    expect(toDiscountCodeError(input)).toBe(input)
  })
})

describe('CartService.addDiscountCode', () => {
  function createService(...postResults: (() => Promise<unknown>)[]) {
    const post = jest.fn()
    for (const result of postResults) {
      post.mockReturnValueOnce({ execute: result })
    }
    const getVersion = jest.fn().mockResolvedValue({ body: apiCart() })
    const client = {
      me: () => ({
        carts: () => ({
          withId: () => ({ get: () => ({ execute: getVersion }), post }),
        }),
      }),
    }
    const service = new CartService(
      { getClient: jest.fn().mockResolvedValue(client) } as never,
      {} as never,
      { getCurrentLanguage: () => 'en-US' } as never
    )
    return { service, post }
  }

  const sentActions = (post: jest.Mock, call: number) =>
    post.mock.calls[call][0].body.actions

  afterEach(() => jest.restoreAllMocks())

  it('returns the cart with the code marked applied when it matches', async () => {
    const { service, post } = createService(() =>
      Promise.resolve({
        body: apiCart([{ id: 'dc-1', code: 'SAVE10', state: 'MatchesCart' }]),
      })
    )

    const cart = await service.addDiscountCode('cart-1', 'SAVE10')

    expect(cart.discountCodes).toEqual([
      { id: 'dc-1', code: 'SAVE10', applied: true },
    ])
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('removes replaced codes in the same update, before adding the new one', async () => {
    const { service, post } = createService(() =>
      Promise.resolve({
        body: apiCart([{ id: 'dc-2', code: 'SAVE10', state: 'MatchesCart' }]),
      })
    )

    await service.addDiscountCode('cart-1', 'SAVE10', ['dc-1'])

    expect(post).toHaveBeenCalledTimes(1)
    expect(sentActions(post, 0)).toEqual([
      {
        action: 'removeDiscountCode',
        discountCode: { typeId: 'discount-code', id: 'dc-1' },
      },
      { action: 'addDiscountCode', code: 'SAVE10' },
    ])
  })

  it('removes a code CT accepted but did not apply, then throws notApplicable', async () => {
    const { service, post } = createService(
      () =>
        Promise.resolve({
          body: apiCart([
            { id: 'dc-1', code: 'SAVE10', state: 'DoesNotMatchCart' },
          ]),
        }),
      () => Promise.resolve({ body: apiCart() })
    )

    const error = await service
      .addDiscountCode('cart-1', 'SAVE10')
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(DiscountCodeError)
    expect((error as DiscountCodeError).reason).toBe('notApplicable')
    expect(sentActions(post, 1)).toEqual([
      {
        action: 'removeDiscountCode',
        discountCode: { typeId: 'discount-code', id: 'dc-1' },
      },
    ])
  })

  it('logs a failed rollback and still throws the rejection reason', async () => {
    const warn = jest.spyOn(Logger, 'warn').mockImplementation(() => {})
    const { service } = createService(
      () =>
        Promise.resolve({
          body: apiCart([{ id: 'dc-1', code: 'SAVE10', state: 'NotValid' }]),
        }),
      () => Promise.reject(new Error('conflict'))
    )

    const error = await service
      .addDiscountCode('cart-1', 'SAVE10')
      .catch((caught: unknown) => caught)

    expect((error as DiscountCodeError).reason).toBe('expired')
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('cart-1'),
      expect.any(Error),
      'CartService'
    )
  })

  it('maps a CT rejection of the action itself to a DiscountCodeError', async () => {
    const { service } = createService(() =>
      Promise.reject(ctError('DiscountCodeNonApplicable', 'DoesNotExist'))
    )

    const error = await service
      .addDiscountCode('cart-1', 'NOPE')
      .catch((caught: unknown) => caught)

    expect((error as DiscountCodeError).reason).toBe('invalid')
  })
})
