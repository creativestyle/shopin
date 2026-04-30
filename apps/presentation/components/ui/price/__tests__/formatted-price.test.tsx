import { render, screen } from '@testing-library/react'
import { FormattedPrice } from '../formatted-price'

describe('FormattedPrice', () => {
  it('formats price correctly with default currency', () => {
    render(
      <FormattedPrice
        regularUnitPrice={1250}
        currency='EUR'
        locale='de'
      />
    )

    expect(screen.getByText(/12,50 €/)).toBeInTheDocument()
  })

  it('formats price with custom currency', () => {
    render(
      <FormattedPrice
        regularUnitPrice={1250}
        currency='USD'
        locale='de'
      />
    )

    expect(screen.getByText(/12,50 \$/)).toBeInTheDocument()
  })

  it('formats price with custom fraction digits', () => {
    render(
      <FormattedPrice
        regularUnitPrice={1250}
        currency='EUR'
        fractionDigits={3}
        locale='de'
      />
    )

    expect(screen.getByText(/12,500/)).toBeInTheDocument()
  })

  it('displays unit when provided', () => {
    render(
      <FormattedPrice
        regularUnitPrice={1250}
        currency='EUR'
        unit='kg'
        locale='de'
      />
    )

    expect(screen.getByText(/12,50 € \/ kg/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <FormattedPrice
        regularUnitPrice={1250}
        currency='EUR'
        className='custom-class'
        locale='de'
      />
    )

    const element = screen.getByText(/12,50/)
    expect(element).toHaveClass('custom-class')
  })
})
