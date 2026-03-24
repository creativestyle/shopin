import type { Meta, StoryObj } from '@storybook/react'
import {
  SwitchTabs,
  SwitchTabsList,
  SwitchTabsTrigger,
  SwitchTabsContent,
} from '@/components/ui/switch-tabs'

type SegmentConfig = {
  value: string
  trigger: string
  title: string
  description: string
  detailsTitle: string
  detailsText: string
  benefitsTitle: string
  benefits: string[]
}

const checkoutSegments: SegmentConfig[] = [
  {
    value: 'delivery',
    trigger: 'Delivery',
    title: 'Delivery options',
    description:
      'Choose how and when your order should arrive at your address.',
    detailsTitle: 'Scheduling',
    detailsText: 'Select standard, express, or nominated-day delivery windows.',
    benefitsTitle: 'What is included',
    benefits: [
      'Live tracking updates',
      'Delivery window preferences',
      'Safe-place instructions',
      'Address validation',
    ],
  },
  {
    value: 'payment',
    trigger: 'Payment',
    title: 'Payment methods',
    description:
      'Pick the payment flow that best fits your order and billing needs.',
    detailsTitle: 'Supported methods',
    detailsText:
      'Cards, bank transfer, and invoice are available where supported.',
    benefitsTitle: 'What is included',
    benefits: [
      'Secure card processing',
      'Saved payment tokens',
      'Instant payment confirmation',
      'Downloadable invoices',
    ],
  },
  {
    value: 'returns',
    trigger: 'Returns',
    title: 'Returns and refunds',
    description:
      'Review return eligibility, deadlines, and refund processing timelines.',
    detailsTitle: 'Return policy',
    detailsText:
      'Start a return from order history and print your return label.',
    benefitsTitle: 'What is included',
    benefits: [
      'Self-service return flow',
      'Status updates by email',
      'Refund to original payment method',
      'Exchange guidance',
    ],
  },
]

function SegmentPanel({ segment }: { segment: SegmentConfig }) {
  return (
    <div className='rounded-lg bg-gray-100 p-6'>
      <h3 className='mb-3 text-xl font-semibold'>{segment.title}</h3>
      <p className='mb-4 text-gray-600'>{segment.description}</p>
      <div className='space-y-4'>
        <div className='rounded-lg bg-white p-4 shadow-sm'>
          <h4 className='mb-2 font-medium text-gray-900'>
            {segment.detailsTitle}
          </h4>
          <p className='text-sm text-gray-600'>{segment.detailsText}</p>
        </div>
        <div className='rounded-lg bg-white p-4 shadow-sm'>
          <h4 className='mb-2 font-medium text-gray-900'>
            {segment.benefitsTitle}
          </h4>
          <ul className='space-y-1 text-sm text-gray-600'>
            {segment.benefits.map((benefit) => (
              <li key={benefit}>- {benefit}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

const meta = {
  title: 'UI/SwitchTabs',
  component: SwitchTabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
    },
  },
} satisfies Meta<typeof SwitchTabs>

export default meta
type Story = StoryObj<typeof meta>

export const CustomerType: Story = {
  name: 'Checkout context',
  render: () => (
    <div className='max-w-[600px]'>
      <SwitchTabs
        defaultValue='delivery'
        className='w-full'
      >
        <SwitchTabsList>
          {checkoutSegments.map((segment) => (
            <SwitchTabsTrigger
              key={segment.value}
              value={segment.value}
            >
              {segment.trigger}
            </SwitchTabsTrigger>
          ))}
        </SwitchTabsList>
        {checkoutSegments.map((segment) => (
          <SwitchTabsContent
            key={segment.value}
            value={segment.value}
          >
            <SegmentPanel segment={segment} />
          </SwitchTabsContent>
        ))}
      </SwitchTabs>
    </div>
  ),
}
