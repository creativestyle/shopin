import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    disabled: { control: 'boolean' },
    checked: { control: false },
    defaultChecked: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
    onCheckedChange: { control: false },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

function CheckboxRow({
  id,
  label,
  ...checkboxProps
}: ComponentProps<typeof Checkbox> & {
  id: string
  label: ReactNode
}) {
  return (
    <div className='flex max-w-xl items-start gap-2'>
      <Checkbox
        id={id}
        onCheckedChange={(checked) => action('checked')(checked)}
        {...checkboxProps}
      />
      <Label
        htmlFor={id}
        className='!block min-w-0 flex-1 font-normal'
      >
        {label}
      </Label>
    </div>
  )
}

export const Default: Story = {
  render: (args) => (
    <CheckboxRow
      id='checkbox-default'
      label='Email me order updates and delivery notifications'
      {...args}
    />
  ),
}

export const DisabledChecked: Story = {
  args: { checked: true, disabled: true },
  render: (args) => (
    <CheckboxRow
      id='checkbox-disabled-checked'
      label='This preference is managed by your account settings'
      {...args}
    />
  ),
}

export const DisabledUnchecked: Story = {
  args: { disabled: true },
  render: (args) => (
    <CheckboxRow
      id='checkbox-disabled-unchecked'
      label='SMS alerts (not available in your region)'
      {...args}
    />
  ),
}

const linkClassName =
  'font-medium text-gray-950 underline underline-offset-2 hover:text-gray-700'

function stopLabelToggle(e: MouseEvent) {
  e.stopPropagation()
}

export const LongLabel: Story = {
  render: (args) => (
    <CheckboxRow
      id='checkbox-long'
      label={
        <span className='block'>
          I have read and agree to the{' '}
          <Link
            href='/legal/terms'
            className={linkClassName}
            onClick={stopLabelToggle}
          >
            Terms of Sale
          </Link>
          , the{' '}
          <Link
            href='/legal/privacy'
            className={linkClassName}
            onClick={stopLabelToggle}
          >
            Privacy Policy
          </Link>
          , and the{' '}
          <Link
            href='/legal/returns'
            className={linkClassName}
            onClick={stopLabelToggle}
          >
            Returns & Refunds
          </Link>{' '}
          information.
        </span>
      }
      {...args}
    />
  ),
}

export const Invalid: Story = {
  args: { invalid: true },
  render: (args) => (
    <CheckboxRow
      id='checkbox-invalid'
      label='I accept the terms to place this order'
      {...args}
    />
  ),
}
