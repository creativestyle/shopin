import type { Meta, StoryObj } from '@storybook/react'
import logoUrl from '@/public/logo.svg?url'
import { Logo } from '@/components/ui/logo'

const meta: Meta<typeof Logo> = {
  title: 'UI/Logo',
  component: Logo,
  tags: ['autodocs'],
  argTypes: {
    alt: { control: 'text' },
  },
  args: {
    src: logoUrl,
    alt: 'SHOPIN Logo',
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    src: logoUrl,
    alt: 'SHOPIN Logo',
  },
  render: (args) => (
    <div style={{ width: '200px', height: '80px' }}>
      <Logo {...args} />
    </div>
  ),
}
