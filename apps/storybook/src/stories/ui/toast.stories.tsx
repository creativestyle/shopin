import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Toast, addToast, dismissToastById } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  argTypes: {
    id: {
      control: { type: 'text' },
      description:
        'Unique identifier for the toast. Used for dismissing specific toasts.',
    },
    type: {
      control: { type: 'select' },
      options: ['info', 'infoLight', 'success', 'error', 'warning'],
      description:
        'Visual style variant of the toast. Determines the icon and color scheme.',
    },
    critical: {
      control: { type: 'boolean' },
      description:
        'Accessibility prop. If true, the toast will be announced immediately by screen readers (using `aria-live="assertive"`). Otherwise, it will be announced politely (using `aria-live="polite"`).',
    },
    withIcon: {
      control: { type: 'boolean' },
      description:
        'Whether to display an icon in the toast. Icons are automatically chosen based on the toast type.',
    },
    withCloseButton: {
      control: { type: 'boolean' },
      description:
        'Whether to show a close button that allows users to manually dismiss the toast.',
    },
    duration: {
      control: { type: 'number' },
      description:
        'Duration in milliseconds. This setting only works with popping up Toasts.',
    },
    children: {
      control: { type: 'text' },
      description:
        'The content to display inside the toast. Can be text or JSX elements.',
    },
    onDismiss: {
      action: 'dismissed',
      description:
        'Action called when Toast is manually dismissed. This only works with popping up Toasts.',
    },
    onAutoClose: {
      action: 'auto-closed',
      description:
        'Action called when Toast is automatically closed after {duration} time has passed. This only works with popping up Toasts.',
    },
  },
  args: {
    id: '1',
    type: 'info',
    critical: false,
    withIcon: true,
    withCloseButton: false,
    duration: 7000,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const bg = context.args.type === 'infoLight' ? '#f5f5f5' : '#fff'

      return (
        <div
          style={{
            backgroundColor: bg,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Story />
        </div>
      )
    },
  ],
  render: (args) => {
    let text = ''

    switch (args.type) {
      case 'infoLight':
        text = 'Pickup orders are paid in store when you collect your items.'
        break
      case 'error':
        text = 'Something went wrong. Please try again.'
        break
      case 'success':
        text = 'The item was added to your cart.'
        break
      case 'warning':
        text = 'Your session expires in 5 minutes. Please save your changes.'
        break
      default:
        text = 'Please provide your billing address and contact details.'
    }

    return <Toast {...args}>{text}</Toast>
  },
}

type ToastScenario = {
  id?: string | number
  title: string
  description: string
  config: {
    id?: string | number
    type?: 'info' | 'infoLight' | 'success' | 'error' | 'warning'
    children: React.ReactNode
    critical?: boolean
    withCloseButton?: boolean
    withIcon?: boolean
    duration?: number
  }
  trackState?: boolean
}

function ToastShowcaseRow({
  title,
  description,
  isOpen,
  onShow,
  onDismiss,
  hideDismiss = false,
}: {
  title: string
  description: string
  isOpen?: boolean
  onShow: () => void
  onDismiss?: () => void
  hideDismiss?: boolean
}) {
  return (
    <div className='flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6'>
      <div className='min-w-0 flex-1'>
        <h3 className='font-medium text-gray-950'>{title}</h3>
        <p className='mt-1 text-sm text-gray-500'>{description}</p>
      </div>
      <div className='flex items-center gap-3'>
        <Button
          variant='secondary'
          onClick={onShow}
        >
          Show
        </Button>
        {!hideDismiss && onDismiss ? (
          <Button
            variant='tertiary'
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        ) : null}
        {typeof isOpen === 'boolean' ? (
          <Badge variant={isOpen ? 'green' : 'gray'}>
            {isOpen ? 'Open' : 'Closed'}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}

const scenarios: ToastScenario[] = [
  {
    id: 1,
    title: 'Info toast',
    description: 'General account guidance.',
    config: {
      id: 1,
      type: 'info',
      children: 'Please provide your billing address details.',
    },
    trackState: true,
  },
  {
    id: 2,
    title: 'Info light toast',
    description: 'Checkout-specific neutral hint.',
    config: {
      id: 2,
      type: 'infoLight',
      children: 'Please provide your shipping address details.',
    },
    trackState: true,
  },
  {
    id: 3,
    title: 'Success toast',
    description: 'Confirms successful add-to-cart action.',
    config: {
      id: 3,
      type: 'success',
      children: (
        <>
          <Link href='#'>Product</Link> added to cart.
        </>
      ),
    },
    trackState: true,
  },
  {
    id: 4,
    title: 'Error toast',
    description: 'Critical issue that needs immediate attention.',
    config: {
      id: 4,
      type: 'error',
      children: "Sorry, you can't buy more than 15 units of this product.",
      critical: true,
      withCloseButton: true,
    },
    trackState: true,
  },
  {
    id: 5,
    title: 'Warning toast',
    description: 'Action needed to proceed.',
    config: {
      id: 5,
      type: 'warning',
      children: 'Please update your payment details to continue.',
    },
    trackState: true,
  },
  {
    id: 6,
    title: 'Critical announcement',
    description: 'Announced immediately for assistive technologies.',
    config: {
      id: 6,
      critical: true,
      children: 'This message is announced immediately by screen readers.',
    },
    trackState: true,
  },
  {
    id: 7,
    title: 'Long-duration toast',
    description: 'Stays visible for 15 seconds.',
    config: {
      id: 7,
      duration: 15000,
      children: 'This toast will close automatically after 15 seconds.',
    },
    trackState: true,
  },
  {
    id: 8,
    title: 'Toast without icon',
    description: 'Custom content with no leading icon.',
    config: {
      id: 8,
      withIcon: false,
      children: (
        <>
          Custom toast without icon and with{' '}
          <span className='underline'>JSX</span> content.
        </>
      ),
    },
    trackState: true,
  },
  {
    title: 'Multiple toasts',
    description: 'Can be triggered repeatedly with dynamic IDs.',
    config: {
      children: 'This toast can be shown multiple times with unique IDs.',
    },
    trackState: false,
  },
]

const ToasterShowcaseComponent = () => {
  const [openedToastsIds, setOpenedToastsIds] = useState<(string | number)[]>(
    []
  )

  function isOpen(id: string | number) {
    return openedToastsIds.includes(id)
  }

  const handleToastAdd = (toastConfig: {
    id?: string | number
    type?: 'info' | 'infoLight' | 'success' | 'error' | 'warning'
    children: React.ReactNode
    critical?: boolean
    withCloseButton?: boolean
    withIcon?: boolean
    duration?: number
  }) => {
    const id =
      toastConfig.id ||
      `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    setOpenedToastsIds((prev) => [...prev, id])

    addToast({
      ...toastConfig,
      id,
      onDismiss: () => {
        setOpenedToastsIds((prev) => prev.filter((toastId) => toastId !== id))
      },
      onAutoClose: () => {
        setOpenedToastsIds((prev) => prev.filter((toastId) => toastId !== id))
      },
    })
  }

  const handleToastDismiss = (id: string | number) => {
    dismissToastById(id)
    setOpenedToastsIds((prev) => prev.filter((toastId) => toastId !== id))
  }

  return (
    <div className='flex flex-col gap-4 pb-34'>
      {scenarios.map((scenario, index) => (
        <ToastShowcaseRow
          key={`${scenario.title}-${index}`}
          title={scenario.title}
          description={scenario.description}
          isOpen={
            scenario.trackState && scenario.id ? isOpen(scenario.id) : undefined
          }
          onShow={() => handleToastAdd(scenario.config)}
          onDismiss={
            scenario.trackState && scenario.id
              ? () => handleToastDismiss(scenario.id as string | number)
              : undefined
          }
          hideDismiss={!scenario.trackState}
        />
      ))}
    </div>
  )
}

export const ToasterShowcase: Story = {
  render: () => <ToasterShowcaseComponent />,
}
