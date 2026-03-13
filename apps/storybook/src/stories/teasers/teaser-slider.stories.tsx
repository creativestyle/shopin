import type { Meta, StoryObj } from '@storybook/react'
import { TeaserSliderBlock } from '@/features/content/teasers/teaser-slider-block'
import { SLIDER } from './teaser-mock-data'

const meta: Meta<typeof TeaserSliderBlock> = {
  title: 'Teasers/Slider',
  component: TeaserSliderBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: SLIDER },
}
