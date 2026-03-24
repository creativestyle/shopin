import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import InfoCircleIcon from '@/public/icons/info.svg'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

type TooltipStoryArgs = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  disableHoverableContent?: boolean
  sideOffset?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  withArrow?: boolean
}

type TooltipUseCase = {
  title: string
  description: string
  trigger: string
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

function TooltipShowcaseRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className='flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6'>
      <div className='min-w-0 flex-1'>
        <h3 className='font-medium text-gray-950'>{title}</h3>
        <p className='mt-1 text-sm text-gray-500'>{description}</p>
      </div>
      <div className='shrink-0'>{children}</div>
    </div>
  )
}

function TooltipExample({
  triggerText,
  content,
  side = 'top',
  sideOffset = 8,
  withArrow = true,
}: {
  triggerText: string
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  withArrow?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='inline-flex cursor-help items-center gap-2 text-sm font-medium whitespace-nowrap'>
          {triggerText}
          <InfoCircleIcon
            className='pointer-events-none size-5 shrink-0'
            aria-hidden='true'
          />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        withArrow={withArrow}
      >
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  )
}

const useCases: TooltipUseCase[] = [
  {
    title: 'Shipping threshold hint',
    description: 'Clarifies when free shipping becomes available.',
    trigger: 'Free shipping info',
    content: 'Free shipping is applied for orders above EUR 50.',
  },
  {
    title: 'Password requirements',
    description: 'Explains rules before the user submits the form.',
    trigger: 'Password requirements',
    content: 'Use 8+ characters, one number, and one special character.',
  },
  {
    title: 'Promotion eligibility',
    description: 'Explains why a promotion may not apply to all items.',
    trigger: 'Promo details',
    content: 'Discount excludes gift cards and already discounted bundles.',
    side: 'right',
  },
]

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className='mx-auto w-full max-w-2xl'>
        <Story />
      </div>
    ),
  ],
  argTypes: {
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
    sideOffset: {
      control: { type: 'number' },
      description: 'Distance in pixels from the trigger',
      table: {
        category: 'Content',
      },
    },
    side: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left'],
      description: 'The side from which the tooltip appears',
      table: {
        category: 'Content',
      },
    },
    withArrow: {
      control: { type: 'boolean' },
      description: 'Whether to show the tooltip arrow',
      table: {
        category: 'Content',
      },
    },
  },
} satisfies Meta<TooltipStoryArgs>

export default meta
type Story = StoryObj<TooltipStoryArgs>

export const Default: Story = {
  name: 'Playground',
  args: {
    side: 'top',
    sideOffset: 8,
    withArrow: true,
    delayDuration: 300,
  },
  render: (args) => {
    return (
      <Tooltip
        defaultOpen={args.defaultOpen}
        onOpenChange={args.onOpenChange}
        delayDuration={args.delayDuration}
        disableHoverableContent={args.disableHoverableContent}
      >
        <TooltipTrigger asChild>
          <span className='inline-flex cursor-help items-center gap-2 whitespace-nowrap'>
            <strong>Delivery information</strong>
            <InfoCircleIcon
              className='pointer-events-none size-5 shrink-0'
              aria-hidden='true'
            />
          </span>
        </TooltipTrigger>
        <TooltipContent
          sideOffset={args.sideOffset}
          side={args.side}
          withArrow={args.withArrow}
        >
          <p>Free shipping is applied for orders above EUR 50.</p>
        </TooltipContent>
      </Tooltip>
    )
  },
}

export const Showcase: Story = {
  render: () => (
    <div className='flex w-full max-w-[720px] flex-col gap-4'>
      {useCases.map((item) => (
        <TooltipShowcaseRow
          key={item.title}
          title={item.title}
          description={item.description}
        >
          <TooltipExample
            triggerText={item.trigger}
            content={item.content}
            side={item.side}
          />
        </TooltipShowcaseRow>
      ))}

      <TooltipShowcaseRow
        title='Tooltip on action button'
        description='Common pattern for icon-only or compact actions.'
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Apply</Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>
            <p>Applies the current filter selection.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipShowcaseRow>
    </div>
  ),
}
