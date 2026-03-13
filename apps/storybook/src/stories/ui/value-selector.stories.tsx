import type { Meta, StoryObj } from '@storybook/react'
import { ValueSelector } from '@/components/ui/configurable-options/selectors/value-selector'

const meta: Meta<typeof ValueSelector> = {
  title: 'Selectors/Value',
  component: ValueSelector,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    options: [
      { label: 'S' },
      { label: 'M' },
      { label: 'L' },
      { label: 'XL' },
      { label: 'XXL', disabled: true },
      { label: '3XL' },
      { label: '4XL' },
      { label: '5XL' },
      { label: '6XL' },
    ],
    value: 'M',
    maxVisible: 6,
  },
}
