import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { useArgs } from 'storybook/preview-api'
import { ValueSelector } from '@/components/ui/configurable-options/selectors/value-selector'

const meta: Meta<typeof ValueSelector> = {
  title: 'Selectors/Value',
  component: ValueSelector,
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: false },
  },
}

export default meta

type Story = StoryObj<typeof meta>

const options = [
  { label: 'S' },
  { label: 'M' },
  { label: 'L' },
  { label: 'XL' },
  { label: 'XXL', disabled: true },
  { label: '3XL' },
  { label: '4XL' },
  { label: '5XL' },
  { label: '6XL' },
]

const DefaultStory = (args: React.ComponentProps<typeof ValueSelector>) => {
  const [{ value }, updateArgs] = useArgs()
  return (
    <ValueSelector
      {...args}
      value={value}
      onChange={(newValue) => updateArgs({ value: newValue })}
    />
  )
}

export const Default: Story = {
  render: (args) => <DefaultStory {...args} />,
  args: {
    options,
    value: 'M',
    maxVisible: 6,
  },
}
