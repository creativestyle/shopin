import type { Meta, StoryObj } from '@storybook/react'
import { ColorPreview } from '../../components/color-preview'

const meta: Meta<typeof ColorPreview> = {
  title: 'Design Tokens/Shopin Color System',
  component: ColorPreview,
  tags: ['autodocs', 'design-tokens', 'colors', 'shopin'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Complete Shopin color system preview showing all design tokens mapped to shadcn/ui conventions. This includes brand colors, semantic colors, gray scale, and usage examples.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
