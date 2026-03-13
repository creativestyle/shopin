import type { Meta, StoryObj } from '@storybook/react'
import { SearchBar } from '@/components/ui/search-bar'

const meta: Meta<typeof SearchBar> = {
  title: 'UI/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
  },
  args: {
    placeholder: 'Search...',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Search...',
  },
}
