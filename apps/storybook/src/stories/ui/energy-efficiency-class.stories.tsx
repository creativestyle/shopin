import type { Meta, StoryObj } from '@storybook/react'
import { EnergyEfficiencyClass } from '@/components/ui/energy-efficiency-class'

const meta: Meta<typeof EnergyEfficiencyClass> = {
  title: 'UI/EnergyEfficiencyClass',
  component: EnergyEfficiencyClass,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    energyClass: {
      control: { type: 'select' },
      options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    energyClass: 'A',
  },
}
