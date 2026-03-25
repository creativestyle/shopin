import type { Meta, StoryObj } from '@storybook/react'
import { TeaserBrandBlock } from '@/features/content/teasers/teaser-brand-block'
import { BRAND } from './teaser-mock-data'

const meta: Meta<typeof TeaserBrandBlock> = {
  title: 'Teasers/Brand',
  component: TeaserBrandBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: BRAND },
}
