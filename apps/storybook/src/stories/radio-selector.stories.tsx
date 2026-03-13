import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import {
  RadioSelector,
  RadioSelectorOption,
} from '@/components/ui/radio-selector'

const meta: Meta<typeof RadioSelector> = {
  title: 'UI/RadioSelector',
  component: RadioSelector,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    value: { control: false },
    defaultValue: { control: 'text' },
    onValueChange: { control: false },
    className: { control: 'text' },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: 'none',
  },
  render: (args) => (
    <RadioSelector
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
      className='w-full max-w-[400px]'
    >
      <RadioSelectorOption
        id='sel-none'
        value='none'
        label='Label'
        endContent={<span className='font-bold text-[#0070BA]'>PayPal</span>}
      />
      <RadioSelectorOption
        id='sel-a'
        value='a'
        label='Label'
        endContent={<span className='font-semibold'>VISA</span>}
      />
      <RadioSelectorOption
        id='sel-b'
        value='b'
        label='Label'
        endContent={
          <span className='font-semibold text-[#EB001B]'>Mastercard</span>
        }
      />
    </RadioSelector>
  ),
}

export const WithDescription: Story = {
  args: {
    defaultValue: 'a',
  },
  render: (args) => (
    <RadioSelector
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
      className='w-full max-w-[400px]'
    >
      <RadioSelectorOption
        id='desc-a'
        value='a'
        label='Label'
        endContent={<span className='font-semibold'>49,95 €</span>}
        description={
          <div>
            <p>Ettenreichgasse 45c</p>
            <p>1100 Wien</p>
            <p>Österreich</p>
          </div>
        }
      />
      <RadioSelectorOption
        id='desc-b'
        value='b'
        label='Label'
        endContent={<span className='font-semibold'>49,95 €</span>}
        description={
          <div>
            <p>Ettenreichgasse 45c</p>
            <p>1100 Wien</p>
            <p>Österreich</p>
          </div>
        }
      />
      <RadioSelectorOption
        id='desc-c'
        value='c'
        label='Label'
        endContent={<span className='font-semibold'>49,95 €</span>}
        description={
          <div>
            <p>Ettenreichgasse 45c</p>
            <p>1100 Wien</p>
            <p>Österreich</p>
          </div>
        }
      />
    </RadioSelector>
  ),
}

export const WithLabelInfo: Story = {
  args: {
    defaultValue: 'opt-1',
  },
  render: (args) => (
    <RadioSelector
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
      className='w-full max-w-[400px]'
    >
      <RadioSelectorOption
        id='opt-1'
        value='opt-1'
        label='Label'
        labelInfo='Helpful details about this option.'
        endContent={<span className='font-semibold'>49,95 €</span>}
        description={<div>Address or extra details go here.</div>}
      />
      <RadioSelectorOption
        id='opt-2'
        value='opt-2'
        label='Label'
        labelInfo='Helpful details about this option.'
        endContent={<span className='font-semibold'>39,95 €</span>}
      />
    </RadioSelector>
  ),
}

export const DescriptionOnly: Story = {
  args: {
    defaultValue: 'addr-1',
  },
  render: (args) => (
    <RadioSelector
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
      className='w-full max-w-[400px]'
    >
      <RadioSelectorOption
        id='addr-1'
        value='addr-1'
        description={
          <div>
            <p>Herr John Doe</p>
            <p>Bahnhofstrasse 12</p>
            <p>8001 Zürich</p>
          </div>
        }
        endContent={<span className='underline'>Ändern</span>}
      />
      <RadioSelectorOption
        id='addr-2'
        value='addr-2'
        description={
          <div>
            <p>Hans Bauer</p>
            <p>Rue du 23-Juin 20</p>
            <p>2830 Courrendlin</p>
          </div>
        }
        endContent={<span className='underline'>Ändern</span>}
      />
      <RadioSelectorOption
        id='addr-3'
        value='addr-3'
        description={
          <div>
            <p>Frau Erika Mustermann</p>
            <p>Dorfplatz 10</p>
            <p>3673 Linden</p>
          </div>
        }
        endContent={<span className='underline'>Ändern</span>}
      />
    </RadioSelector>
  ),
}

export const Disabled: Story = {
  args: {
    defaultValue: 'addr-1',
  },
  render: (args) => (
    <RadioSelector
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
      className='w-full max-w-[400px]'
    >
      <RadioSelectorOption
        id='rsel-dis-1'
        value='addr-1'
        label='Disabled selected'
        disabled
        description={<div>Some description</div>}
      />
      <RadioSelectorOption
        id='rsel-dis-2'
        value='addr-2'
        label='Disabled not selected'
        disabled
        description={<div>Another description</div>}
      />
      <RadioSelectorOption
        id='rsel-en-3'
        value='addr-3'
        label='Enabled'
        description={<div>Enabled description</div>}
      />
    </RadioSelector>
  ),
}

export const InvalidState: Story = {
  render: (args) => (
    <RadioSelector
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
      className='w-[400px]'
    >
      <RadioSelectorOption
        id='rsel-inv-1'
        value='twint'
        label='Twint'
        invalid
        endContent={<span className='text-gray-500'>TWINT</span>}
      />
      <RadioSelectorOption
        id='rsel-inv-2'
        value='rechnung'
        label='Rechnung'
        invalid
        endContent={<span className='text-gray-500'>CembraPay</span>}
      />
      <RadioSelectorOption
        id='rsel-inv-3'
        value='visa'
        label='VISA'
        invalid
        endContent={<span className='text-gray-500'>VISA</span>}
      />
    </RadioSelector>
  ),
}

export const InvalidWithDescription: Story = {
  render: (args) => (
    <RadioSelector
      {...args}
      onValueChange={(val: string) => action(`State changed: ${val}`)(val)}
      className='w-[400px]'
    >
      <RadioSelectorOption
        id='rsel-inv-desc-1'
        value='option-a'
        label='Payment Option A'
        invalid
        endContent={<span className='font-semibold'>49,95 €</span>}
        description={
          <div>
            <p>Option A description</p>
            <p>Additional details here</p>
          </div>
        }
      />
      <RadioSelectorOption
        id='rsel-inv-desc-2'
        value='option-b'
        label='Payment Option B'
        invalid
        endContent={<span className='font-semibold'>39,95 €</span>}
        description={
          <div>
            <p>Option B description</p>
            <p>Another detail line</p>
          </div>
        }
      />
    </RadioSelector>
  ),
}
