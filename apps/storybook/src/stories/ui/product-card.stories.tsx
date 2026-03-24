import type { Meta, StoryObj } from '@storybook/react'
import { ProductCard } from '@/components/ui/product-card'

const meta: Meta<typeof ProductCard> = {
  title: 'UI/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className='mx-auto box-border w-[min(100%,320px)] min-w-[260px] shrink-0'>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Product data to display in the card',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Basic product without variants/colors
export const Basic: Story = {
  args: {
    data: {
      id: '1',
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-tshirt',
      price: {
        regularPriceInCents: 2999,
        currency: 'EUR',
        fractionDigits: 2,
      },
      image: {
        src: './product-image.png',
        alt: 'Premium Cotton T-Shirt',
      },
    },
    locale: 'en-US',
  },
}

// Product with variants/colors
export const WithVariants: Story = {
  args: {
    data: {
      id: '2',
      name: 'Designer Jeans Collection',
      slug: 'designer-jeans-collection',
      price: {
        regularPriceInCents: 8999,
        currency: 'EUR',
        fractionDigits: 2,
      },
      image: {
        src: './product-image.png',
        alt: 'Designer Jeans Collection',
      },
    },
    locale: 'en-US',
  },
}
