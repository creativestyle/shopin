import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Select,
  SelectRoot,
  type SelectRootProps,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Select component meta (high-level component with props)
const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: { type: 'text' },
      description: 'The controlled value of the select.',
    },
    label: {
      control: { type: 'text' },
      description: 'The label text for the select trigger.',
    },
    options: {
      control: { type: 'object' },
      description: 'Array of options for the select.',
    },
    disabled: {
      control: { type: 'boolean' },
      description:
        'When true, prevents the user from interacting with the select.',
    },
    required: {
      control: { type: 'boolean' },
      description:
        'When true, indicates that the user must select a value before the owning form can be submitted.',
    },
    invalid: {
      control: { type: 'boolean' },
      description:
        'When true, shows the error state (red border) on the trigger.',
    },
    onValueChange: {
      action: 'value changed',
      description: 'Event handler called when the value changes.',
      control: { disable: true },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>
type SelectRootStory = StoryObj<SelectRootProps>

// Custom Select Story - built like in select-demo.tsx
export const SelectRootExample: SelectRootStory = {
  argTypes: {
    invalid: { control: { type: 'boolean' } },
    ariaRequired: { control: { type: 'boolean' } },
  },
  args: {
    disabled: false,
    ariaRequired: false,
    invalid: false,
  },
  render: (args) => (
    <SelectRoot {...args}>
      <SelectTrigger
        label='Select a fruit'
        className='w-[180px]'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='apple'>Apple</SelectItem>
        <SelectItem value='banana'>Banana</SelectItem>
        <SelectItem value='blueberry'>Blueberry</SelectItem>
        <SelectItem value='grapes'>Grapes</SelectItem>
        <SelectItem value='pineapple'>Pineapple</SelectItem>
      </SelectContent>
    </SelectRoot>
  ),
}

// Scrollable Select with Groups
export const ScrollableSelect: SelectRootStory = {
  argTypes: {
    invalid: { control: { type: 'boolean' } },
    ariaRequired: { control: { type: 'boolean' } },
  },
  args: {
    disabled: false,
    ariaRequired: false,
    invalid: false,
  },
  render: (args) => (
    <SelectRoot {...args}>
      <SelectTrigger
        label='Select a timezone'
        className='w-[280px]'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value='est'>Eastern Standard Time (EST)</SelectItem>
          <SelectItem value='cst'>Central Standard Time (CST)</SelectItem>
          <SelectItem value='mst'>Mountain Standard Time (MST)</SelectItem>
          <SelectItem value='pst'>Pacific Standard Time (PST)</SelectItem>
          <SelectItem value='akst'>Alaska Standard Time (AKST)</SelectItem>
          <SelectItem value='hst'>Hawaii Standard Time (HST)</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Europe & Africa</SelectLabel>
          <SelectItem value='gmt'>Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value='cet'>Central European Time (CET)</SelectItem>
          <SelectItem value='eet'>Eastern European Time (EET)</SelectItem>
          <SelectItem value='west'>
            Western European Summer Time (WEST)
          </SelectItem>
          <SelectItem value='cat'>Central Africa Time (CAT)</SelectItem>
          <SelectItem value='eat'>East Africa Time (EAT)</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Asia</SelectLabel>
          <SelectItem value='msk'>Moscow Time (MSK)</SelectItem>
          <SelectItem value='ist'>India Standard Time (IST)</SelectItem>
          <SelectItem value='cst_china'>China Standard Time (CST)</SelectItem>
          <SelectItem value='jst'>Japan Standard Time (JST)</SelectItem>
          <SelectItem value='kst'>Korea Standard Time (KST)</SelectItem>
          <SelectItem value='ist_indonesia'>
            Indonesia Central Standard Time (WITA)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </SelectRoot>
  ),
}

// Select Story (high-level component)
const SelectExampleComponent = (args: {
  value?: string
  label: string
  options: { value: string; label: string }[]
  onValueChange?: (value: string) => void
  invalid?: boolean
}) => {
  const [value, setValue] = useState<string>(args.value || '')

  return (
    <div>
      <pre className='mb-4 rounded bg-gray-100 p-2 text-sm'>
        selected value: {value}
      </pre>
      <Select
        value={value}
        onValueChange={(newValue: string) => {
          setValue(newValue)
          args.onValueChange?.(newValue)
        }}
        label={args.label}
        options={args.options}
        invalid={args.invalid}
      />
    </div>
  )
}

export const SelectExample: Story = {
  args: {
    label: 'Select a fruit',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'blueberry', label: 'Blueberry' },
      { value: 'grapes', label: 'Grapes' },
      { value: 'pineapple', label: 'Pineapple' },
    ],
    invalid: false,
  },
  render: (args) => <SelectExampleComponent {...args} />,
}

// Select Story with initial value
const SelectWithInitialValueComponent = (args: {
  value?: string
  label: string
  options: { value: string; label: string }[]
  onValueChange?: (value: string) => void
}) => {
  const [value, setValue] = useState<string>(args.value || '')

  return (
    <div>
      <pre className='mb-4 rounded bg-gray-100 p-2 text-sm'>
        selected value: {value}
      </pre>
      <Select
        value={value}
        onValueChange={(newValue: string) => {
          setValue(newValue)
          args.onValueChange?.(newValue)
        }}
        label={args.label}
        options={args.options}
      />
    </div>
  )
}

export const SelectWithInitialValue: Story = {
  args: {
    label: 'Select a fruit',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'blueberry', label: 'Blueberry' },
      { value: 'grapes', label: 'Grapes' },
      { value: 'pineapple', label: 'Pineapple' },
    ],
    value: 'banana',
  },
  render: (args) => <SelectWithInitialValueComponent {...args} />,
}

// Disabled state
export const DisabledSelect: SelectRootStory = {
  argTypes: {
    invalid: { control: { type: 'boolean' } },
    ariaRequired: { control: { type: 'boolean' } },
  },
  args: {
    disabled: true,
    invalid: false,
    ariaRequired: false,
  },
  render: (args) => (
    <SelectRoot {...args}>
      <SelectTrigger
        label='Disabled select'
        className='w-[280px]'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='option1'>Option 1</SelectItem>
        <SelectItem value='option2'>Option 2</SelectItem>
        <SelectItem value='option3'>Option 3</SelectItem>
      </SelectContent>
    </SelectRoot>
  ),
}

// Disabled state with value
export const DisabledSelectWithValue: SelectRootStory = {
  argTypes: {
    invalid: { control: { type: 'boolean' } },
    ariaRequired: { control: { type: 'boolean' } },
  },
  args: {
    disabled: true,
    value: 'banana',
    invalid: false,
    ariaRequired: false,
  },
  render: (args) => (
    <SelectRoot {...args}>
      <SelectTrigger
        label='Disabled select'
        className='w-[280px]'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='apple'>Apple</SelectItem>
        <SelectItem value='banana'>Banana</SelectItem>
      </SelectContent>
    </SelectRoot>
  ),
}
