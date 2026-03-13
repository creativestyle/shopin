import type { Meta, StoryObj } from '@storybook/react'
import { ColorSelector } from '@/components/ui/configurable-options/selectors/color-selector'

const meta: Meta<typeof ColorSelector> = {
  title: 'Selectors/Color',
  component: ColorSelector,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    options: [
      { label: 'Black', swatch: '#000000' },
      { label: 'Gray', swatch: '#9CA3AF' },
      { label: 'Blue', swatch: '#3B82F6' },
      { label: 'Green', swatch: '#10B981', disabled: true },
    ],
    value: 'Gray',
  },
}
