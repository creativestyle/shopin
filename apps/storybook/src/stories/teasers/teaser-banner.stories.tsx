import type { Meta, StoryObj } from '@storybook/react'
import { TeaserBannerBlock } from '@/features/content/teasers/teaser-banner-block'
import { BANNER } from './teaser-mock-data'

const meta: Meta<typeof TeaserBannerBlock> = {
  title: 'Teasers/Banner',
  component: TeaserBannerBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: BANNER },
}
