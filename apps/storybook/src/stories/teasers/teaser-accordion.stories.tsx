import type { Meta, StoryObj } from '@storybook/react'
import { TeaserAccordionBlock } from '@/features/content/teasers/teaser-accordion-block'
import { ACCORDION } from './teaser-mock-data'

const meta: Meta<typeof TeaserAccordionBlock> = {
  title: 'Teasers/Accordion',
  component: TeaserAccordionBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { teaser: ACCORDION },
}
