import { act, renderHook } from '@testing-library/react'
import type { LineItemResponse } from '@core/contracts/cart/cart'
import { CART_LINE_ITEM_MAX_QUANTITY } from '@config/constants'
import { useCartItemQuantity } from '../use-cart-item-quantity'

const mockHandleUpdate = jest.fn()

jest.mock('../../../hooks/use-update-cart-item', () => ({
  useUpdateCartItem: () => ({
    handleUpdate: mockHandleUpdate,
    isPending: false,
  }),
}))

const DEBOUNCE_MS = 300

function createItem(overrides: Partial<LineItemResponse> = {}) {
  return {
    id: 'line-item-1',
    productId: 'product-1',
    quantity: 1,
    ...overrides,
  } as LineItemResponse
}

function renderQuantityHook(item: LineItemResponse) {
  return renderHook(() =>
    useCartItemQuantity({ item, debounceMs: DEBOUNCE_MS })
  )
}

async function flushDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(DEBOUNCE_MS)
  })
}

describe('useCartItemQuantity', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockHandleUpdate.mockReset()
    mockHandleUpdate.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('max', () => {
    it('uses maxQuantity from the line item', () => {
      const { result } = renderQuantityHook(
        createItem({ quantity: 1, maxQuantity: 5 })
      )

      expect(result.current.max).toBe(5)
    })

    it('falls back to the per-line cap when maxQuantity is missing', () => {
      const { result } = renderQuantityHook(createItem({ quantity: 1 }))

      expect(result.current.max).toBe(CART_LINE_ITEM_MAX_QUANTITY)
    })

    it('never drops below the current quantity', () => {
      const { result } = renderQuantityHook(
        createItem({ quantity: 4, maxQuantity: 2 })
      )

      expect(result.current.max).toBe(4)
    })
  })

  describe('handleIncrease', () => {
    it('increases below max and sends the new quantity', async () => {
      const { result } = renderQuantityHook(
        createItem({ quantity: 1, maxQuantity: 3 })
      )

      act(() => result.current.handleIncrease())
      expect(result.current.optimisticQuantity).toBe(2)

      await flushDebounce()
      expect(mockHandleUpdate).toHaveBeenCalledWith({
        lineItemId: 'line-item-1',
        quantity: 2,
      })
    })

    it('is blocked at max', async () => {
      const { result } = renderQuantityHook(
        createItem({ quantity: 2, maxQuantity: 2 })
      )

      act(() => result.current.handleIncrease())
      expect(result.current.optimisticQuantity).toBe(2)

      await flushDebounce()
      expect(mockHandleUpdate).not.toHaveBeenCalled()
    })

    it('stops at max after repeated clicks', async () => {
      const { result } = renderQuantityHook(
        createItem({ quantity: 1, maxQuantity: 3 })
      )

      act(() => {
        result.current.handleIncrease()
        result.current.handleIncrease()
        result.current.handleIncrease()
        result.current.handleIncrease()
      })
      expect(result.current.optimisticQuantity).toBe(3)

      await flushDebounce()
      expect(mockHandleUpdate).toHaveBeenCalledTimes(1)
      expect(mockHandleUpdate).toHaveBeenCalledWith({
        lineItemId: 'line-item-1',
        quantity: 3,
      })
    })

    it('is blocked at the per-line cap when maxQuantity is missing', async () => {
      const { result } = renderQuantityHook(
        createItem({ quantity: CART_LINE_ITEM_MAX_QUANTITY })
      )

      act(() => result.current.handleIncrease())
      expect(result.current.optimisticQuantity).toBe(
        CART_LINE_ITEM_MAX_QUANTITY
      )

      await flushDebounce()
      expect(mockHandleUpdate).not.toHaveBeenCalled()
    })
  })

  describe('handleDirectInputChange', () => {
    it('clamps typed values to max', async () => {
      const { result } = renderQuantityHook(
        createItem({ quantity: 1, maxQuantity: 5 })
      )

      await act(async () => result.current.handleDirectInputChange(50))

      expect(result.current.optimisticQuantity).toBe(5)
      expect(mockHandleUpdate).toHaveBeenCalledWith({
        lineItemId: 'line-item-1',
        quantity: 5,
      })
    })

    it('clamps typed values to the per-line cap when maxQuantity is missing', async () => {
      const { result } = renderQuantityHook(createItem({ quantity: 1 }))

      await act(async () => result.current.handleDirectInputChange(500))

      expect(result.current.optimisticQuantity).toBe(
        CART_LINE_ITEM_MAX_QUANTITY
      )
      expect(mockHandleUpdate).toHaveBeenCalledWith({
        lineItemId: 'line-item-1',
        quantity: CART_LINE_ITEM_MAX_QUANTITY,
      })
    })

    it('passes values within max through unchanged', async () => {
      const { result } = renderQuantityHook(
        createItem({ quantity: 1, maxQuantity: 5 })
      )

      await act(async () => result.current.handleDirectInputChange(4))

      expect(result.current.optimisticQuantity).toBe(4)
      expect(mockHandleUpdate).toHaveBeenCalledWith({
        lineItemId: 'line-item-1',
        quantity: 4,
      })
    })
  })
})
