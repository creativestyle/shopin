import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartActions } from '../cart-actions'

describe('CartActions', () => {
  it('closes the drawer from Continue shopping without navigating', async () => {
    const onClose = jest.fn()
    render(
      <CartActions
        variant='modal'
        onClose={onClose}
      />
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'cart.addToCartModal.continue' })
    )

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('links to the cart from the drawer and closes it', async () => {
    const onClose = jest.fn()
    render(
      <CartActions
        variant='modal'
        onClose={onClose}
      />
    )

    const link = screen.getByRole('link', {
      name: 'cart.addToCartModal.goToCart',
    })
    expect(link).toHaveAttribute('href', '/cart')
    // jsdom can't navigate
    link.addEventListener('click', (event) => event.preventDefault())
    await userEvent.click(link)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows only the checkout link outside the drawer', () => {
    render(<CartActions />)

    expect(screen.getByRole('link', { name: 'cart.checkout' })).toHaveAttribute(
      'href',
      '/checkout'
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
