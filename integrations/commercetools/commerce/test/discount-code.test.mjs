import { describe, it, mock, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { format } from 'node:util'
import { Logger } from '@nestjs/common'
import contractsCart from '@core/contracts/cart/cart'
import cartService from '../dist/services/cart.service.js'
import customerScope from '../dist/shared/customer-scope.service.js'
import discountCode from '../dist/helpers/discount-code.js'

const { CartVersionConflictError, DiscountCodeError } = contractsCart
const { CartService } = cartService
const { CustomerScope } = customerScope
const { findRejectedDiscountCode, toDiscountCodeError } = discountCode

function apiCart(discountCodes = []) {
  return {
    id: 'cart-1',
    version: 3,
    totalPrice: { centAmount: 2000, currencyCode: 'EUR' },
    discountCodes: discountCodes.map(({ id, code, state }) => ({
      discountCode: { typeId: 'discount-code', id, obj: { code } },
      state,
    })),
  }
}

function ctError(code, reason) {
  return { statusCode: 400, body: { errors: [{ code, reason }] } }
}

describe('findRejectedDiscountCode', () => {
  it('returns nothing when the code matches the cart', () => {
    const cart = apiCart([{ id: 'dc-1', code: 'SAVE10', state: 'MatchesCart' }])

    assert.equal(findRejectedDiscountCode(cart, 'SAVE10'), undefined)
  })

  it('returns nothing when the code is not on the cart', () => {
    assert.equal(findRejectedDiscountCode(apiCart(), 'SAVE10'), undefined)
  })

  for (const [state, reason] of [
    ['NotValid', 'expired'],
    ['NotActive', 'invalid'],
    ['DoesNotMatchCart', 'notApplicable'],
    ['MaxApplicationReached', 'notApplicable'],
    ['ApplicationStoppedByPreviousDiscount', 'notApplicable'],
    ['ApplicationStoppedByGroupBestDeal', 'notApplicable'],
    ['SomeFutureState', 'notApplicable'],
  ]) {
    it(format('maps state %s to %s', state, reason), () => {
      const cart = apiCart([{ id: 'dc-1', code: 'SAVE10', state }])

      assert.deepEqual(findRejectedDiscountCode(cart, 'SAVE10'), {
        id: 'dc-1',
        reason,
      })
    })
  }
})

describe('toDiscountCodeError', () => {
  it('maps TimeRangeNonApplicable to expired', () => {
    const error = toDiscountCodeError(
      ctError('DiscountCodeNonApplicable', 'TimeRangeNonApplicable')
    )

    assert.ok(error instanceof DiscountCodeError)
    assert.equal(error.reason, 'expired')
  })

  for (const [reason] of [['DoesNotExist'], [undefined]]) {
    it(
      format(
        'maps DiscountCodeNonApplicable with reason %s to invalid',
        reason
      ),
      () => {
        const error = toDiscountCodeError(
          ctError('DiscountCodeNonApplicable', reason)
        )

        assert.equal(error.reason, 'invalid')
      }
    )
  }

  for (const [label, input] of [
    ['another CT error', ctError('ConcurrentModification')],
    ['a plain error', new Error('network down')],
    ['undefined', undefined],
  ]) {
    it(format('returns %s unchanged', label), () => {
      assert.equal(toDiscountCodeError(input), input)
    })
  }
})

describe('CartService.addDiscountCode', () => {
  function createService(...postResults) {
    // each call answers the next result once, then nothing (as jest's mockReturnValueOnce)
    const results = postResults.map((result) => ({ execute: result }))
    const post = mock.fn(() => results.shift())
    const getVersion = mock.fn(async () => ({ body: apiCart() }))
    const client = {
      me: () => ({
        carts: () => ({
          withId: () => ({ get: () => ({ execute: getVersion }), post }),
        }),
      }),
    }
    const service = new CartService(
      new CustomerScope(
        {},
        { getClient: mock.fn(async () => client) },
        { get: async () => undefined }
      ),
      {},
      { getCurrentLanguage: () => 'en-US' }
    )
    return { service, post, getVersion }
  }

  const sentActions = (post, call) =>
    post.mock.calls[call].arguments[0].body.actions

  afterEach(() => mock.restoreAll())

  it('returns the cart with the code marked applied when it matches', async () => {
    const { service, post } = createService(() =>
      Promise.resolve({
        body: apiCart([{ id: 'dc-1', code: 'SAVE10', state: 'MatchesCart' }]),
      })
    )

    const cart = await service.addDiscountCode('cart-1', 'SAVE10')

    assert.deepEqual(cart.discountCodes, [
      { id: 'dc-1', code: 'SAVE10', applied: true },
    ])
    assert.equal(post.mock.callCount(), 1)
  })

  it('removes replaced codes in the same update, before adding the new one', async () => {
    const { service, post } = createService(() =>
      Promise.resolve({
        body: apiCart([{ id: 'dc-2', code: 'SAVE10', state: 'MatchesCart' }]),
      })
    )

    await service.addDiscountCode('cart-1', 'SAVE10', {
      replaceDiscountCodeIds: ['dc-1'],
    })

    assert.equal(post.mock.callCount(), 1)
    assert.deepEqual(sentActions(post, 0), [
      {
        action: 'removeDiscountCode',
        discountCode: { typeId: 'discount-code', id: 'dc-1' },
      },
      { action: 'addDiscountCode', code: 'SAVE10' },
    ])
  })

  it('sends the version the caller checked instead of re-reading it', async () => {
    const { service, post, getVersion } = createService(() =>
      Promise.resolve({
        body: apiCart([{ id: 'dc-1', code: 'SAVE10', state: 'MatchesCart' }]),
      })
    )

    await service.addDiscountCode('cart-1', 'SAVE10', { expectedVersion: 2 })

    assert.equal(post.mock.calls[0].arguments[0].body.version, 2)
    assert.equal(getVersion.mock.callCount(), 0)
  })

  it('throws CartVersionConflictError when the cart moved past the checked version', async () => {
    const { service } = createService(() =>
      Promise.reject({
        statusCode: 409,
        body: { errors: [{ code: 'ConcurrentModification' }] },
      })
    )

    const error = await service
      .addDiscountCode('cart-1', 'SAVE10', { expectedVersion: 2 })
      .catch((caught) => caught)

    assert.ok(error instanceof CartVersionConflictError)
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
      .catch((caught) => caught)

    assert.ok(error instanceof DiscountCodeError)
    assert.equal(error.reason, 'notApplicable')
    assert.deepEqual(sentActions(post, 1), [
      {
        action: 'removeDiscountCode',
        discountCode: { typeId: 'discount-code', id: 'dc-1' },
      },
    ])
  })

  it('logs a failed rollback and still throws the rejection reason', async () => {
    const warn = mock.method(Logger, 'warn', () => {})
    const { service } = createService(
      () =>
        Promise.resolve({
          body: apiCart([{ id: 'dc-1', code: 'SAVE10', state: 'NotValid' }]),
        }),
      () => Promise.reject(new Error('conflict'))
    )

    const error = await service
      .addDiscountCode('cart-1', 'SAVE10')
      .catch((caught) => caught)

    assert.equal(error.reason, 'expired')
    // called with (a message naming the cart, an Error, 'CartService')
    assert.ok(
      warn.mock.calls.some(
        ({ arguments: [message, cause, context, ...more] }) =>
          more.length === 0 &&
          typeof message === 'string' &&
          message.includes('cart-1') &&
          cause instanceof Error &&
          context === 'CartService'
      ),
      `Logger.warn calls: ${JSON.stringify(warn.mock.calls.map((c) => c.arguments))}`
    )
  })

  it('maps a CT rejection of the action itself to a DiscountCodeError', async () => {
    const { service } = createService(() =>
      Promise.reject(ctError('DiscountCodeNonApplicable', 'DoesNotExist'))
    )

    const error = await service
      .addDiscountCode('cart-1', 'NOPE')
      .catch((caught) => caught)

    assert.equal(error.reason, 'invalid')
  })
})
