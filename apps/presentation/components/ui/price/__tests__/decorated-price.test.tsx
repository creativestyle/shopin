import { render, screen } from '@testing-library/react'
import { DecoratedPrice } from '../decorated-price'

describe('DecoratedPrice', () => {
  it('formats price correctly', () => {
    render(
      <DecoratedPrice
        price={1250}
        currency='EUR'
        locale='de'
      />
    )

    expect(screen.getByText(/12,50 €/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <DecoratedPrice
        price={1250}
        currency='EUR'
        className='custom-class'
        locale='de'
      />
    )

    const element = screen.getByText(/12,50 €/)
    expect(element.parentElement).toHaveClass('custom-class')
  })

  it('renders the original price, the price and the VAT note in that order', () => {
    const { container } = render(
      <DecoratedPrice
        price={1250}
        originalPrice={2000}
        taxNote='inkl. MwSt.'
        currency='EUR'
        locale='de'
      />
    )

    const originalPrice = screen.getByText(/20,00 €/)
    const price = screen.getByText(/12,50 €/)
    const taxNote = screen.getByText('inkl. MwSt.')

    expect(originalPrice.compareDocumentPosition(price)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
    expect(price.compareDocumentPosition(taxNote)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
    expect(container.querySelector('[class*="order-"]')).toBeNull()
  })
})
