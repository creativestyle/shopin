import type { Meta, StoryObj } from '@storybook/react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type Item = { value: string; title: string; body: string }

const EXAMPLES = {
  support: [
    {
      value: 'item-1',
      title: 'Shipping & delivery',
      body: 'Standard delivery leaves our warehouse within one business day; express and nominated-day slots are offered at checkout when available. Carriers send tracking as soon as your parcel is scanned, so the first update may appear on the evening of dispatch.',
    },
    {
      value: 'item-2',
      title: 'Order status',
      body: 'Open your account order history or use the link in your confirmation email to follow each milestone. If the status has not moved for two working days, message us with the order number and we will chase the courier.',
    },
    {
      value: 'item-3',
      title: 'Returns & refunds',
      body: 'Unworn items with tags attached can be returned within thirty days for a refund or exchange. Include the prepaid return label from your parcel; refunds are issued within five working days after we receive the goods.',
    },
  ],
  billing: [
    {
      value: 'item-1',
      title: 'Payment methods',
      body: 'We accept major cards, digital wallets, and buy-now-pay-later where shown on the product and basket pages. Your payment method is authorised at checkout and captured when the order ships, unless you choose pay on collection.',
    },
    {
      value: 'item-2',
      title: 'Promotions & codes',
      body: 'Enter valid coupon codes in the basket before you pay; only one code applies per order unless the offer states otherwise. Sale and clearance prices apply while stock lasts and cannot be combined with other discounts.',
    },
    {
      value: 'item-3',
      title: 'Gift cards',
      body: 'Digital gift cards are emailed to the recipient and can be redeemed online using the code at checkout. Any unused balance remains on the card until the expiry date stated in the purchase confirmation.',
    },
  ],
  sizing: [
    {
      value: 'item-1',
      title: 'Size guide',
      body: 'Each product page lists measurements for that item; compare your body or garment dimensions to the table before you add to cart. Fit can vary by fabric and collection, so read the short fit note under the chart when you are between sizes.',
    },
    {
      value: 'item-2',
      title: 'Colour & images',
      body: 'We photograph products under controlled lighting, but screen settings can shift how colours look on your device. Swatch names describe the tone; if you need an exact match, order a fabric swatch where the product allows it.',
    },
    {
      value: 'item-3',
      title: 'Care instructions',
      body: 'Follow the care label inside the garment to protect fibres, prints, and trims over repeated washes. Wash similar colours together on a gentle cycle and avoid high heat in the dryer unless the label permits it.',
    },
  ],
  showroom: [
    {
      value: 'item-1',
      title: 'Store shopping',
      body: 'Visit our stores to try products in person and get advice from the team on fit and styling. Opening hours and services differ by location; check the store finder before you travel.',
    },
    {
      value: 'item-2',
      title: 'Click & collect',
      body: 'Choose a store at checkout and we will email you when the order is ready for pickup, usually within a few hours. Bring your confirmation and a valid ID; a nominated person can collect if you add their name to the order.',
    },
    {
      value: 'item-3',
      title: 'In-store services',
      body: 'Selected shops offer alterations, repairs, and personal shopping by appointment where listed on the store page. Turnaround times depend on the work required; staff will confirm the price and date before starting.',
    },
  ],
  plans: [
    {
      value: 'item-1',
      title: 'Loyalty tiers',
      body: 'Earn points on qualifying purchases and unlock tier benefits such as early access and birthday offers. Points appear in your account after the return window closes and expire on the schedule shown in the programme rules.',
    },
    {
      value: 'item-2',
      title: 'Subscriptions',
      body: 'Subscribe to repeat deliveries of consumables you use often and save on each shipment compared to one-off buys. Change frequency, skip a shipment, or cancel from your account before the next billing date.',
    },
    {
      value: 'item-3',
      title: 'Trade & B2B',
      body: 'Business customers can apply for a trade account with net terms and consolidated invoicing subject to approval. Minimum order values and carriage charges are quoted on your price list after the account is activated.',
    },
  ],
} satisfies Record<
  'support' | 'billing' | 'sizing' | 'showroom' | 'plans',
  Item[]
>

function Panel({ body }: { body: string }) {
  return (
    <AccordionContent>
      <p>{body}</p>
    </AccordionContent>
  )
}

function CustomIndicator() {
  return (
    <div className='relative -mt-1 size-3 shrink-0 self-center transition-transform duration-300 group-data-[state=open]:rotate-180'>
      <span className='absolute left-1/2 block h-3 w-0.5 -translate-x-1/2 bg-current transition-transform duration-300 group-data-[state=open]:rotate-90' />
      <span className='absolute top-1/2 block h-0.5 w-3 -translate-y-1/2 bg-current' />
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
  items = EXAMPLES.support,
}: {
  disabledMd?: boolean
  disabledLg?: boolean
  defaultValue?: string | string[]
  type?: 'single' | 'multiple'
  className?: string
  accordionClassName?: string
  items?: Item[]
}) {
  const rootProps =
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
    <div className={className}>
      <Accordion
        {...rootProps}
        className={accordionClassName}
      >
        {items.map((item) => (
          <AccordionItem
            key={item.value}
            value={item.value}
            disabledMd={disabledMd}
            disabledLg={disabledLg}
          >
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <Panel body={item.body} />
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

const meta = {
  title: 'UI/Accordion',
  component: AccordionDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
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
} satisfies Meta<typeof AccordionDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Multiple: Story = {
  args: { defaultValue: [], type: 'multiple' },
  render: (args) => <AccordionDemo {...args} />,
}

export const Single: Story = {
  args: { defaultValue: 'item-1', type: 'single' },
  render: (args) => (
    <AccordionDemo
      {...args}
      items={EXAMPLES.billing}
    />
  ),
}

export const DefaultOpen: Story = {
  args: { defaultValue: ['item-2'], type: 'multiple' },
  render: (args) => (
    <AccordionDemo
      {...args}
      items={EXAMPLES.sizing}
    />
  ),
}

export const ExpandedOnDesktop: Story = {
  args: {
    defaultValue: [],
    type: 'multiple',
    disabledMd: true,
    disabledLg: true,
  },
  render: (args) => (
    <AccordionDemo
      {...args}
      items={EXAMPLES.showroom}
      accordionClassName='lg:grid lg:grid-cols-3 gap-8 [&>div]:lg:border-b-0'
    />
  ),
}

export const CustomTrigger: Story = {
  args: { defaultValue: 'item-1', type: 'single' },
  render: ({ defaultValue, type }) => {
    const nodes = EXAMPLES.plans.map((item) => (
      <AccordionItem
        key={item.value}
        value={item.value}
      >
        <AccordionTrigger withArrow={false}>
          <CustomIndicator />
          {item.title}
        </AccordionTrigger>
        <Panel body={item.body} />
      </AccordionItem>
    ))

    return type === 'single' ? (
      <Accordion
        type='single'
        defaultValue={
          Array.isArray(defaultValue) ? defaultValue[0] : defaultValue
        }
      >
        {nodes}
      </Accordion>
    ) : (
      <Accordion
        type='multiple'
        defaultValue={
          Array.isArray(defaultValue)
            ? defaultValue
            : [defaultValue].filter(
                (v): v is string => typeof v === 'string' && v.length > 0
              )
        }
      >
        {nodes}
      </Accordion>
    )
  },
}
