import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import ChevronDownIcon from '@/public/icons/chevron-down.svg'

const PANEL_TITLE = 'Description & details'

function PanelContent() {
  return (
    <>
      <p className='mb-4 text-gray-950'>SKU: 88421-BLK-38</p>
      <p className='mb-4'>
        Midweight cotton canvas jacket with a water-repellent finish and a
        brushed lining through the body. Designed for everyday wear between
        seasons; pair with knits when the temperature drops.
      </p>
      <ul className='list-inside list-disc'>
        <li>Relaxed fit; the model is 6&apos;1&quot; and wears a medium.</li>
        <li>Two-way zip, stand collar, and internal phone pocket.</li>
        <li>Machine wash cold with similar colours; reshape while damp.</li>
        <li>
          Free standard delivery on orders over the threshold shown at checkout.
        </li>
      </ul>
    </>
  )
}

type CollapsibleDemoProps = {
  bordered?: boolean
  defaultOpen?: boolean
  disabled?: boolean
  indicator?: boolean
  customIndicator?: boolean
}

function CollapsibleDemo({
  bordered = false,
  defaultOpen = false,
  disabled = false,
  indicator = true,
  customIndicator = false,
}: CollapsibleDemoProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className='text-gray-500'>
      <Collapsible
        bordered={bordered}
        defaultOpen={defaultOpen}
        disabled={disabled}
        open={open}
        onOpenChange={setOpen}
      >
        {customIndicator ? (
          <CollapsibleTrigger
            indicator={false}
            className='w-full justify-between'
          >
            {PANEL_TITLE}
            <ChevronDownIcon
              className={`size-6 shrink-0 self-center text-gray-950 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
              aria-hidden='true'
            />
          </CollapsibleTrigger>
        ) : (
          <CollapsibleTrigger indicator={indicator}>
            {PANEL_TITLE}
          </CollapsibleTrigger>
        )}
        <CollapsibleContent>
          <PanelContent />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className='w-full max-w-md'>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    bordered: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    disabled: { control: 'boolean' },
    indicator: { control: 'boolean' },
    customIndicator: { control: 'boolean' },
  },
} satisfies Meta<CollapsibleDemoProps>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <CollapsibleDemo
      {...args}
      customIndicator={false}
    />
  ),
}

export const Bordered: Story = {
  args: { bordered: true },
  argTypes: {
    bordered: { control: false },
  },
  render: (args) => (
    <CollapsibleDemo
      {...args}
      customIndicator={false}
    />
  ),
}

export const DefaultOpen: Story = {
  args: {
    bordered: true,
    defaultOpen: true,
  },
  argTypes: {
    bordered: { control: false },
    defaultOpen: { control: false },
  },
  render: (args) => (
    <CollapsibleDemo
      {...args}
      customIndicator={false}
    />
  ),
}

export const CustomIndicator: Story = {
  args: {
    bordered: true,
    customIndicator: true,
    indicator: false,
  },
  argTypes: {
    bordered: { control: false },
    customIndicator: { control: false },
    indicator: { control: false },
  },
  render: (args) => <CollapsibleDemo {...args} />,
}
