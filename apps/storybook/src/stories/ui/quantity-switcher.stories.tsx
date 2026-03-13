import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import type { ComponentProps } from 'react'
import { QuantitySwitcher } from '@/components/ui/quantity-switcher/quantity-switcher'

const meta: Meta<typeof QuantitySwitcher> = {
  title: 'UI/QuantitySwitcher',
  component: QuantitySwitcher,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 1 },
      description: 'The current quantity value',
    },
    min: {
      control: { type: 'number', min: 0 },
      description: 'Minimum allowed quantity',
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Maximum allowed quantity (optional)',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the switcher is disabled',
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessibility label for the quantity switcher',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
    onDecrease: {
      action: 'decreased',
      description: 'Callback when decrease button is clicked',
      control: { disable: true },
    },
    onIncrease: {
      action: 'increased',
      description: 'Callback when increase button is clicked',
      control: { disable: true },
    },
    onChange: {
      action: 'changed',
      description: 'Callback when quantity value changes (via direct input)',
      control: { disable: true },
    },
  },
  args: {
    value: 1,
    min: 1,
    disabled: false,
    ariaLabel: 'Quantity',
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Interactive story with state management
const DefaultComponent = (args: ComponentProps<typeof QuantitySwitcher>) => {
  const [value, setValue] = useState(args?.value || 1)

  return (
    <div className='flex flex-col items-center gap-4 p-8'>
      <QuantitySwitcher
        {...args}
        value={value}
        onDecrease={() =>
          setValue((prev) => Math.max(args?.min || 1, prev - 1))
        }
        onIncrease={() => {
          if (args?.max === undefined || value < args.max) {
            setValue((prev) => prev + 1)
          }
        }}
        onChange={(newValue) => setValue(newValue)}
      />
      <p className='text-sm text-gray-600'>Current value: {value}</p>
    </div>
  )
}

export const Default: Story = {
  render: (args) => <DefaultComponent {...args} />,
}

const WithMaxLimitComponent = (
  args: ComponentProps<typeof QuantitySwitcher>
) => {
  const [value, setValue] = useState(5)

  return (
    <div className='flex flex-col items-center gap-4 p-8'>
      <QuantitySwitcher
        {...args}
        value={value}
        min={1}
        max={10}
        onDecrease={() => setValue((prev) => Math.max(1, prev - 1))}
        onIncrease={() => setValue((prev) => Math.min(10, prev + 1))}
        onChange={(newValue) => setValue(newValue)}
      />
      <p className='text-sm text-gray-600'>Current value: {value} (max: 10)</p>
    </div>
  )
}

export const WithMaxLimit: Story = {
  render: (args) => <WithMaxLimitComponent {...args} />,
}

export const Disabled: Story = {
  render: (args) => {
    return (
      <div className='flex flex-col items-center gap-4 p-8'>
        <QuantitySwitcher
          {...args}
          value={3}
          disabled
          onDecrease={() => {}}
          onIncrease={() => {}}
        />
        <p className='text-sm text-gray-600'>Disabled state</p>
      </div>
    )
  },
}

const AtMinimumComponent = (args: ComponentProps<typeof QuantitySwitcher>) => {
  const [value, setValue] = useState(1)

  return (
    <div className='flex flex-col items-center gap-4 p-8'>
      <QuantitySwitcher
        {...args}
        value={value}
        min={1}
        onDecrease={() => setValue((prev) => Math.max(1, prev - 1))}
        onIncrease={() => setValue((prev) => prev + 1)}
        onChange={(newValue) => setValue(newValue)}
      />
      <p className='text-sm text-gray-600'>
        Current value: {value} (decrease button disabled at min)
      </p>
    </div>
  )
}

export const AtMinimum: Story = {
  render: (args) => <AtMinimumComponent {...args} />,
}

const AtMaximumComponent = (args: ComponentProps<typeof QuantitySwitcher>) => {
  const [value, setValue] = useState(10)

  return (
    <div className='flex flex-col items-center gap-4 p-8'>
      <QuantitySwitcher
        {...args}
        value={value}
        min={1}
        max={10}
        onDecrease={() => setValue((prev) => Math.max(1, prev - 1))}
        onIncrease={() => setValue((prev) => Math.min(10, prev + 1))}
        onChange={(newValue) => setValue(newValue)}
      />
      <p className='text-sm text-gray-600'>
        Current value: {value} (increase button disabled at max)
      </p>
    </div>
  )
}

export const AtMaximum: Story = {
  render: (args) => <AtMaximumComponent {...args} />,
}

const CustomMinComponent = (args: ComponentProps<typeof QuantitySwitcher>) => {
  const [value, setValue] = useState(5)

  return (
    <div className='flex flex-col items-center gap-4 p-8'>
      <QuantitySwitcher
        {...args}
        value={value}
        min={5}
        max={20}
        onDecrease={() => setValue((prev) => Math.max(5, prev - 1))}
        onIncrease={() => setValue((prev) => Math.min(20, prev + 1))}
        onChange={(newValue) => setValue(newValue)}
      />
      <p className='text-sm text-gray-600'>
        Current value: {value} (min: 5, max: 20)
      </p>
    </div>
  )
}

export const CustomMin: Story = {
  render: (args) => <CustomMinComponent {...args} />,
}

const CustomHeightComponent = (
  args: ComponentProps<typeof QuantitySwitcher>
) => {
  const [value, setValue] = useState(3)

  return (
    <div className='flex flex-col items-center gap-4 p-8'>
      <QuantitySwitcher
        {...args}
        value={value}
        className='h-10'
        onDecrease={() => setValue((prev) => Math.max(1, prev - 1))}
        onIncrease={() => setValue((prev) => prev + 1)}
        onChange={(newValue) => setValue(newValue)}
      />
      <p className='text-sm text-gray-600'>Custom height (h-10)</p>
    </div>
  )
}

export const CustomHeight: Story = {
  render: (args) => <CustomHeightComponent {...args} />,
}

const CustomAriaLabelComponent = (
  args: ComponentProps<typeof QuantitySwitcher>
) => {
  const [value, setValue] = useState(2)

  return (
    <div className='flex flex-col items-center gap-4 p-8'>
      <QuantitySwitcher
        {...args}
        value={value}
        ariaLabel='Product quantity'
        onDecrease={() => setValue((prev) => Math.max(1, prev - 1))}
        onIncrease={() => setValue((prev) => prev + 1)}
        onChange={(newValue) => setValue(newValue)}
      />
      <p className='text-sm text-gray-600'>
        Custom aria-label: &quot;Product quantity&quot;
      </p>
    </div>
  )
}

export const CustomAriaLabel: Story = {
  render: (args) => <CustomAriaLabelComponent {...args} />,
}
