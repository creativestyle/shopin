import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import DeliveryIcon from '@/public/icons/delivery-truck.svg'
import PaymentIcon from '@/public/icons/payment.svg'
import CheckmarkIcon from '@/public/icons/checkmark.svg'

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

const richPanels = [
  {
    value: 'description',
    label: 'Description',
    html: `
      <h3 style="font-size:1.125rem;font-weight:700;margin-bottom:0.5rem">Classic Merino Wool Sweater</h3>
      <p style="margin-bottom:0.75rem;color:#4b5563;font-size:0.875rem">
        Crafted from <strong>100% extra-fine merino wool</strong>, this sweater offers exceptional
        softness and natural temperature regulation. The relaxed silhouette suits both casual and
        smart-casual occasions.
      </p>
      <p style="color:#4b5563;font-size:0.875rem">
        Available in a range of seasonal colours. Hand wash cold or dry clean for best results.
        Laid flat to dry to maintain shape.
      </p>
    `,
  },
  {
    value: 'specs',
    label: 'Specifications',
    html: `
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem">Technical details</h3>
      <table style="width:100%;font-size:0.875rem;border-collapse:collapse">
        <tbody>
          <tr style="border-bottom:1px solid #e5e7eb">
            <td style="padding:0.5rem 1rem 0.5rem 0;color:#6b7280;font-weight:500">Material</td>
            <td style="padding:0.5rem 0">100% extra-fine merino wool</td>
          </tr>
          <tr style="border-bottom:1px solid #e5e7eb">
            <td style="padding:0.5rem 1rem 0.5rem 0;color:#6b7280;font-weight:500">Fit</td>
            <td style="padding:0.5rem 0">Relaxed</td>
          </tr>
          <tr style="border-bottom:1px solid #e5e7eb">
            <td style="padding:0.5rem 1rem 0.5rem 0;color:#6b7280;font-weight:500">Care</td>
            <td style="padding:0.5rem 0">Hand wash 30 °C / Dry clean</td>
          </tr>
          <tr>
            <td style="padding:0.5rem 1rem 0.5rem 0;color:#6b7280;font-weight:500">Origin</td>
            <td style="padding:0.5rem 0">Made in Portugal</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    value: 'returns',
    label: 'Returns',
    html: `
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">Return &amp; exchange policy</h3>
      <p style="margin-bottom:0.75rem;color:#4b5563;font-size:0.875rem">
        We accept returns within <strong>30 days</strong> of delivery. Items must be unworn,
        unwashed, and have original tags attached.
      </p>
      <ul style="padding-left:1.25rem;list-style:disc;font-size:0.875rem;color:#374151;line-height:1.75">
        <li>Free returns for orders over €50</li>
        <li>Exchange processed within 3 business days</li>
        <li>Refund issued to original payment method</li>
      </ul>
    `,
  },
]

export const RichContent: Story = {
  name: 'Rich content panels',
  render: () => (
    <div className='w-full max-w-[680px]'>
      <Tabs
        defaultValue='description'
        className='w-full'
      >
        <TabsList>
          {richPanels.map((panel) => (
            <TabsTrigger
              key={panel.value}
              value={panel.value}
            >
              {panel.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {richPanels.map((panel) => (
          <TabsContent
            key={panel.value}
            value={panel.value}
          >
            <div
              className='rounded-lg bg-gray-100 p-4'
              dangerouslySetInnerHTML={{ __html: panel.html }}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  ),
}

export const WithIcons: Story = {
  name: 'Checkout steps with icons',
  render: () => (
    <div className='w-full max-w-[680px]'>
      <Tabs
        defaultValue='delivery'
        className='w-full'
      >
        <TabsList>
          <TabsTrigger value='delivery'>
            <DeliveryIcon className='size-4 shrink-0' />
            Delivery
          </TabsTrigger>
          <TabsTrigger value='payment'>
            <PaymentIcon className='size-4 shrink-0' />
            Payment
          </TabsTrigger>
          <TabsTrigger value='review'>
            <CheckmarkIcon className='size-4 shrink-0' />
            Review
          </TabsTrigger>
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
