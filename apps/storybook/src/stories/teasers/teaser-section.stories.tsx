import type { Meta, StoryObj } from '@storybook/react'
import { TeaserSectionBlock } from '@/features/content/teasers/teaser-section-block'
import { SECTION } from './teaser-mock-data'

const meta: Meta<typeof TeaserSectionBlock> = {
  title: 'Teasers/Section',
  component: TeaserSectionBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: SECTION },
}
