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
type UnlabeledSwitchStateItem = React.ComponentProps<typeof Switch> & {
  id: string
  ariaLabel: string
}
type LabeledSwitchStateItem = React.ComponentProps<typeof Switch> & {
  id: string
  label: string
}

export const Showcase: Story = {
  args: {
    scheme: 'primary',
  },
  render: ({ scheme = 'primary' }: React.ComponentProps<typeof Switch>) => {
    const createOnCheckedChange = (name: string) => (checked: boolean) => {
      action(`${name}: ${checked}`)(checked)
    }

    const items = [
      {
        id: 'switch-state-off',
        ariaLabel: 'Off',
      },
      {
        id: 'switch-state-on',
        ariaLabel: 'On',
        defaultChecked: true,
      },
      {
        id: 'switch-state-disabled-off',
        ariaLabel: 'Disabled off',
        disabled: true,
      },
      {
        id: 'switch-state-disabled-on',
        ariaLabel: 'Disabled on',
        defaultChecked: true,
        disabled: true,
      },
    ] satisfies Array<UnlabeledSwitchStateItem>

    const labeledItems = [
      {
        id: 'switch-state-labeled-working',
        label: 'Order updates',
      },
      {
        id: 'switch-state-labeled-disabled',
        label: 'SMS alerts',
        defaultChecked: true,
        disabled: true,
      },
    ] satisfies Array<LabeledSwitchStateItem>

    return (
      <div className='grid min-w-80 gap-3'>
        <div className='space-y-3 rounded-md border border-gray-200 bg-white px-4 py-3'>
          <p className='text-sm font-medium text-gray-900'>Without labels</p>
          <div className='flex flex-wrap items-center gap-8'>
            {items.map(({ id, ariaLabel, disabled, ...switchProps }) => (
              <Switch
                key={id}
                id={id}
                aria-label={ariaLabel}
                scheme={scheme}
                disabled={disabled}
                onCheckedChange={
                  disabled ? undefined : createOnCheckedChange(ariaLabel)
                }
                {...switchProps}
              />
            ))}
          </div>
        </div>

        <div className='space-y-3 rounded-md border border-gray-200 bg-white px-4 py-3'>
          <p className='text-sm font-medium text-gray-900'>With labels</p>
          {labeledItems.map(({ id, label, disabled, ...switchProps }) => (
            <div
              key={id}
              className='flex items-center gap-3'
            >
              <Switch
                id={id}
                scheme={scheme}
                disabled={disabled}
                onCheckedChange={
                  disabled ? undefined : createOnCheckedChange(label)
                }
                {...switchProps}
              />
              <Label htmlFor={id}>{label}</Label>
            </div>
          ))}
        </div>
      </div>
    )
  },
}
