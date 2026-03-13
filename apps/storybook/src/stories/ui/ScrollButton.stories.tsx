import type { Meta, StoryObj } from '@storybook/react'

import { ScrollButton } from '@/components/ui/scroll-button'

const meta = {
  title: 'UI/ScrollButton',
  component: ScrollButton,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    side: {
      control: { type: 'radio' },
      options: ['left', 'right'],
    },
    scheme: {
      control: { type: 'radio' },
      options: ['white', 'dark'],
    },
    visible: {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof ScrollButton>

export default meta
type Story = StoryObj<typeof meta>

export const LeftVisible: Story = {
  args: {
    side: 'left',
    visible: true,
    scheme: 'white',
    ariaLabel: 'Scroll left',
    onClick: () => {},
  },
}

export const RightVisible: Story = {
  args: {
    side: 'right',
    visible: true,
    scheme: 'white',
    ariaLabel: 'Scroll right',
    onClick: () => {},
  },
}
