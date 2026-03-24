import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-button'
import { Label } from '@/components/ui/label'

function RadioRow({
  id,
  value,
  label,
  ...itemProps
}: {
  id: string
  value: string
  label: string
} & Omit<ComponentProps<typeof RadioGroupItem>, 'id' | 'value'>) {
  return (
    <div className='flex items-center gap-2'>
      <RadioGroupItem
        id={id}
        value={value}
        {...itemProps}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  )
}

type RadioOption = {
  id: string
  value: string
  label: string
  disabled?: boolean
  invalid?: boolean
}

function renderRadioStory(
  args: ComponentProps<typeof RadioGroup>,
  options: RadioOption[]
) {
  return (
    <RadioGroup
      {...args}
      onValueChange={onValueChange}
    >
      {options.map(({ id, value, label, ...itemProps }) => (
        <RadioRow
          key={id}
          id={id}
          value={value}
          label={label}
          {...itemProps}
        />
      ))}
    </RadioGroup>
  )
}

const shippingOptions: RadioOption[] = [
  {
    id: 'radio-shipping-standard',
    value: 'standard',
    label: 'Standard delivery',
  },
  { id: 'radio-shipping-express', value: 'express', label: 'Express delivery' },
]

const titleOptions: RadioOption[] = [
  { id: 'radio-title-ms', value: 'ms', label: 'Ms.' },
  { id: 'radio-title-mr', value: 'mr', label: 'Mr.' },
  { id: 'radio-title-mx', value: 'mx', label: 'Mx.' },
]

const stockOptions: RadioOption[] = [
  { id: 'radio-dis-a', value: 'a', label: 'Sold out — size S', disabled: true },
  { id: 'radio-dis-b', value: 'b', label: 'Sold out — size M', disabled: true },
  { id: 'radio-dis-c', value: 'c', label: 'Size L — in stock' },
]

const addressOptions: RadioOption[] = [
  { id: 'radio-inv-home', value: 'home', label: 'Home address', invalid: true },
  { id: 'radio-inv-work', value: 'work', label: 'Work address', invalid: true },
  {
    id: 'radio-inv-pickup',
    value: 'pickup',
    label: 'Click & collect',
    invalid: true,
  },
]

const invalidTitleOptions: RadioOption[] = [
  { id: 'radio-inv-h-ms', value: 'ms', label: 'Ms.', invalid: true },
  { id: 'radio-inv-h-mr', value: 'mr', label: 'Mr.', invalid: true },
]

const meta = {
  title: 'UI/RadioButton',
  component: RadioGroup,
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
    value: { control: false },
    defaultValue: { control: 'text' },
    onValueChange: { control: false },
    disabled: { control: 'boolean' },
    orientation: {
      control: { type: 'radio' },
      options: ['vertical', 'horizontal'],
    },
    className: { control: 'text' },
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

const onValueChange = (val: string) => action('valueChange')(val)

export const Default: Story = {
  args: {
    defaultValue: 'standard',
    orientation: 'vertical',
  },
  render: (args) => renderRadioStory(args, shippingOptions),
}

export const Inline: Story = {
  name: 'Horizontal (title)',
  args: {
    defaultValue: 'ms',
    orientation: 'horizontal',
  },
  render: (args) => renderRadioStory(args, titleOptions),
}

export const Disabled: Story = {
  args: {
    defaultValue: 'c',
    orientation: 'vertical',
  },
  render: (args) => renderRadioStory(args, stockOptions),
}

export const InvalidState: Story = {
  name: 'Invalid (vertical)',
  args: {
    defaultValue: 'home',
    orientation: 'vertical',
  },
  render: (args) => renderRadioStory(args, addressOptions),
}

export const InvalidHorizontal: Story = {
  name: 'Invalid (horizontal)',
  args: {
    defaultValue: 'ms',
    orientation: 'horizontal',
  },
  render: (args) => renderRadioStory(args, invalidTitleOptions),
}
