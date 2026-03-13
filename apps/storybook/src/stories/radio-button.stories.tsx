import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-button'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioButton',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
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
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: 'option-1',
    orientation: 'vertical',
  },
  render: (args) => (
    <RadioGroup
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
    >
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='opt-1'
          value='option-1'
        />
        <Label htmlFor='opt-1'>Label</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='opt-2'
          value='option-2'
        />
        <Label htmlFor='opt-2'>Label</Label>
      </div>
    </RadioGroup>
  ),
}

export const Inline: Story = {
  args: {
    defaultValue: 'none',
    orientation: 'horizontal',
  },
  render: (args) => (
    <RadioGroup
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
    >
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rg-none'
          value='none'
        />
        <Label htmlFor='rg-none'>Keine</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rg-frau'
          value='frau'
        />
        <Label htmlFor='rg-frau'>Frau</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rg-herr'
          value='herr'
        />
        <Label htmlFor='rg-herr'>Herr</Label>
      </div>
    </RadioGroup>
  ),
}

export const Disabled: Story = {
  args: {
    orientation: 'vertical',
  },
  render: (args) => (
    <RadioGroup
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
    >
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rb-dis-1'
          value='a'
          disabled
        />
        <Label htmlFor='rb-dis-1'>Disabled A</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rb-dis-2'
          value='b'
          disabled
        />
        <Label htmlFor='rb-dis-2'>Disabled B</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rb-dis-3'
          value='c'
        />
        <Label htmlFor='rb-dis-3'>Enabled C</Label>
      </div>
    </RadioGroup>
  ),
}

export const InvalidState: Story = {
  args: {
    orientation: 'vertical',
  },
  render: (args) => (
    <RadioGroup
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
    >
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rb-inv-1'
          value='option-1'
          invalid
        />
        <Label htmlFor='rb-inv-1'>Option 1</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rb-inv-2'
          value='option-2'
          invalid
        />
        <Label htmlFor='rb-inv-2'>Option 2</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rb-inv-3'
          value='option-3'
          invalid
        />
        <Label htmlFor='rb-inv-3'>Option 3</Label>
      </div>
    </RadioGroup>
  ),
}

export const InvalidHorizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <RadioGroup
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
    >
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rb-inv-h-1'
          value='female'
          invalid
        />
        <Label htmlFor='rb-inv-h-1'>Frau</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          id='rb-inv-h-2'
          value='male'
          invalid
        />
        <Label htmlFor='rb-inv-h-2'>Herr</Label>
      </div>
    </RadioGroup>
  ),
}
