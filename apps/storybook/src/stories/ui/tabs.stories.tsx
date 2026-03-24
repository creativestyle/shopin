import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

type TabItem = {
  value: string
  label: string
  title: string
  description: string
  secondary?: string
  points: string[]
}

/** Checkout step tabs: one realistic flow, three panels. */
const checkoutSteps: TabItem[] = [
  {
    value: 'delivery',
    label: 'Delivery',
    title: 'Delivery method',
    description:
      'Pick a service level and confirm where we should deliver. Cut-off times apply for express and same-day options.',
    secondary:
      'You can save multiple addresses in your account and set a default for future orders. Rural or island postcodes may add one extra day to the estimate shown at checkout.',
    points: [
      'Standard — 2-4 business days, included when your basket meets the free-shipping threshold',
      'Express — next business day if you order before the daily cut-off (shown in the basket)',
      'Pickup point — collect from a nearby locker or store when the carrier supports it',
      'Delivery instructions — safe place, doorbell, or building access notes are passed to the carrier when possible',
    ],
  },
  {
    value: 'payment',
    label: 'Payment',
    title: 'Payment',
    description:
      'Choose how you want to pay. The total includes tax where applicable; you will see the final amount before you confirm.',
    secondary:
      'For bank transfer, your order moves to processing after we receive cleared funds. Invoice payment may require a verified business account.',
    points: [
      'Card — Visa, Mastercard, and other major brands; authorization is instant',
      'Bank transfer — use the reference shown after you place the order',
      'Invoice — available for eligible accounts; payment terms are stated on the invoice',
      'Saved cards — tokenized for faster checkout; you can remove them in account settings',
    ],
  },
  {
    value: 'review',
    label: 'Review',
    title: 'Review order',
    description:
      'Check that items, quantities, and delivery details are correct. Promotions and vouchers are applied before tax.',
    secondary:
      'By placing the order you agree to our terms of sale and privacy policy. You will receive an order confirmation by email with a link to track the shipment.',
    points: [
      'Line items — product names, options, and quantities',
      'Delivery address and method — edit in previous steps if something looks wrong',
      'Subtotal, shipping, tax, and order total',
      'Place order — submits payment or creates an invoice/bank-transfer instruction as selected',
    ],
  },
]

function TabPanel({ item }: { item: TabItem }) {
  return (
    <div className='rounded-lg bg-gray-100 p-4'>
      <h3 className='mb-2 text-lg font-semibold'>{item.title}</h3>
      <p className='mb-2 text-sm text-gray-600'>{item.description}</p>
      {item.secondary ? (
        <p className='mb-3 text-sm text-gray-600'>{item.secondary}</p>
      ) : null}
      <ul className='space-y-2 text-sm text-gray-700'>
        {item.points.map((point) => (
          <li key={point}>- {point}</li>
        ))}
      </ul>
    </div>
  )
}

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
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
    defaultValue: {
      control: { type: 'text' },
    },
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Checkout steps',
  render: () => (
    <div className='w-full max-w-[680px]'>
      <Tabs
        defaultValue='delivery'
        className='w-full'
      >
        <TabsList>
          {checkoutSteps.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {checkoutSteps.map((item) => (
          <TabsContent
            key={item.value}
            value={item.value}
          >
            <TabPanel item={item} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  ),
}
