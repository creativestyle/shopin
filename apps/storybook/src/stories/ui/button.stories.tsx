import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import { Button } from '@/components/ui/button'
import CartIcon from '@/public/icons/cart.svg'
import Link from 'next/link'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'icon-sm', 'icon', 'icon-lg', 'none'],
    },
    scheme: {
      control: { type: 'select' },
      options: ['red', 'white', 'black'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    children: {
      control: 'text',
    },
  },
  args: {
    children: 'Add to cart',
    variant: 'primary',
    size: 'default',
    scheme: 'red',
    disabled: false,
    onClick: action('click'),
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Add to cart',
    variant: 'primary',
    scheme: 'red',
  },
}

export const WithIcon: Story = {
  args: {
    children: 'Add to cart',
    variant: 'primary',
    scheme: 'red',
  },
  render: (args) => (
    <Button {...args}>
      <CartIcon className='size-6' />
      {args.children}
    </Button>
  ),
}

export const WithRightIcon: Story = {
  args: {
    children: 'Checkout',
    variant: 'primary',
    scheme: 'red',
  },
  render: (args) => (
    <Button {...args}>
      {args.children}
      <CartIcon className='size-6' />
    </Button>
  ),
}

export const AsInternalLink: Story = {
  args: {
    variant: 'secondary',
    scheme: 'black',
    asChild: true,
    children: 'View product',
  },
  render: (args) => (
    <Button {...args}>
      <Link href='/products/lightweight-rain-jacket'>{args.children}</Link>
    </Button>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className='flex items-center gap-4'>
      <Button
        {...args}
        size='sm'
      >
        Small
      </Button>
      <Button
        {...args}
        size='default'
      >
        Default
      </Button>
      <Button
        {...args}
        size='lg'
      >
        Large
      </Button>
    </div>
  ),
}

export const IconOnly: Story = {
  render: (args) => (
    <div className='flex items-center gap-4'>
      <Button
        {...args}
        size='icon-sm'
        aria-label='Add to cart'
      >
        <CartIcon className='size-4' />
      </Button>
      <Button
        {...args}
        size='icon'
        aria-label='Add to cart'
      >
        <CartIcon className='size-6' />
      </Button>
      <Button
        {...args}
        size='icon-lg'
        aria-label='Add to cart'
      >
        <CartIcon className='size-7' />
      </Button>
    </div>
  ),
}

export const AsExternalLink: Story = {
  args: {
    variant: 'tertiary',
    scheme: 'black',
    asChild: true,
    children: 'Track shipment',
  },
  render: (args) => (
    <Button {...args}>
      <a
        href='https://shopin.dev/track'
        target='_blank'
        rel='noopener noreferrer'
      >
        {args.children}
      </a>
    </Button>
  ),
}
