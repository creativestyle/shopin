/**
 * Mock product list for Storybook. Delivered to product carousel (and any other consumer of getProductCollectionPage).
 */
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'

const img = (label: string) =>
  `https://placehold.co/400x400/cbd5e1/475569?text=${encodeURIComponent(label)}`

export const MOCK_PRODUCT_LIST: ProductCardResponse[] = [
  {
    id: 'mock-1',
    name: 'Classic White T-Shirt',
    slug: 'classic-white-tshirt',
    image: { src: img('T-Shirt'), alt: 'Classic White T-Shirt' },
    price: { regularPriceInCents: 2999, currency: 'EUR', fractionDigits: 2 },
  },
  {
    id: 'mock-2',
    name: 'Summer Dress',
    slug: 'summer-dress',
    image: { src: img('Dress'), alt: 'Summer Dress' },
    price: { regularPriceInCents: 5999, currency: 'EUR', fractionDigits: 2 },
  },
  {
    id: 'mock-3',
    name: 'Leather Sneakers',
    slug: 'leather-sneakers',
    image: { src: img('Sneakers'), alt: 'Leather Sneakers' },
    price: { regularPriceInCents: 7999, currency: 'EUR', fractionDigits: 2 },
  },
  {
    id: 'mock-4',
    name: 'Canvas Backpack',
    slug: 'canvas-backpack',
    image: { src: img('Backpack'), alt: 'Canvas Backpack' },
    price: { regularPriceInCents: 4999, currency: 'EUR', fractionDigits: 2 },
  },
  {
    id: 'mock-5',
    name: 'Wool Beanie',
    slug: 'wool-beanie',
    image: { src: img('Beanie'), alt: 'Wool Beanie' },
    price: { regularPriceInCents: 2499, currency: 'EUR', fractionDigits: 2 },
  },
  {
    id: 'mock-6',
    name: 'Denim Jacket',
    slug: 'denim-jacket',
    image: { src: img('Jacket'), alt: 'Denim Jacket' },
    price: { regularPriceInCents: 12999, currency: 'EUR', fractionDigits: 2 },
  },
]
