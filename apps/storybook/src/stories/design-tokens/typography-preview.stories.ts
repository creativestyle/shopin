import type { Meta, StoryObj } from '@storybook/react'
import { TypographyPreview } from '../../components/typography-preview'

const meta: Meta<typeof TypographyPreview> = {
  title: 'Design Tokens/Typography',
  component: TypographyPreview,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Complete typography system preview showing all font styles, sizes, and weights from the design system.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
