import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Checkbox> = {
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
    className: { control: 'text' },
    onCheckedChange: { control: false },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className='flex items-center gap-2'>
      <Checkbox
        id='cb1'
        onCheckedChange={(checked: boolean) => {
          action(`State changed: ${checked}`)(checked)
        }}
        {...args}
      />
      <Label htmlFor='cb1'>Label</Label>
    </div>
  ),
}

export const SelectedDisabled: Story = {
  args: { checked: true, disabled: true },
  render: (args) => (
    <div className='flex items-center gap-2'>
      <Checkbox
        id='cb3'
        onCheckedChange={(checked: boolean) => {
          action(`State changed: ${checked}`)(checked)
        }}
        {...args}
      />
      <Label htmlFor='cb3'>Label</Label>
    </div>
  ),
}

export const NotSelectedDisabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className='flex items-center gap-2'>
      <Checkbox
        id='cb3'
        onCheckedChange={(checked: boolean) => {
          action(`State changed: ${checked}`)(checked)
        }}
        {...args}
      />
      <Label htmlFor='cb3'>Label</Label>
    </div>
  ),
}

export const WithLongLabel: Story = {
  render: (args) => (
    <div className='flex w-[500px] items-center gap-2'>
      <Checkbox
        id='cb5'
        onCheckedChange={(checked: boolean) => {
          action(`State changed: ${checked}`)(checked)
        }}
        {...args}
      />
      <Label htmlFor='cb5'>
        Ich habe die Allgemeinen Geschäftsbedingungen, den Datenschutzhinweis
        sowie die Widerrufsbelehrung gelesen und stimme diesen ausdrücklich zu.
      </Label>
    </div>
  ),
}

export const InvalidState: Story = {
  args: { invalid: true },
  render: (args) => (
    <div className='flex items-center gap-2'>
      <Checkbox
        id='cb-invalid'
        onCheckedChange={(checked: boolean) => {
          action(`State changed: ${checked}`)(checked)
        }}
        {...args}
      />
      <Label htmlFor='cb-invalid'>This field is required</Label>
    </div>
  ),
}
