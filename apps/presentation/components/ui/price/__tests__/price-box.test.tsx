import { render, screen } from '@testing-library/react'
import { PriceBox } from '../price-box'
import type { DetailedPriceResponse } from '@core/contracts/core/detailed-price'

// Define proper types for the mock components
interface MockDecoratedPriceProps {
  price: number
  variant?: 'regular' | 'discount' | 'disabled'
  size?: 'small' | 'medium' | 'large'
}

interface MockFormattedPriceProps extends Omit<
  DetailedPriceResponse,
  'regularPriceInCents'
> {
  className?: string
}

// Mock the child components to focus on PriceBox logic
jest.mock('../decorated-price', () => ({
  DecoratedPrice: ({ price, variant, size }: MockDecoratedPriceProps) => (
    <div
      data-testid='decorated-price'
      data-price={price}
      data-variant={variant}
      data-size={size}
    >
      DecoratedPrice
    </div>
  ),
}))

jest.mock('../formatted-price', () => ({
  FormattedPrice: (props: MockFormattedPriceProps) => (
    <div
      data-testid='formatted-price'
      data-props={JSON.stringify(props)}
    >
      FormattedPrice
    </div>
  ),
}))

describe('PriceBox', () => {
  const mockPrice: DetailedPriceResponse = {
    regularPriceInCents: 1000,
    currency: 'EUR',
    regularUnitPriceInCents: 500,
  }

  it('renders with regular variant when no discount', () => {
    render(
      <PriceBox
        price={mockPrice}
        locale='de'
      />
    )

    const decoratedPrice = screen.getByTestId('decorated-price')
    expect(decoratedPrice).toHaveAttribute('data-variant', 'regular')
  })

  it('renders with discount variant when discounted price exists', () => {
    const discountedPrice: DetailedPriceResponse = {
      ...mockPrice,
      discountedPriceInCents: 800,
    }

    render(
      <PriceBox
        price={discountedPrice}
        locale='de'
      />
    )

    const decoratedPrice = screen.getByTestId('decorated-price')
    expect(decoratedPrice).toHaveAttribute('data-variant', 'discount')
  })

  it('renders with disabled variant when disabled prop is true', () => {
    render(
      <PriceBox
        price={mockPrice}
        disabled={true}
        locale='de'
      />
    )

    const decoratedPrice = screen.getByTestId('decorated-price')
    expect(decoratedPrice).toHaveAttribute('data-variant', 'disabled')
  })

  it('uses discounted price when available', () => {
    const discountedPrice: DetailedPriceResponse = {
      ...mockPrice,
      discountedPriceInCents: 800,
    }

    render(
      <PriceBox
        price={discountedPrice}
        locale='de'
      />
    )

    const decoratedPrice = screen.getByTestId('decorated-price')
    expect(decoratedPrice).toHaveAttribute('data-price', '800')
  })

  it('uses regular price when no discount', () => {
    render(
      <PriceBox
        price={mockPrice}
        locale='de'
      />
    )

    const decoratedPrice = screen.getByTestId('decorated-price')
    expect(decoratedPrice).toHaveAttribute('data-price', '1000')
  })

  it('renders header when provided', () => {
    render(
      <PriceBox
        price={mockPrice}
        header='Special Price'
        locale='de'
      />
    )

    expect(screen.getByText('Special Price')).toBeInTheDocument()
  })

  it('renders footer when provided', () => {
    render(
      <PriceBox
        price={mockPrice}
        footer='per unit'
        locale='de'
      />
    )

    expect(screen.getByText('per unit')).toBeInTheDocument()
  })

  it('renders FormattedPrice when regularUnitPrice exists', () => {
    render(
      <PriceBox
        price={mockPrice}
        locale='de'
      />
    )

    expect(screen.getByTestId('formatted-price')).toBeInTheDocument()
  })

  it('does not render FormattedPrice when regularUnitPrice is missing', () => {
    const priceWithoutUnit: DetailedPriceResponse = {
      regularPriceInCents: 1000,
      currency: 'EUR',
    }

    render(
      <PriceBox
        price={priceWithoutUnit}
        locale='de'
      />
    )

    expect(screen.queryByTestId('formatted-price')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <PriceBox
        price={mockPrice}
        className='custom-class'
        locale='de'
      />
    )

    const container = screen.getByTestId('decorated-price').parentElement
    expect(container).toHaveClass('custom-class')
  })
})
