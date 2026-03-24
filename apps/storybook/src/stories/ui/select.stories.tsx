import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
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

type Option = { value: string; label: string }
type Group = { label: string; items: Option[] }

const triggerClassName = 'w-[280px] min-w-[280px]'

function renderSelectRoot(
  args: SelectRootProps,
  config: {
    label: string
    items?: Option[]
    groups?: Group[]
    triggerClassName?: string
  }
) {
  return (
    <SelectRoot {...args}>
      <SelectTrigger
        label={config.label}
        className={config.triggerClassName ?? triggerClassName}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {config.groups?.map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.items.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
        {config.items?.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  )
}

function SelectExampleComponent(args: {
  value?: string
  label: string
  options: Option[]
  onValueChange?: (value: string) => void
  invalid?: boolean
}) {
  const [value, setValue] = useState<string>(args.value || '')

  return (
    <div className='min-w-[280px]'>
      <pre className='mb-4 rounded bg-gray-100 p-2 text-sm'>
        selected value: {value || 'none'}
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

const countryOptions: Option[] = [
  { value: 'at', label: 'Austria' },
  { value: 'de', label: 'Germany' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'fr', label: 'France' },
]

const shippingWindowOptions: Option[] = [
  { value: 'morning', label: '08:00 - 12:00' },
  { value: 'afternoon', label: '12:00 - 16:00' },
  { value: 'evening', label: '16:00 - 20:00' },
]

const timezoneGroups: Group[] = [
  {
    label: 'Europe',
    items: [
      { value: 'cet', label: 'Central European Time (CET)' },
      { value: 'eet', label: 'Eastern European Time (EET)' },
      { value: 'wet', label: 'Western European Time (WET)' },
    ],
  },
  {
    label: 'Americas',
    items: [
      { value: 'est', label: 'Eastern Time (ET)' },
      { value: 'cst', label: 'Central Time (CT)' },
      { value: 'pst', label: 'Pacific Time (PT)' },
    ],
  },
  {
    label: 'Asia Pacific',
    items: [
      { value: 'ist', label: 'India Standard Time (IST)' },
      { value: 'jst', label: 'Japan Standard Time (JST)' },
      { value: 'aest', label: 'Australian Eastern Time (AET)' },
    ],
  },
]

const departmentOptions: Option[] = [
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' },
  { value: 'billing', label: 'Billing' },
]

const priorityOptions: Option[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const meta = {
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
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>
type SelectRootStory = StoryObj<SelectRootProps>

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
  render: (args) =>
    renderSelectRoot(args, {
      label: 'Select country',
      items: countryOptions,
    }),
}

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
  render: (args) =>
    renderSelectRoot(args, {
      label: 'Select timezone',
      groups: timezoneGroups,
    }),
}

export const SelectExample: Story = {
  args: {
    label: 'Select shipping window',
    options: shippingWindowOptions,
    invalid: false,
    onValueChange: action('valueChange'),
  },
  render: (args) => <SelectExampleComponent {...args} />,
}

export const SelectWithInitialValue: Story = {
  args: {
    label: 'Select department',
    options: departmentOptions,
    value: 'support',
    onValueChange: action('valueChange'),
  },
  render: (args) => <SelectExampleComponent {...args} />,
}

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
  render: (args) =>
    renderSelectRoot(args, {
      label: 'Disabled select',
      items: priorityOptions,
    }),
}

export const DisabledSelectWithValue: SelectRootStory = {
  argTypes: {
    invalid: { control: { type: 'boolean' } },
    ariaRequired: { control: { type: 'boolean' } },
  },
  args: {
    disabled: true,
    value: 'medium',
    invalid: false,
    ariaRequired: false,
  },
  render: (args) =>
    renderSelectRoot(args, {
      label: 'Disabled select',
      items: priorityOptions,
    }),
}
