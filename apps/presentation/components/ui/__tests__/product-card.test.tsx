import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProductCard } from '../product-card'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type { BasicPriceResponse } from '@core/contracts/core/basic-price'

jest.mock('@/features/wishlist/product-card-wishlist-button', () => ({
  ProductCardWishlistButton: () => null,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string
    children: React.ReactNode
  }) => <a href={href}>{children}</a>,
}))

describe('ProductCard', () => {
  it('renders link to product slug and basic data', () => {
    const price: BasicPriceResponse = {
      regularPriceInCents: 1000,
      currency: 'EUR',
      fractionDigits: 2,
    }
    const data: ProductCardResponse & { slug: string; name: string } = {
      slug: 'nice-product',
      name: 'Nice Product',
      price,
      image: { src: '/img.jpg', alt: 'alt' },
      id: '1',
    }

    render(
      <ProductCard
        data={data}
        locale='de'
      />
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/p/nice-product')
    expect(screen.getByText('Nice Product')).toBeInTheDocument()
  })
})
