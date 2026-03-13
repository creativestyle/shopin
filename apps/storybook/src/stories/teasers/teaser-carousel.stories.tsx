import type { Meta, StoryObj } from '@storybook/react'
import { TeaserCarouselBlock } from '@/features/content/teasers/teaser-carousel-block'
import { CAROUSEL } from './teaser-mock-data'

const meta: Meta<typeof TeaserCarouselBlock> = {
  title: 'Teasers/Carousel',
  component: TeaserCarouselBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: CAROUSEL },
}
