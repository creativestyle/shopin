import type { Meta, StoryObj } from '@storybook/react'
import { TeaserVideoBlock } from '@/features/content/teasers/teaser-video-block'
import { VIDEO } from './teaser-mock-data'

const meta: Meta<typeof TeaserVideoBlock> = {
  title: 'Teasers/Video',
  component: TeaserVideoBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: VIDEO },
}
