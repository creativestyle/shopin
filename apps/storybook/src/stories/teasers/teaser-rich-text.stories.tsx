import type { Meta, StoryObj } from '@storybook/react'
import { TeaserRichTextBlock } from '@/features/content/teasers/teaser-rich-text-block'
import { RICH_TEXT } from './teaser-mock-data'

const meta: Meta<typeof TeaserRichTextBlock> = {
  title: 'Teasers/Rich text',
  component: TeaserRichTextBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: RICH_TEXT },
}
