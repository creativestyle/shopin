import type { Meta, StoryObj } from '@storybook/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className='w-full max-w-md'>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    scheme: {
      control: { type: 'select' },
      options: ['white', 'gray', 'primary', 'success', 'info'],
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>
function PrimaryLayout() {
  return (
    <div className='space-y-4 p-2 text-white'>
      <span className='inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase'>
        Limited offer
      </span>
      <h2 className='text-2xl leading-tight font-semibold'>Weekend deal</h2>
      <p className='text-white/90'>
        Get 15% off selected outerwear today only. Discount is applied at
        checkout automatically.
      </p>
      <Button
        variant='secondary'
        scheme='white'
      >
        Shop offer
      </Button>
    </div>
  )
}

function SuccessLayout() {
  return (
    <div className='space-y-4 p-2 text-white'>
      <h2 className='text-2xl leading-tight font-semibold'>
        Payment successful
      </h2>
      <ul className='list-disc space-y-1 pl-5 text-sm text-white/90'>
        <li>Order: #SO-20341</li>
        <li>Method: Visa ending 2913</li>
        <li>Status: Preparing shipment</li>
      </ul>
      <Button
        variant='secondary'
        scheme='white'
      >
        View receipt
      </Button>
    </div>
  )
}

function InfoLayout() {
  return (
    <div className='space-y-4 p-2 text-white'>
      <h2 className='text-2xl leading-tight font-semibold'>
        Delivery reminder
      </h2>
      <p className='text-white/90'>
        Your parcel arrives tomorrow between 10:00 and 14:00. Update delivery
        instructions if needed.
      </p>
      <div className='flex gap-2'>
        <Button
          variant='secondary'
          scheme='white'
        >
          Manage delivery
        </Button>
        <Button
          variant='tertiary'
          scheme='white'
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}

function GrayLayout() {
  return (
    <div className='space-y-4 p-2 text-gray-950'>
      <h2 className='text-xl font-semibold'>Product summary</h2>
      <p className='text-gray-700'>
        Lightweight Rain Jacket with breathable lining and taped seams for wet
        weather.
      </p>
      <div className='flex items-center justify-between gap-4'>
        <span className='text-lg font-bold'>$89.00</span>
        <Button scheme='black'>Add to cart</Button>
      </div>
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <Card scheme='white'>
      <div className='space-y-4 p-2 text-gray-950'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-xl font-semibold'>Order #SO-20341</h2>
          <span className='rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 uppercase'>
            Confirmed
          </span>
        </div>
        <p className='text-gray-700'>
          Your order is confirmed and moves to fulfillment. We will send
          tracking details as soon as the parcel leaves the warehouse.
        </p>
        <div className='flex gap-2'>
          <Button>View order</Button>
          <Button
            variant='secondary'
            scheme='black'
          >
            Download invoice
          </Button>
        </div>
      </div>
    </Card>
  ),
  args: {
    scheme: 'white',
  },
}

export const Primary: Story = {
  args: {
    scheme: 'primary',
  },
  render: () => (
    <Card scheme='primary'>
      <PrimaryLayout />
    </Card>
  ),
}

export const Success: Story = {
  args: {
    scheme: 'success',
  },
  render: () => (
    <Card scheme='success'>
      <SuccessLayout />
    </Card>
  ),
}

export const Info: Story = {
  args: {
    scheme: 'info',
  },
  render: () => (
    <Card scheme='info'>
      <InfoLayout />
    </Card>
  ),
}

export const Gray: Story = {
  args: {
    scheme: 'gray',
  },
  render: () => (
    <Card scheme='gray'>
      <GrayLayout />
    </Card>
  ),
}
