import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '@/components/ui/badge/badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['green', 'orange', 'gray', 'yellow', 'blue', 'red'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium'],
    },
    children: {
      control: { type: 'text' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const ActionBadge: Story = {
  args: {
    variant: 'green',
    size: 'medium',
    children: 'Top Bewertung',
  },
}

export const CounterBadge: Story = {
  args: {
    variant: 'yellow',
    size: 'small',
    children: '+99',
  },
}
