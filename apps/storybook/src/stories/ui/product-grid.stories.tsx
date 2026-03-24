import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import { ProductGrid } from '@/components/ui/product-grid'
import { ProductGridStoryCardActions } from '../../mocks/product-grid-story-card-actions'

const logAddToBasket = action('cardActions.addToBasket')

// Mock product data for Storybook
const mockProducts = [
  {
    id: 'product-1',
    slug: 'product-1',
    name: 'Classic White T-Shirt',
    price: { regularPriceInCents: 2999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'White T-Shirt',
    },
  },
  {
    id: 'product-2',
    slug: 'product-2',
    name: 'Denim Jeans',
    price: { regularPriceInCents: 8999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'Denim Jeans',
    },
  },
  {
    id: 'product-3',
    slug: 'product-3',
    name: 'Leather Jacket',
    price: { regularPriceInCents: 19999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'Leather Jacket',
    },
  },
  {
    id: 'product-4',
    slug: 'product-4',
    name: 'Summer Dress',
    price: { regularPriceInCents: 5999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'Summer Dress',
    },
  },
  {
    id: 'product-5',
    slug: 'product-5',
    name: 'Sneakers',
    price: { regularPriceInCents: 7999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'Sneakers',
    },
  },
  {
    id: 'product-6',
    slug: 'product-6',
    name: 'Winter Coat',
    price: { regularPriceInCents: 14999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'Winter Coat',
    },
  },
]

const meta: Meta<typeof ProductGrid> = {
  title: 'UI/ProductGrid',
  component: ProductGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    products: mockProducts,
    locale: 'en-US',
  },
  render: (args) => (
    <ProductGrid
      {...args}
      renderCardActions={(product) => (
        <ProductGridStoryCardActions
          className='z-2 w-full'
          onAction={() => logAddToBasket(product)}
        />
      )}
    />
  ),
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    products: mockProducts,
  },
}

export const FewProducts: Story = {
  args: {
    products: mockProducts.slice(0, 2),
  },
}

export const ManyProducts: Story = {
  args: {
    products: [...mockProducts, ...mockProducts], // 12 products
  },
}
