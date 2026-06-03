import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import InfoCircleIcon from '@/public/icons/info.svg'
import {
  InfoPopover,
  InfoPopoverTrigger,
  InfoPopoverContent,
} from '@/components/ui/info-popover'

type InfoPopoverStoryArgs = {
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  withArrow?: boolean
  content?: string
  triggerLabel?: string
  popoverTitle?: string
}

type InfoPopoverUseCase = {
  title: string
  description?: string
  trigger: string
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  withArrow?: boolean
  sideOffset?: number
}

function InfoPopoverShowcaseRow({
  title,
  description,
  children,
}: {
  title: string
  description?: string
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

function InfoPopoverExample({
  trigger: triggerText,
  content,
  title,
  side = 'top',
  sideOffset = 8,
  withArrow = true,
}: InfoPopoverUseCase) {
  return (
    <InfoPopover>
      <InfoPopoverTrigger>
        <span className='inline-flex cursor-pointer items-center gap-2 text-sm font-medium whitespace-nowrap'>
          {triggerText}
          <InfoCircleIcon
            className='pointer-events-none size-5 shrink-0'
            aria-hidden='true'
          />
        </span>
      </InfoPopoverTrigger>
      <InfoPopoverContent
        title={title}
        side={side}
        sideOffset={sideOffset}
        withArrow={withArrow}
      >
        <p>{content}</p>
      </InfoPopoverContent>
    </InfoPopover>
  )
}

const useCases: InfoPopoverUseCase[] = [
  {
    title: 'Returns policy',
    description: 'Appears above the trigger — the default position.',
    trigger: 'Free returns',
    content:
      'Items can be returned within 30 days of delivery in original condition.',
    side: 'top',
  },
  {
    title: 'Shipping info',
    description: 'Keeps the trigger visible with the explanation beside it.',
    trigger: 'Delivery details',
    content:
      'Standard delivery takes 3–5 business days. Express options appear at checkout.',
    side: 'right',
  },
  {
    title: 'Size guide',
    description: 'Works well when the trigger is near the top of the viewport.',
    trigger: 'Size help',
    content:
      'Measure your chest and waist, then match against the size chart on the product page.',
    side: 'bottom',
  },
  {
    title: 'Price match',
    description:
      'Keeps the explanation close without overlapping content to the right.',
    trigger: 'Price info',
    content:
      'We match competitor prices on identical items. Restrictions may apply.',
    side: 'left',
  },
  {
    title: 'Without arrow',
    description: 'Cleaner look when the popover content explains itself.',
    trigger: 'Payment methods',
    content:
      'We accept Visa, Mastercard, PayPal, and Apple Pay. More options may be available at checkout.',
    side: 'top',
    withArrow: false,
  },
]

const meta = {
  title: 'UI/InfoPopover',
  component: InfoPopover,
  tags: ['autodocs'],
} satisfies Meta<InfoPopoverStoryArgs>

export default meta
type Story = StoryObj<InfoPopoverStoryArgs>

export const Playground: Story = {
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
      description: 'When true, prevents the popover from opening.',
    },
    onOpenChange: {
      action: 'open state changed',
      description:
        'Event handler called when the open state of the popover changes.',
    },
    side: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left'],
      description:
        'The preferred side of the trigger where the popover content appears.',
      table: {
        category: 'Content',
      },
    },
    sideOffset: {
      control: { type: 'number' },
      description:
        'Distance in pixels between the popover content and the trigger element.',
      table: {
        category: 'Content',
      },
    },
    withArrow: {
      control: { type: 'boolean' },
      description:
        'Whether to display a small arrow pointing from the content toward the trigger.',
      table: {
        category: 'Content',
      },
    },
    content: {
      control: { type: 'text' },
      description: 'Text content displayed inside the popover.',
    },
    triggerLabel: {
      control: { type: 'text' },
      description: 'Label text displayed next to the info icon in the trigger.',
    },
    popoverTitle: {
      control: { type: 'text' },
      description: 'Title displayed in the popover content header.',
    },
  },
  args: {
    side: 'top',
    sideOffset: 8,
    withArrow: true,
    triggerLabel: 'Estimated delivery',
    popoverTitle: 'Estimated delivery',
    content:
      'Standard delivery usually leaves our warehouse within one business day. Carriers publish tracking after the first scan; rural addresses may add one extra working day.',
  },
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
  render: (args) => (
    <InfoPopover
      disabled={args.disabled}
      onOpenChange={args.onOpenChange}
    >
      <InfoPopoverTrigger>
        <span className='inline-flex cursor-pointer items-center gap-2 whitespace-nowrap'>
          <strong>{args.triggerLabel}</strong>
          <InfoCircleIcon
            className='pointer-events-none size-5 shrink-0'
            aria-hidden='true'
          />
        </span>
      </InfoPopoverTrigger>
      <InfoPopoverContent
        title={args.popoverTitle ?? 'Estimated delivery'}
        side={args.side}
        sideOffset={args.sideOffset}
        withArrow={args.withArrow}
      >
        <p>{args.content}</p>
      </InfoPopoverContent>
    </InfoPopover>
  ),
}

export const Showcase: Story = {
  parameters: {
    layout: 'centered',
  },
  render: () => (
    <div className='flex w-full max-w-[720px] flex-col gap-4'>
      {useCases.map((item) => (
        <InfoPopoverShowcaseRow
          key={item.title}
          title={item.title}
          description={item.description}
        >
          <InfoPopoverExample
            trigger={item.trigger}
            content={item.content}
            title={item.title}
            side={item.side}
            sideOffset={item.sideOffset}
            withArrow={item.withArrow}
          />
        </InfoPopoverShowcaseRow>
      ))}
    </div>
  ),
}
