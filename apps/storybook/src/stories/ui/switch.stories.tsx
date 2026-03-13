import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    scheme: {
      control: { type: 'select' },
      options: ['primary', 'accent', 'gray'],
    },
    asChild: {
      control: false,
    },
    defaultChecked: {
      control: { type: 'boolean' },
    },
    checked: {
      control: false,
    },
    onCheckedChange: {
      control: false,
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    scheme: 'primary',
  },
  render: (args: React.ComponentProps<typeof Switch>) => {
    return (
      <Switch
        id='airplane-mode'
        {...args}
        onCheckedChange={(checked: boolean) => {
          action(`State changed: ${checked}`)(checked)
        }}
      />
    )
  },
}

export const WithLabel: Story = {
  args: {
    scheme: 'primary',
  },
  render: (args: React.ComponentProps<typeof Switch>) => {
    return (
      <>
        <div className='flex items-center'>
          <Switch
            id='airplane-mode-2'
            {...args}
            onCheckedChange={(checked: boolean) => {
              action(`State changed: ${checked}`)(checked)
            }}
          />
          <Label
            htmlFor='airplane-mode-2'
            className='pl-2'
          >
            Airplane Mode
          </Label>
        </div>
      </>
    )
  },
}
