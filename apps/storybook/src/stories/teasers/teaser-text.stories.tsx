import type { Meta, StoryObj } from '@storybook/react'
import { TeaserTextBlock } from '@/features/content/teasers/teaser-text-block'
import { TEXT } from './teaser-mock-data'

const meta: Meta<typeof TeaserTextBlock> = {
  title: 'Teasers/Text',
  component: TeaserTextBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: TEXT },
}
