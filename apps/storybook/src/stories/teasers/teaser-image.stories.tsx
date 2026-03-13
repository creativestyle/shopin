import type { Meta, StoryObj } from '@storybook/react'
import { TeaserImageBlock } from '@/features/content/teasers/teaser-image-block'
import { IMAGE } from './teaser-mock-data'

const meta: Meta<typeof TeaserImageBlock> = {
  title: 'Teasers/Image',
  component: TeaserImageBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: IMAGE },
}
