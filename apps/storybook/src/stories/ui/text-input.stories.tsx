import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import { TextInput } from '@/components/ui/inputs/text-input'
import { DateInput } from '@/components/ui/inputs/date-input'
import { PasswordInput } from '@/components/ui/inputs/password-input'

const onInputChange = (value: string) => action('change')(value)

function renderTextInput(args: ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...args}
      onChange={(e) => onInputChange(e.currentTarget.value)}
    />
  )
}

function renderDateInput(args: ComponentProps<typeof DateInput>) {
  return (
    <div className='w-[360px]'>
      <DateInput
        {...args}
        onChange={(e) => onInputChange(e.currentTarget.value)}
      />
    </div>
  )
}

function renderPasswordInput(args: ComponentProps<typeof PasswordInput>) {
  return (
    <div className='w-[320px]'>
      <PasswordInput
        {...args}
        onChange={(e) => onInputChange(e.currentTarget.value)}
      />
    </div>
  )
}

const meta = {
  title: 'UI/TextInput',
  component: TextInput,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className='mx-auto w-full max-w-md'>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    validationState: { control: 'radio', options: ['none', 'valid', 'error'] },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    onChange: { control: false },
  },
} satisfies Meta<typeof TextInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'last-name',
    label: 'Last name',
  },
  render: renderTextInput,
}

export const DefaultWithPlaceholder: Story = {
  name: 'With placeholder',
  args: {
    id: 'company-name',
    label: 'Company name',
    placeholder: 'Enter company name',
  },
  render: renderTextInput,
}

export const Filled: Story = {
  args: {
    id: 'city',
    label: 'City',
    defaultValue: 'Vienna',
  },
  render: renderTextInput,
}

export const FilledPositiveValidation: Story = {
  name: 'Valid state',
  args: {
    id: 'email',
    label: 'Email',
    validationState: 'valid',
    defaultValue: 'alex@example.com',
  },
  render: renderTextInput,
}

export const FilledError: Story = {
  name: 'Error state',
  args: {
    id: 'error',
    label: 'Postal code',
    validationState: 'error',
    defaultValue: '12',
  },
  render: renderTextInput,
}

export const DisabledEmpty: Story = {
  name: 'Disabled empty',
  args: {
    id: 'account-id',
    label: 'Account ID',
    disabled: true,
  },
  render: renderTextInput,
}

export const DisabledFilled: Story = {
  name: 'Disabled filled',
  args: {
    id: 'customer-number',
    label: 'Customer number',
    disabled: true,
    defaultValue: 'CUST-20491',
  },
  render: renderTextInput,
}

export const Password: Story = {
  args: {
    id: 'current-password',
    label: 'Current password',
  },
  render: () =>
    renderPasswordInput({
      id: 'current-password',
      label: 'Current password',
    }),
}

export const DateDefault: Story = {
  name: 'Date input',
  args: {
    id: 'delivery-date',
    label: 'Preferred delivery date',
  },
  render: () =>
    renderDateInput({
      id: 'delivery-date',
      label: 'Preferred delivery date',
    }),
}

export const DateFilled: Story = {
  name: 'Date input filled',
  args: {
    id: 'delivery-date-filled',
    label: 'Preferred delivery date',
  },
  render: () =>
    renderDateInput({
      id: 'delivery-date-filled',
      label: 'Preferred delivery date',
      defaultValue: '25-03-2026',
    }),
}
