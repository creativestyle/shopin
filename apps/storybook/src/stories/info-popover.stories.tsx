import type { Meta, StoryObj } from '@storybook/react'
import InfoCircleIcon from '@/public/icons/info.svg'
import {
  InfoPopover,
  InfoPopoverTrigger,
  InfoPopoverContent,
} from '@/components/ui/info-popover'

const meta: Meta<typeof InfoPopover> = {
  title: 'UI/InfoPopover',
  component: InfoPopover,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    return (
      <InfoPopover {...args}>
        <InfoPopoverTrigger>
          <span className='inline-flex items-center gap-2 whitespace-nowrap'>
            <strong>Max. Steigung</strong>
            <InfoCircleIcon
              className='pointer-events-none -mt-0.5 size-6 shrink-0'
              aria-hidden='true'
            />
          </span>
        </InfoPopoverTrigger>
        <InfoPopoverContent title='Max. Steigung'>
          Die maximale Steigung oder Neigung, die der Rasenmäher bewältigen
          kann, während er effizient arbeitet. Der RM18 Okay kann Steigungen von
          bis zu 20° oder 35 % bewältigen und ist damit ideal für unebene oder
          geneigte Rasenflächen
        </InfoPopoverContent>
      </InfoPopover>
    )
  },
}
