import type { Meta, StoryObj } from '@storybook/react'
import { TeaserRegularBlock } from '@/features/content/teasers/teaser-regular-block'
import { REGULAR } from './teaser-mock-data'

const meta: Meta<typeof TeaserRegularBlock> = {
  title: 'Teasers/Regular',
  component: TeaserRegularBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: REGULAR },
}
