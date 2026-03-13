import type { Meta, StoryObj } from '@storybook/react'
import { TeaserHeadlineBlock } from '@/features/content/teasers/teaser-headline-block'
import { HEADLINE } from './teaser-mock-data'

const meta: Meta<typeof TeaserHeadlineBlock> = {
  title: 'Teasers/Headline',
  component: TeaserHeadlineBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: HEADLINE },
}
