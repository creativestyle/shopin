import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '@/components/ui/badge/badge'

const meta = {
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
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'green',
    size: 'medium',
    children: 'Top rated',
  },
}

export const Small: Story = {
  args: {
    variant: 'red',
    size: 'small',
    children: '+99',
  },
}

export const Variants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className='flex flex-wrap items-center gap-3'>
      <Badge variant='green'>In stock</Badge>
      <Badge variant='blue'>Free delivery</Badge>
      <Badge variant='orange'>Low stock</Badge>
      <Badge variant='red'>Final sale</Badge>
      <Badge variant='gray'>Pre-order</Badge>
      <Badge variant='yellow'>New</Badge>
    </div>
  ),
}
