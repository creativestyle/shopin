import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DIALOG_TITLE = 'Order summary'

/** Overrides default modal sizing so the panel fills the viewport on all breakpoints. */
const dialogContentFullscreenClassName = cn(
  '!inset-0 !left-0 !right-0 !h-full !min-h-0 !w-full !max-w-none !translate-x-0 !translate-y-0 rounded-none',
  'md:!inset-0 md:!top-0 md:!left-0 md:!right-0 md:!h-full md:!max-h-full md:!max-w-none md:!translate-x-0 md:!translate-y-0 md:rounded-none',
  'md:data-[state=closed]:zoom-out-100 md:data-[state=open]:zoom-in-100'
)

const COPY = {
  lead: 'Review your items and delivery before you pay.',
  detail:
    'You can change quantities or remove lines from the basket before continuing. Promotions and taxes are confirmed at the next step.',
} as const

const SCROLL_INTRO =
  'Our checkout explains each charge before you confirm. Standard delivery times are estimates; carriers may update tracking after dispatch.'

function BodyDefault() {
  return (
    <>
      <DialogDescription>{COPY.lead}</DialogDescription>
      <p className='text-gray-500 not-last:mb-[1em]'>{COPY.detail}</p>
    </>
  )
}

function BodyScrollable() {
  return (
    <>
      <DialogDescription>{SCROLL_INTRO}</DialogDescription>
      <p className='text-gray-500 not-last:mb-[1em]'>
        If an item is out of stock after you pay, we refund that line and ship
        the rest. You will receive an email when the refund is processed.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        For large or bulky orders, the carrier may contact you to arrange
        delivery. Someone over eighteen must sign for restricted goods where the
        law requires it.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        International orders may be subject to import duties and taxes collected
        by customs; those charges are your responsibility unless we state
        otherwise on the product page.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Need to change the delivery address? Cancel before dispatch from your
        account order detail, or contact support with your order number if the
        option is no longer available.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Nominated-day and evening slots are offered where our carriers support
        them; rural postcodes may only receive weekday daytime delivery. We
        cannot guarantee a specific hour inside the window the carrier gives
        you.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Gift messages and discreet packaging options appear at checkout when the
        product allows them. Messages are printed on the packing slip unless you
        choose a gift receipt without prices.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Manufacturer warranties run from the date of delivery unless the product
        page states otherwise. Keep your proof of purchase; we may ask for
        photos or serial numbers before approving a repair or replacement.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Hazardous or flammable items cannot travel by air; those lines ship
        ground only and may take longer. If we split your order, you receive a
        tracking email for each parcel.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Packaging is designed to protect goods in transit. Where we offer a
        take-back or recycling programme, instructions are included in the box
        and summarised in your order confirmation.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        If you subscribe to repeat deliveries, the next charge date appears in
        your account. Skip, pause, or cancel before the billing cut-off shown
        for that shipment.
      </p>
      <p className='text-gray-500 not-last:mb-[1em]'>
        Questions about this order? Include your order number when you contact
        us so we can look up tracking, payments, and returns in one place.
      </p>
      <p className='text-gray-500'>{COPY.detail}</p>
    </>
  )
}

function DialogShowcaseRow({
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

function OutsideControlledDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent>
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>{DIALOG_TITLE}</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          <DialogBody>
            <BodyDefault />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
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
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <DialogShowcaseRow
        title='Body only'
        description='No visible header or footer; title is available to assistive tech only.'
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button aria-label='Open dialog with body only'>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <VisuallyHidden>
              <DialogHeader>
                <DialogTitle>{DIALOG_TITLE}</DialogTitle>
              </DialogHeader>
            </VisuallyHidden>
            <DialogBody>
              <BodyDefault />
            </DialogBody>
          </DialogContent>
        </Dialog>
      </DialogShowcaseRow>

      <DialogShowcaseRow
        title='With header'
        description='Visible title; no footer actions.'
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button aria-label='Open dialog with header'>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{DIALOG_TITLE}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <BodyDefault />
            </DialogBody>
          </DialogContent>
        </Dialog>
      </DialogShowcaseRow>

      <DialogShowcaseRow
        title='Header and footer'
        description='Title plus a single secondary action in the footer.'
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button aria-label='Open dialog with header and footer'>
              Open
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{DIALOG_TITLE}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <BodyDefault />
            </DialogBody>
            <DialogFooter>
              <Button variant='secondary'>View basket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogShowcaseRow>

      <DialogShowcaseRow
        title='Footer close only'
        description='Chrome close hidden; dismissal via footer button.'
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button aria-label='Open dialog with footer close button'>
              Open
            </Button>
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>{DIALOG_TITLE}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <BodyDefault />
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='secondary'>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogShowcaseRow>

      <DialogShowcaseRow
        title='Scrollable content'
        description='Long copy with Cancel and Confirm in the footer.'
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button aria-label='Open scrollable dialog'>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delivery & import information</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <BodyScrollable />
            </DialogBody>
            <DialogFooter>
              <div className='flex w-full gap-4 max-md:flex-col md:justify-end'>
                <Button variant='secondary'>Cancel</Button>
                <Button>Confirm</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogShowcaseRow>
    </div>
  ),
}

export const InitiallyOpen: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button aria-label='Open dialog (also starts open in Storybook)'>
          Open
        </Button>
      </DialogTrigger>
      <DialogContent>
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{DIALOG_TITLE}</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>
        <DialogBody>
          <BodyDefault />
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
}

export const ControlledFromAnywhere: Story = {
  render: () => <OutsideControlledDialog />,
}

export const RichContentFullscreen: Story = {
  name: 'Rich content (fullscreen)',
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div className='flex min-h-screen w-full items-center justify-center p-6'>
      <Dialog>
        <DialogTrigger asChild>
          <Button aria-label='Open fullscreen dialog with rich scrollable content'>
            Open
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogContentFullscreenClassName}>
          <DialogHeader>
            <DialogTitle>Delivery & import information</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <BodyScrollable />
          </DialogBody>
          <DialogFooter>
            <div className='flex w-full gap-4 max-md:flex-col md:justify-end'>
              <Button variant='secondary'>Cancel</Button>
              <Button>Confirm</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
}
