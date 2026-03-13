import type { Meta, StoryObj } from '@storybook/react'
import InfoCircleIcon from '@/public/icons/info.svg'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Define the story args type to include all the props we want to control
type TooltipStoryArgs = {
  // Tooltip root props
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  disableHoverableContent?: boolean

  // TooltipTrigger props (prefixed to avoid conflicts)
  triggerClassName?: string
  triggerAsChild?: boolean

  // TooltipContent props (prefixed to avoid conflicts)
  contentSideOffset?: number
  contentSide?: 'top' | 'right' | 'bottom' | 'left'
  contentClassName?: string
  contentWithArrow?: boolean
}

const meta: Meta<TooltipStoryArgs> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    // Tooltip root props
    defaultOpen: {
      control: { type: 'boolean' },
      description:
        'The open state of the tooltip when it is initially rendered.',
    },
    onOpenChange: {
      action: 'open state changed',
      description: 'Event handler called when the open state changes.',
    },
    delayDuration: {
      control: { type: 'number' },
      description: 'Delay duration before the tooltip is shown. Default: 500ms',
    },
    disableHoverableContent: {
      control: { type: 'boolean' },
      description:
        'Prevents Tooltip.Content from remaining open when hovering.',
    },

    // TooltipTrigger props
    triggerClassName: {
      control: { type: 'text' },
      description: 'Custom className for the trigger',
      table: {
        category: 'Trigger',
      },
    },
    triggerAsChild: {
      control: { type: 'boolean' },
      description: 'Whether to render as child element',
      table: {
        category: 'Trigger',
      },
    },

    // TooltipContent props
    contentSideOffset: {
      control: { type: 'number' },
      description: 'Distance in pixels from the trigger',
      table: {
        category: 'Content',
      },
    },
    contentSide: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left'],
      description: 'The side from which the tooltip appears',
      table: {
        category: 'Content',
      },
    },
    contentClassName: {
      control: { type: 'text' },
      description: 'Custom className for the content',
      table: {
        category: 'Content',
      },
    },
    contentWithArrow: {
      control: { type: 'boolean' },
      description: 'Whether to show the tooltip arrow',
      table: {
        category: 'Content',
      },
    },
  },
}

export default meta
type Story = StoryObj<TooltipStoryArgs>

export const Default: Story = {
  parameters: {
    layout: 'centered',
  },
  render: (args) => {
    const {
      // Tooltip props
      defaultOpen,
      onOpenChange,
      delayDuration,
      disableHoverableContent,

      // Trigger props
      triggerClassName,
      triggerAsChild,

      // Content props
      contentSideOffset,
      contentSide,
      contentClassName,
      contentWithArrow,
    } = args

    return (
      <Tooltip
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
        disableHoverableContent={disableHoverableContent}
      >
        <TooltipTrigger
          className={triggerClassName}
          asChild={triggerAsChild}
        >
          <span className='inline-flex items-center gap-2 whitespace-nowrap'>
            <strong>Hover Me</strong>
            <InfoCircleIcon
              className='pointer-events-none size-6 shrink-0'
              aria-hidden='true'
            />
          </span>
        </TooltipTrigger>
        <TooltipContent
          sideOffset={
            contentWithArrow ? contentSideOffset : (contentWithArrow || 0) + 10
          }
          side={contentSide}
          withArrow={contentWithArrow}
          className={contentClassName}
        >
          <p>Versandkostenfrei bestellenab 25 € innerhalb Deutschlands</p>
        </TooltipContent>
      </Tooltip>
    )
  },
}
