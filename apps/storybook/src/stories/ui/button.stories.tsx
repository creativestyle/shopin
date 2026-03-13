import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import CartIcon from '@/public/icons/cart.svg'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary'],
      description: 'The visual style variant of the button',
    },
    scheme: {
      control: { type: 'select' },
      options: ['red', 'white', 'black'],
      description: 'The color scheme (brand palettes)',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Whether to render as a child component instead of a button',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    children: {
      control: 'text',
      description: 'The button content',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    children: 'Button Text',
    variant: 'primary',
    scheme: 'red',
    asChild: false,
    disabled: false,
  },
  decorators: [
    (Story, context) => {
      // Pick background color based on button scheme
      const bg = context.args.scheme === 'white' ? '#757575' : '#fff'

      return (
        <div
          style={{
            backgroundColor: bg,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Story />
        </div>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Default button stories
export const Default: Story = {
  args: {
    children: 'Jetzt entdecken',
    variant: 'primary',
    scheme: 'red',
    onClick: action('click'),
  },
}

export const Secondary: Story = {
  args: {
    children: 'Jetzt entdecken',
    variant: 'secondary',
    scheme: 'red',
    onClick: action('click'),
  },
}

export const Tertiary: Story = {
  args: {
    children: 'Jetzt entdecken',
    variant: 'tertiary',
    scheme: 'red',
    onClick: action('click'),
  },
}

// Polymorphic button as Link component
export const AsInternalLink: Story = {
  args: {
    variant: 'primary',
    scheme: 'red',
    asChild: true,
    onClick: action('click'),
  },
  render: (args) => {
    const { ...buttonProps } = args
    return (
      <Button {...buttonProps}>
        <Link href='/products'>Internal Link</Link>
      </Button>
    )
  },
}

// Polymorphic button as anchor tag
export const AsExternalLink: Story = {
  args: {
    variant: 'secondary',
    scheme: 'white',
    asChild: true,
    onClick: action('click'),
  },
  render: (args) => {
    const { ...buttonProps } = args
    return (
      <Button {...buttonProps}>
        <a
          href='https://example.com'
          target='_blank'
          rel='noopener noreferrer'
        >
          External Link
        </a>
      </Button>
    )
  },
}

// Button with icon
export const WithIcons: Story = {
  args: {
    variant: 'primary',
    scheme: 'red',
    onClick: action('click'),
    children: 'Add to Cart',
  },
  render: (args) => {
    const { children, ...buttonProps } = args

    return (
      <Button {...buttonProps}>
        <CartIcon className='size-6' />
        {children as string}
      </Button>
    )
  },
}
