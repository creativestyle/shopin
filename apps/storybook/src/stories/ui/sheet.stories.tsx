import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetBody,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const SHEET_TITLE = 'Order summary'

const COPY = {
  lead: 'Review your items and delivery details before checkout.',
  detail:
    'You can still update quantities, remove items, or choose another delivery method before confirming.',
} as const

const SCROLL_INTRO =
  'Delivery windows are estimates and can vary by carrier and postcode.'

function BodyDefault() {
  return (
    <>
      <SheetDescription>{COPY.lead}</SheetDescription>
      <p className='text-gray-500 not-last:mb-[1em]'>{COPY.detail}</p>
    </>
  )
}

function BodyScrollable() {
  return (
    <>
      <SheetDescription>{SCROLL_INTRO}</SheetDescription>
      <p className='text-gray-500 not-last:mb-[1em]'>
        If a line is unavailable after payment, we refund only that line and
        ship the remainder.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Split shipments may produce separate tracking numbers and delivery
        dates.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Restricted items can require an adult signature at the delivery address.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Customs fees for international deliveries are not included unless
        clearly stated at checkout.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        If your order contains pre-order items, we may hold the shipment until
        all items are available unless split delivery is selected.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Gift packaging is offered only for eligible products and can add one
        extra business day to dispatch time.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Delivery instructions are shared with the carrier when supported, but
        access codes and gate details are not guaranteed to be used.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Return windows begin on the confirmed delivery date shown in tracking.
        Final sale products are excluded from standard returns.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Refunds are issued to the original payment method after the return is
        received and inspected at our warehouse.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Subscription items renew automatically at the interval you choose.
        Upcoming renewals can be managed in your account settings.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Large-item deliveries may require a scheduled appointment; missed
        appointments can result in additional carrier charges.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        We send shipment updates by email and, where enabled, via SMS. Delivery
        updates may continue directly from the carrier after handoff.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Orders paid by bank transfer are processed after funds clear. Processing
        delays can shift dispatch to the next business day.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        For marketplace items, packaging and return addresses can differ by
        seller. The return label in your account always reflects the correct
        destination.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Exchange requests are handled as a return and a new order to maintain
        stock accuracy and payment security.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        During peak seasons, carrier scans can appear later than usual even when
        parcels are already in transit.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        If your package arrives visibly damaged, keep the outer packaging and
        contact support with photos so we can open a carrier claim.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Delivery to parcel lockers may have size and weight limits depending on
        local carrier networks.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Tax invoices are generated once payment is captured and can be
        downloaded from your order details page.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Replacement shipments for lost parcels require carrier confirmation
        before we can dispatch at no additional cost.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Some promotional codes exclude subscription products, gift cards, or
        already discounted bundles.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        If you change the delivery address after dispatch, rerouting options are
        subject to carrier availability in your region.
      </p>
      <p className='text-gray-500'>{COPY.detail}</p>
    </>
  )
}

function SheetShowcaseRow({
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

function SimpleSheet({
  side,
  showCloseButton = true,
  withFooter = false,
  customCloseFooter = false,
}: {
  side?: 'top' | 'right' | 'bottom' | 'left'
  showCloseButton?: boolean
  withFooter?: boolean
  customCloseFooter?: boolean
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open</Button>
      </SheetTrigger>
      <SheetContent
        side={side}
        showCloseButton={showCloseButton}
      >
        <SheetHeader>
          <SheetTitle>{SHEET_TITLE}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <BodyDefault />
        </SheetBody>
        {withFooter ? (
          <SheetFooter>
            {customCloseFooter ? (
              <SheetClose asChild>
                <Button
                  variant='secondary'
                  className='w-full'
                >
                  Close
                </Button>
              </SheetClose>
            ) : (
              <Button
                variant='secondary'
                className='w-full'
              >
                View basket
              </Button>
            )}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function OutsideControlledSheet() {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{SHEET_TITLE}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <BodyDefault />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  )
}

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
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
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <SheetShowcaseRow
        title='Body only'
        description='Simple sheet with title and body content.'
      >
        <SimpleSheet />
      </SheetShowcaseRow>

      <SheetShowcaseRow
        title='Header and footer'
        description='Includes a secondary footer action.'
      >
        <SimpleSheet withFooter />
      </SheetShowcaseRow>

      <SheetShowcaseRow
        title='Footer close only'
        description='Top-right close hidden; dismissal via footer button.'
      >
        <SimpleSheet
          showCloseButton={false}
          withFooter
          customCloseFooter
        />
      </SheetShowcaseRow>

      <SheetShowcaseRow
        title='Scrollable content'
        description='Long content with Cancel and Confirm actions.'
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Delivery information</SheetTitle>
            </SheetHeader>
            <SheetBody>
              <BodyScrollable />
            </SheetBody>
            <SheetFooter>
              <div className='flex w-full gap-4 max-md:flex-col md:justify-end'>
                <Button variant='secondary'>Cancel</Button>
                <Button>Confirm</Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </SheetShowcaseRow>

      <SheetShowcaseRow
        title='Left side sheet'
        description='Alternative side placement from the left.'
      >
        <SimpleSheet side='left' />
      </SheetShowcaseRow>
    </div>
  ),
}

export const InitiallyOpen: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger asChild>
        <Button>Open</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{SHEET_TITLE}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <BodyDefault />
        </SheetBody>
      </SheetContent>
    </Sheet>
  ),
}

export const ControlledFromAnywhere: Story = {
  render: () => <OutsideControlledSheet />,
}
