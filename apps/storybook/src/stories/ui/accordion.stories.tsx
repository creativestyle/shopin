import type { Meta, StoryObj } from '@storybook/react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const meta: Meta<typeof AccordionDemo> = {
  title: 'UI/Accordion',
  component: AccordionDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    defaultValue: {
      control: { type: 'select' },
      options: ['item-1', 'item-2', 'item-3'],
    },
    type: {
      control: { type: 'select' },
      options: ['single', 'multiple'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

function Content1() {
  return (
    <AccordionContent className='flex flex-col gap-4'>
      <p>
        Our flagship product combines cutting-edge technology with sleek design.
        Built with premium materials, it offers unparalleled performance and
        reliability.
      </p>
      <p>
        Key features include advanced processing capabilities, and an intuitive
        user interface designed for both beginners and experts.
      </p>
    </AccordionContent>
  )
}

function Content2() {
  return (
    <AccordionContent className='flex flex-col gap-4'>
      <p>
        We offer worldwide shipping through trusted courier partners. Standard
        delivery takes 3-5 business days, while express shipping ensures
        delivery within 1-2 business days.
      </p>
      <p>
        All orders are carefully packaged and fully insured. Track your shipment
        in real-time through our dedicated tracking portal.
      </p>
    </AccordionContent>
  )
}

function Content3() {
  return (
    <AccordionContent className='flex flex-col gap-4'>
      <p>
        We stand behind our products with a comprehensive 30-day return policy.
        If you&apos;re not completely satisfied, simply return the item in its
        original condition.
      </p>
      <p>
        Our hassle-free return process includes free return shipping and full
        refunds processed within 48 hours of receiving the returned item.
      </p>
    </AccordionContent>
  )
}

function CustomTriggerIndicator() {
  return (
    <div className='relative -mt-1 size-3 shrink-0 self-center transition-transform duration-300 group-data-[state=open]:rotate-180'>
      <span className='absolute left-1/2 block h-3 w-0.5 -translate-x-1/2 bg-current transition-transform duration-300 group-data-[state=open]:rotate-90'></span>
      <span className='absolute top-1/2 block h-0.5 w-3 -translate-y-1/2 bg-current'></span>
    </div>
  )
}

function AccordionDemo({
  disabledMd = false,
  disabledLg = false,
  defaultValue = [],
  type = 'multiple',
  className,
  accordionClassName,
}: {
  disabledMd?: boolean
  disabledLg?: boolean
  defaultValue?: string | string[]
  type?: 'single' | 'multiple'
  className?: string
  accordionClassName?: string
}) {
  const accordionProps =
    type === 'single'
      ? {
          type: 'single' as const,
          defaultValue: Array.isArray(defaultValue)
            ? defaultValue[0]
            : defaultValue,
        }
      : {
          type: 'multiple' as const,
          defaultValue: Array.isArray(defaultValue)
            ? defaultValue
            : [defaultValue].filter(Boolean),
        }

  return (
    <div className={`min-h-svh w-[280px] p-4 sm:w-[360px] ${className}`}>
      <Accordion
        {...accordionProps}
        className={accordionClassName}
      >
        <AccordionItem
          value='item-1'
          disabledMd={disabledMd}
          disabledLg={disabledLg}
        >
          <AccordionTrigger>Product Information</AccordionTrigger>
          <Content1 />
        </AccordionItem>
        <AccordionItem
          value='item-2'
          disabledMd={disabledMd}
          disabledLg={disabledLg}
        >
          <AccordionTrigger>Shipping Details</AccordionTrigger>
          <Content2 />
        </AccordionItem>
        <AccordionItem
          value='item-3'
          disabledMd={disabledMd}
          disabledLg={disabledLg}
        >
          <AccordionTrigger>Return Policy</AccordionTrigger>
          <Content3 />
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export const Default: Story = {
  args: {
    defaultValue: [],
    type: 'multiple',
  },
  render: (args) => <AccordionDemo {...args} />,
}

export const OnlyOneSectionOpenAtATime: Story = {
  args: {
    defaultValue: 'item-1',
    type: 'single',
  },
  render: (args) => <AccordionDemo {...args} />,
}

export const ChosenSectionOpenedInitially: Story = {
  args: {
    defaultValue: ['item-2'],
    type: 'multiple',
  },
  render: (args) => <AccordionDemo {...args} />,
}

export const DisabledOnDesktopResolutions: Story = {
  args: {
    defaultValue: [],
    type: 'multiple',
    disabledMd: true,
    disabledLg: true,
  },
  render: (args) => (
    <AccordionDemo
      className='lg:w-auto'
      {...args}
      accordionClassName='lg:grid lg:grid-cols-3 gap-8 [&>div]:lg:border-b-0'
    />
  ),
}

export const CustomTriggerIndicatorExample: Story = {
  render: () => {
    return (
      <div className='min-h-svh w-[280px] p-4 sm:w-[360px]'>
        <Accordion type='multiple'>
          <AccordionItem value='item-1'>
            <AccordionTrigger withArrow={false}>
              <CustomTriggerIndicator />
              Product Information
            </AccordionTrigger>
            <Content1 />
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger withArrow={false}>
              <CustomTriggerIndicator />
              Shipping Details
            </AccordionTrigger>
            <Content2 />
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger withArrow={false}>
              <CustomTriggerIndicator />
              Return Policy
            </AccordionTrigger>
            <Content3 />
          </AccordionItem>
        </Accordion>
      </div>
    )
  },
}
