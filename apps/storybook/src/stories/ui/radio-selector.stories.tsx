import type { ComponentProps, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import {
  RadioSelector,
  RadioSelectorOption,
} from '@/components/ui/radio-selector'

type RadioSelectorStoryOption = {
  id: string
  value: string
  label?: string
  labelInfo?: string
  description?: ReactNode
  endContent?: ReactNode
  disabled?: boolean
  invalid?: boolean
}

const maxWidthClassName = 'w-full min-w-[360px] max-w-[400px]'
const onValueChange = action('valueChange')

function renderRadioSelectorStory(
  args: ComponentProps<typeof RadioSelector>,
  options: RadioSelectorStoryOption[]
) {
  return (
    <RadioSelector
      {...args}
      className={args.className ?? maxWidthClassName}
      onValueChange={onValueChange}
    >
      {options.map((option) => (
        <RadioSelectorOption
          key={option.id}
          {...option}
        />
      ))}
    </RadioSelector>
  )
}

const paymentMethodOptions: RadioSelectorStoryOption[] = [
  {
    id: 'payment-card',
    value: 'card',
    label: 'Credit or debit card',
  },
  {
    id: 'payment-bank',
    value: 'bank-transfer',
    label: 'Bank transfer',
  },
  {
    id: 'payment-invoice',
    value: 'invoice',
    label: 'Pay by invoice',
  },
]

const shippingAddressOptions: RadioSelectorStoryOption[] = [
  {
    id: 'ship-standard',
    value: 'standard',
    label: 'Pickup',
    description: (
      <div>
        <p>Orchid Station 17</p>
        <p>Cloud District 9</p>
      </div>
    ),
  },
  {
    id: 'ship-office',
    value: 'office',
    label: 'Office',
    description: (
      <div>
        <p>44 Nimbus Walk</p>
        <p>Aurora Sector</p>
      </div>
    ),
  },
  {
    id: 'ship-pickup',
    value: 'pickup',
    label: 'Home',
    description: (
      <div>
        <p>12 Echo Crescent</p>
        <p>Nova Quarter</p>
      </div>
    ),
  },
]

const labelInfoOptions: RadioSelectorStoryOption[] = [
  {
    id: 'opt-1',
    value: 'opt-1',
    label: 'Standard shipping',
    labelInfo: 'Delivered in 2-3 business days.',
    endContent: <span>2-3 days</span>,
  },
  {
    id: 'opt-2',
    value: 'opt-2',
    label: 'Express shipping',
    labelInfo: 'Delivered next business day.',
    endContent: <span>Next day</span>,
  },
]

const descriptionOnlyOptions: RadioSelectorStoryOption[] = [
  {
    id: 'addr-1',
    value: 'addr-1',
    description: (
      <div>
        <p>Mr. John Doe</p>
        <p>77 Quartz Avenue</p>
        <p>Helios Borough</p>
      </div>
    ),
    endContent: <span className='underline'>Change</span>,
  },
  {
    id: 'addr-2',
    value: 'addr-2',
    description: (
      <div>
        <p>Ms. Emma Rossi</p>
        <p>15 Lantern Passage</p>
        <p>Cobalt City</p>
      </div>
    ),
    endContent: <span className='underline'>Change</span>,
  },
  {
    id: 'addr-3',
    value: 'addr-3',
    description: (
      <div>
        <p>Mr. Noah Jensen</p>
        <p>103 Maple Orbit</p>
        <p>Silver Plains</p>
      </div>
    ),
    endContent: <span className='underline'>Change</span>,
  },
  {
    id: 'addr-4',
    value: 'addr-4',
    description: (
      <div>
        <p>Mx. Casey Patel</p>
        <p>6 Driftwood Rise</p>
        <p>Moonbay</p>
      </div>
    ),
    endContent: <span className='underline'>Change</span>,
  },
]

const disabledOptions: RadioSelectorStoryOption[] = [
  {
    id: 'rsel-dis-1',
    value: 'addr-1',
    label: 'Stored address',
    disabled: true,
    description: <div>Current selection</div>,
  },
  {
    id: 'rsel-dis-2',
    value: 'addr-2',
    label: 'Old office',
    disabled: true,
    description: <div>No longer available</div>,
  },
  {
    id: 'rsel-en-3',
    value: 'addr-3',
    label: 'New address',
    description: <div>Available</div>,
  },
]

const invalidOptions: RadioSelectorStoryOption[] = [
  {
    id: 'rsel-inv-1',
    value: 'wallet',
    label: 'Digital wallet',
    invalid: true,
  },
  {
    id: 'rsel-inv-2',
    value: 'invoice',
    label: 'Invoice',
    invalid: true,
  },
  {
    id: 'rsel-inv-3',
    value: 'card',
    label: 'Card',
    invalid: true,
  },
]

const invalidDescriptionOptions: RadioSelectorStoryOption[] = [
  {
    id: 'rsel-inv-desc-1',
    value: 'option-a',
    label: 'Option A',
    invalid: true,
    endContent: <span>Basic</span>,
    description: (
      <div>
        <p>Missing required data.</p>
      </div>
    ),
  },
  {
    id: 'rsel-inv-desc-2',
    value: 'option-b',
    label: 'Option B',
    invalid: true,
    endContent: <span>Plus</span>,
    description: (
      <div>
        <p>Not available in this region.</p>
      </div>
    ),
  },
]

const meta = {
  title: 'UI/RadioSelector',
  component: RadioSelector,
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
    className: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof RadioSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: 'card',
  },
  render: (args) => renderRadioSelectorStory(args, paymentMethodOptions),
}

export const WithDescription: Story = {
  args: {
    defaultValue: 'standard',
  },
  render: (args) => renderRadioSelectorStory(args, shippingAddressOptions),
}

export const WithLabelInfo: Story = {
  args: {
    defaultValue: 'opt-1',
  },
  render: (args) => renderRadioSelectorStory(args, labelInfoOptions),
}

export const DescriptionOnly: Story = {
  args: {
    defaultValue: 'addr-1',
  },
  render: (args) => renderRadioSelectorStory(args, descriptionOnlyOptions),
}

export const Disabled: Story = {
  args: {
    defaultValue: 'addr-1',
  },
  render: (args) => renderRadioSelectorStory(args, disabledOptions),
}

export const InvalidState: Story = {
  args: {
    defaultValue: 'wallet',
  },
  render: (args) => renderRadioSelectorStory(args, invalidOptions),
}

export const InvalidWithDescription: Story = {
  args: {
    defaultValue: 'option-a',
  },
  render: (args) => renderRadioSelectorStory(args, invalidDescriptionOptions),
}
