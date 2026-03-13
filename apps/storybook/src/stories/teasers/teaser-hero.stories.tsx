import type { Meta, StoryObj } from '@storybook/react'
import { TeaserHeroBlock } from '@/features/content/teasers/teaser-hero-block'
import { HERO } from './teaser-mock-data'

const meta: Meta<typeof TeaserHeroBlock> = {
  title: 'Teasers/Hero',
  component: TeaserHeroBlock,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: HERO },
}
