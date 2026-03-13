import type { Meta, StoryObj } from '@storybook/react'
import { GalleryImage } from '@/components/ui/gallery-image'

const meta: Meta<typeof GalleryImage> = {
  title: 'UI/GalleryImage',
  component: GalleryImage,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    src: '/product-image.png',
    alt: 'Product image',
  },
  render: (args) => (
    <div style={{ width: 320, height: 320 }}>
      <GalleryImage {...args} />
    </div>
  ),
}
