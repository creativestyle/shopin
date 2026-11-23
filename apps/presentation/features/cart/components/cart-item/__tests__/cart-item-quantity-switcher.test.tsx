import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LineItemResponse } from '@core/contracts/cart/cart'
import { CartItemQuantitySwitcher } from '../cart-item-quantity-switcher'
import { useCartItemQuantity } from '../use-cart-item-quantity'

jest.mock('../use-cart-item-quantity', () => ({
  useCartItemQuantity: jest.fn(),
}))

const mockUseCartItemQuantity = jest.mocked(useCartItemQuantity)

function createItem(quantity: number): LineItemResponse {
  return {
    id: 'line-1',
    productId: 'product-1',
    name: 'Shirt',
    quantity,
    price: { regularPriceInCents: 2000, currency: 'EUR' },
  }
}

function mockQuantity(optimisticQuantity: number) {
  mockUseCartItemQuantity.mockReturnValue({
    optimisticQuantity,
    max: 99,
    isUpdating: false,
    handleIncrease: jest.fn(),
    handleDecrease: jest.fn(),
    handleDirectInputChange: jest.fn(),
  })
}

describe('CartItemQuantitySwitcher', () => {
  const user = userEvent.setup()

  it('stays out of remove mode while the server quantity is above min', async () => {
    mockQuantity(1)
    const handleRemoveClick = jest.fn()
    render(
      <CartItemQuantitySwitcher
        item={createItem(2)}
        itemName='Shirt'
        onRemoveClick={handleRemoveClick}
      />
    )

    const decreaseButton = screen.getByRole('button', { name: /decreaseTo/ })
    expect(decreaseButton).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'cart.item.removeNamed' })
    ).not.toBeInTheDocument()
    await user.click(decreaseButton)
    expect(handleRemoveClick).not.toHaveBeenCalled()
  })

  it('calls onRemoveClick when both quantities are at min', async () => {
    mockQuantity(1)
    const handleRemoveClick = jest.fn()
    render(
      <CartItemQuantitySwitcher
        item={createItem(1)}
        itemName='Shirt'
        onRemoveClick={handleRemoveClick}
      />
    )

    await user.click(
      screen.getByRole('button', { name: 'cart.item.removeNamed' })
    )
    expect(handleRemoveClick).toHaveBeenCalledTimes(1)
  })
})
