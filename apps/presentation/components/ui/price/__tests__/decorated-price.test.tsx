import { render, screen } from '@testing-library/react'
import { DecoratedPrice } from '../decorated-price'

describe('DecoratedPrice', () => {
  it('formats price correctly', () => {
    render(
      <DecoratedPrice
        price={1250}
        locale='de'
      />
    )

    expect(screen.getByText(/12,50 €/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <DecoratedPrice
        price={1250}
        className='custom-class'
        locale='de'
      />
    )

    const element = screen.getByText(/12,50 €/)
    expect(element.parentElement).toHaveClass('custom-class')
  })

  it('has correct aria-label', () => {
    render(
      <DecoratedPrice
        price={1250}
        locale='de'
      />
    )

    const element = screen.getByText(/12,50 €/)
    expect(element.parentElement?.getAttribute('aria-label')).toMatch(/12,50/)
  })
})
