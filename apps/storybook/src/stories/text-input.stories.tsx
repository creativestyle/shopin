import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import { TextInput } from '@/components/ui/inputs/text-input'
import { DateInput } from '@/components/ui/inputs/date-input'
import { PasswordInput } from '@/components/ui/inputs/password-input'

const meta: Meta<typeof TextInput> = {
  title: 'UI/TextInput',
  component: TextInput,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    validationState: { control: 'radio', options: ['none', 'valid', 'error'] },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    onChange: { control: false },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'lastName',
    label: 'Nachname',
  },
  render: (args) => (
    <TextInput
      {...args}
      onChange={(e) =>
        action(`onChange: ${e.currentTarget.value}`)(e.currentTarget.value)
      }
    />
  ),
}

export const DefaultWithPlaceholder: Story = {
  args: {
    id: 'lastName',
    label: 'Nachname',
    placeholder: 'Nachname',
  },
  render: (args) => (
    <TextInput
      {...args}
      onChange={(e) =>
        action(`onChange: ${e.currentTarget.value}`)(e.currentTarget.value)
      }
    />
  ),
}

export const Filled: Story = {
  args: {
    id: 'filled',
    label: 'Nachname',
    defaultValue: 'Mus',
  },
  render: (args) => (
    <TextInput
      {...args}
      onChange={(e) =>
        action(`onChange: ${e.currentTarget.value}`)(e.currentTarget.value)
      }
    />
  ),
}

export const FilledPositiveValidation: Story = {
  args: {
    id: 'valid',
    label: 'Nachname',
    validationState: 'valid',
    defaultValue: 'Mus',
  },
  render: (args) => (
    <TextInput
      {...args}
      onChange={(e) =>
        action(`onChange: ${e.currentTarget.value}`)(e.currentTarget.value)
      }
    />
  ),
}

export const FilledError: Story = {
  args: {
    id: 'error',
    label: 'Nachname',
    validationState: 'error',
    defaultValue: 'Mus',
  },
  render: (args) => (
    <TextInput
      {...args}
      onChange={(e) =>
        action(`onChange: ${e.currentTarget.value}`)(e.currentTarget.value)
      }
    />
  ),
}

export const DisabledEmpty: Story = {
  args: {
    id: 'disabled',
    label: 'Nachname',
    disabled: true,
  },
  render: (args) => (
    <TextInput
      {...args}
      onChange={(e) =>
        action(`onChange: ${e.currentTarget.value}`)(e.currentTarget.value)
      }
    />
  ),
}

export const DisabledFilled: Story = {
  args: {
    id: 'disabled',
    label: 'Nachname',
    disabled: true,
    defaultValue: 'Mus',
  },
  render: (args) => (
    <TextInput
      {...args}
      onChange={(e) =>
        action(`onChange: ${e.currentTarget.value}`)(e.currentTarget.value)
      }
    />
  ),
}

export const Password: Story = {
  render: () => (
    <div className='w-[320px]'>
      <PasswordInput
        id='pwd'
        label='Aktuelles Passwort'
        onChange={(e) =>
          action(`onChange: ${e.currentTarget.value}`)(e.currentTarget.value)
        }
      />
    </div>
  ),
}

export const DateDefault: Story = {
  render: () => (
    <div className='w-[360px]'>
      <DateInput
        id='dob'
        label='Geburtstag'
        onChange={(e) =>
          action(`onChange: ${e.currentTarget.value}`)(e.currentTarget.value)
        }
      />
    </div>
  ),
}

export const DateFilled: Story = {
  render: () => (
    <div className='w-[360px]'>
      <DateInput
        id='dob2'
        label='Geburtstag'
        defaultValue={'08-03-2024'}
        onChange={(e) =>
          action(`onChange: ${e.currentTarget.value}`)(e.currentTarget.value)
        }
      />
    </div>
  ),
}
