import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Toast, addToast, dismissToastById } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge/badge'
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
        text =
          'Die Zahlung der im LANDI Laden abzuholenden Artikel erfolgt bei Abholung im Laden.'
        break
      case 'error':
        text = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
        break
      case 'success':
        text = 'Artikel wurde erfolgreich zum Warenkorb hinzugefügt.'
        break
      case 'warning':
        text =
          'Ihre Sitzung läuft in 5 Minuten ab. Bitte speichern Sie Ihre Änderungen.'
        break
      default:
        text = 'Bitte geben Sie Ihre Rechnungsadresse und Kontaktdaten an.'
    }

    return <Toast {...args}>{text}</Toast>
  },
}

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
    <div className='relative overflow-x-auto pb-34'>
      <table className='w-full text-left text-sm text-gray-500'>
        <thead className='bg-gray-100 text-xs uppercase'>
          <tr>
            <th
              scope='col'
              className='w-[70%] px-6 py-3'
            >
              Type
            </th>
            <th
              scope='col'
              className='px-6 py-3'
            >
              Actions
            </th>
            <th
              scope='col'
              className='px-6 py-3'
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className='border-b border-gray-200 bg-white'>
            <th
              scope='row'
              className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
            >
              Info toast (default)
            </th>
            <td className='px-6 py-4'>
              <div className='flex gap-3'>
                <button
                  onClick={() =>
                    handleToastAdd({
                      id: 1,
                      type: 'info',
                      children: 'Please provide your billing address details.',
                    })
                  }
                  aria-label='Show info toast'
                >
                  Show
                </button>
                <span>|</span>
                <button
                  onClick={() => handleToastDismiss(1)}
                  aria-label='Dismiss info toast'
                >
                  Dismiss
                </button>
              </div>
            </td>
            <td className='px-6 py-4'>
              <Badge variant={isOpen(1) ? 'green' : 'gray'}>
                {isOpen(1) ? 'Open' : 'Closed'}
              </Badge>
            </td>
          </tr>
          <tr className='border-b border-gray-200 bg-white'>
            <th
              scope='row'
              className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
            >
              Info toast (checkout layout)
            </th>
            <td className='px-6 py-4'>
              <div className='flex gap-3'>
                <button
                  onClick={() =>
                    handleToastAdd({
                      id: 2,
                      type: 'infoLight',
                      children: 'Please provide your shipping address details.',
                    })
                  }
                  aria-label='Show checkout info toast'
                >
                  Show
                </button>
                <span>|</span>
                <button
                  onClick={() => handleToastDismiss(2)}
                  aria-label='Dismiss checkout info toast'
                >
                  Dismiss
                </button>
              </div>
            </td>
            <td className='px-6 py-4'>
              <Badge variant={isOpen(2) ? 'green' : 'gray'}>
                {isOpen(2) ? 'Open' : 'Closed'}
              </Badge>
            </td>
          </tr>
          <tr className='border-b border-gray-200 bg-white'>
            <th
              scope='row'
              className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
            >
              Success toast
            </th>
            <td className='px-6 py-4'>
              <div className='flex gap-3'>
                <button
                  onClick={() =>
                    handleToastAdd({
                      id: 3,
                      type: 'success',
                      children: (
                        <>
                          <Link href='#'>A product</Link> was successfully added
                          to your cart.
                        </>
                      ),
                    })
                  }
                  aria-label='Show success toast'
                >
                  Show
                </button>
                <span>|</span>
                <button
                  onClick={() => handleToastDismiss(3)}
                  aria-label='Dismiss success toast'
                >
                  Dismiss
                </button>
              </div>
            </td>
            <td className='px-6 py-4'>
              <Badge variant={isOpen(3) ? 'green' : 'gray'}>
                {isOpen(3) ? 'Open' : 'Closed'}
              </Badge>
            </td>
          </tr>
          <tr className='border-b border-gray-200 bg-white'>
            <th
              scope='row'
              className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
            >
              Error toast
            </th>
            <td className='px-6 py-4'>
              <div className='flex gap-3'>
                <button
                  onClick={() =>
                    handleToastAdd({
                      id: 4,
                      type: 'error',
                      children:
                        "Sorry, you can't buy more than 15 pieces of this product.",
                      critical: true,
                      withCloseButton: true,
                    })
                  }
                  aria-label='Show error toast'
                >
                  Show
                </button>
                <span>|</span>
                <button
                  onClick={() => handleToastDismiss(4)}
                  aria-label='Dismiss error toast'
                >
                  Dismiss
                </button>
              </div>
            </td>
            <td className='px-6 py-4'>
              <Badge variant={isOpen(4) ? 'green' : 'gray'}>
                {isOpen(4) ? 'Open' : 'Closed'}
              </Badge>
            </td>
          </tr>
          <tr className='border-b border-gray-200 bg-white'>
            <th
              scope='row'
              className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
            >
              Warning toast
            </th>
            <td className='px-6 py-4'>
              <div className='flex gap-3'>
                <button
                  onClick={() =>
                    handleToastAdd({
                      id: 5,
                      type: 'warning',
                      children:
                        'Please update your payment details in order to continue.',
                    })
                  }
                  aria-label='Show warning toast'
                >
                  Show
                </button>
                <span>|</span>
                <button
                  onClick={() => handleToastDismiss(5)}
                  aria-label='Dismiss warning toast'
                >
                  Dismiss
                </button>
              </div>
            </td>
            <td className='px-6 py-4'>
              <Badge variant={isOpen(5) ? 'green' : 'gray'}>
                {isOpen(5) ? 'Open' : 'Closed'}
              </Badge>
            </td>
          </tr>
          <tr className='border-b border-gray-200 bg-white'>
            <th
              scope='row'
              className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
            >
              Critically important toast
            </th>
            <td className='px-6 py-4'>
              <div className='flex gap-3'>
                <button
                  onClick={() =>
                    handleToastAdd({
                      id: 6,
                      critical: true,
                      children:
                        'I will be announced immediately by screen reader.',
                    })
                  }
                  aria-label='Show critical toast'
                >
                  Show
                </button>
                <span>|</span>
                <button
                  onClick={() => handleToastDismiss(6)}
                  aria-label='Dismiss critical toast'
                >
                  Dismiss
                </button>
              </div>
            </td>
            <td className='px-6 py-4'>
              <Badge variant={isOpen(6) ? 'green' : 'gray'}>
                {isOpen(6) ? 'Open' : 'Closed'}
              </Badge>
            </td>
          </tr>
          <tr className='border-b border-gray-200 bg-white'>
            <th
              scope='row'
              className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
            >
              Longtime displayed toast
            </th>
            <td className='px-6 py-4'>
              <div className='flex gap-3'>
                <button
                  onClick={() =>
                    handleToastAdd({
                      id: 7,
                      duration: 15000,
                      children: 'I will be removed after 15 seconds.',
                    })
                  }
                  aria-label='Show longtime displayed toast'
                >
                  Show
                </button>
                <span>|</span>
                <button
                  onClick={() => handleToastDismiss(7)}
                  aria-label='Dismiss longtime displayed toast'
                >
                  Dismiss
                </button>
              </div>
            </td>
            <td className='px-6 py-4'>
              <Badge variant={isOpen(7) ? 'green' : 'gray'}>
                {isOpen(7) ? 'Open' : 'Closed'}
              </Badge>
            </td>
          </tr>
          <tr className='border-b border-gray-200 bg-white'>
            <th
              scope='row'
              className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
            >
              No icon toast
            </th>
            <td className='px-6 py-4'>
              <div className='flex gap-3'>
                <button
                  onClick={() =>
                    handleToastAdd({
                      id: 8,
                      withIcon: false,
                      children: (
                        <>
                          I could be also displayed without an icon and with{' '}
                          <span className='underline'>JSX</span> content
                        </>
                      ),
                    })
                  }
                  aria-label='Show no icon toast'
                >
                  Show
                </button>
                <span>|</span>
                <button
                  onClick={() => handleToastDismiss(8)}
                  aria-label='Dismiss no icon toast'
                >
                  Dismiss
                </button>
              </div>
            </td>
            <td className='px-6 py-4'>
              <Badge variant={isOpen(8) ? 'green' : 'gray'}>
                {isOpen(8) ? 'Open' : 'Closed'}
              </Badge>
            </td>
          </tr>
          <tr className='border-b border-gray-200 bg-white'>
            <th
              scope='row'
              className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
            >
              Multiple toasts (open me multiple times)
            </th>
            <td className='px-6 py-4'>
              <div className='flex gap-3'>
                <button
                  onClick={() =>
                    handleToastAdd({
                      children:
                        'I can be displayed multiple times, because I have dynamic ID.',
                    })
                  }
                  aria-label='Show multiple toasts'
                >
                  Show
                </button>
              </div>
            </td>
            <td
              className='px-6 py-4'
              aria-label='No status for multiple toasts'
            ></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export const ToasterShowcase: Story = {
  render: () => <ToasterShowcaseComponent />,
}
