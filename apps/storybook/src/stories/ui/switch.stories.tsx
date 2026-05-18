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
            Email notifications
          </Label>
        </div>
      </>
    )
  },
}

export const States: Story = {
  render: () => {
    const items = [
      {
        id: 'switch-state-off',
        label: 'Off',
        description: 'Unchecked and interactive.',
      },
      {
        id: 'switch-state-on',
        label: 'On',
        description: 'Checked and interactive.',
        defaultChecked: true,
      },
      {
        id: 'switch-state-disabled-off',
        label: 'Disabled off',
        description: 'Disabled switches do not accept focus or input.',
        disabled: true,
      },
      {
        id: 'switch-state-disabled-on',
        label: 'Disabled on',
        description: 'Disabled state remains visible when checked.',
        defaultChecked: true,
        disabled: true,
      },
    ] satisfies Array<
      React.ComponentProps<typeof Switch> & {
        id: string
        label: string
        description: string
      }
    >

    return (
      <div className='grid min-w-80 gap-3'>
        {items.map(({ id, label, description, ...switchProps }) => (
          <div
            key={id}
            className='flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-white px-4 py-3'
          >
            <div className='space-y-1'>
              <Label htmlFor={id}>{label}</Label>
              <p className='text-sm text-gray-600'>{description}</p>
            </div>
            <Switch
              id={id}
              aria-label={label}
              scheme='primary'
              {...switchProps}
            />
          </div>
        ))}
      </div>
    )
  },
}
