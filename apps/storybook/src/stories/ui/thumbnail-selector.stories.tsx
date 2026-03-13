import type { Meta, StoryObj } from '@storybook/react'
import { ThumbnailSelector } from '@/components/ui/configurable-options/selectors/thumbnail-selector'

const meta: Meta<typeof ThumbnailSelector> = {
  title: 'Selectors/Thumbnail',
  component: ThumbnailSelector,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    options: [
      { label: 'Variant 1', imageSrc: './product-image.png' },
      { label: 'Variant 2', imageSrc: './product-image.png' },
      {
        label: 'Variant 3',
        imageSrc: './product-image.png',
        disabled: true,
      },
    ],
    value: 'Variant 2',
  },
}
