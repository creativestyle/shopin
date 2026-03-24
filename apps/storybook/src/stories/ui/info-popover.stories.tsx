import type { Meta, StoryObj } from '@storybook/react'
import InfoCircleIcon from '@/public/icons/info.svg'
import {
  InfoPopover,
  InfoPopoverTrigger,
  InfoPopoverContent,
} from '@/components/ui/info-popover'

const meta = {
  title: 'UI/InfoPopover',
  component: InfoPopover,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof InfoPopover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <InfoPopover {...args}>
      <InfoPopoverTrigger>
        <span className='inline-flex items-center gap-2 whitespace-nowrap'>
          <strong>Estimated delivery</strong>
          <InfoCircleIcon
            className='pointer-events-none -mt-0.5 size-6 shrink-0'
            aria-hidden='true'
          />
        </span>
      </InfoPopoverTrigger>
      <InfoPopoverContent title='Estimated delivery'>
        Standard delivery usually leaves our warehouse within one business day.
        Carriers publish tracking after the first scan; rural addresses may add
        one extra working day. Express options appear at checkout when
        available.
      </InfoPopoverContent>
    </InfoPopover>
  ),
}
