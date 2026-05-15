import type { Meta, StoryObj } from '@storybook/react'
import { ProductGallery } from '@/components/ui/product-gallery'

const meta: Meta<typeof ProductGallery> = {
  title: 'UI/ProductGallery',
  component: ProductGallery,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    images: [
      { src: './product-image.png', alt: 'Product image 1' },
      { src: './product-image.png', alt: 'Product image 2' },
      { src: './product-image.png', alt: 'Product image 3' },
      { src: './product-image.png', alt: 'Product image 4' },
      { src: './product-image.png', alt: 'Product image 5' },
      { src: './product-image.png', alt: 'Product image 6' },
      { src: './product-image.png', alt: 'Product image 7' },
      { src: './product-image.png', alt: 'Product image 8' },
      { src: './product-image.png', alt: 'Product image 9' },
      { src: './product-image.png', alt: 'Product image 10' },
    ],
    initialVisible: 6,
  },
}
