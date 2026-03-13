import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../dialog'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'common.close': 'Close',
      'scrollableDialogContent': 'Scrollable dialog content',
    }
    return translations[key] || key
  },
}))

describe('Dialog', () => {
  it('renders dialog trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    )

    expect(
      screen.getByRole('button', { name: 'Open Dialog' })
    ).toBeInTheDocument()
  })

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup()

    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByRole('button', { name: 'Open Dialog' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
  })

  it('renders dialog content with all components', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Title</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>Test Description</DialogDescription>
            <p>Test content</p>
          </DialogBody>
          <DialogFooter>
            <DialogClose>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
    expect(screen.getByText(/./, { selector: '.sr-only' })).toBeInTheDocument()
  })

  it('renders close button by default', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    expect(screen.getByText(/./, { selector: '.sr-only' })).toBeInTheDocument()
  })

  it('does not render close button when showCloseButton is false', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    expect(
      screen.queryByText(/./, { selector: '.sr-only' })
    ).not.toBeInTheDocument()
  })

  it('closes dialog when close button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <Dialog>
        <DialogTrigger data-testid='dialog-trigger'>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByTestId('dialog-trigger'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const closeButton = screen
      .getByText(/./, { selector: '.sr-only' })
      .closest('button')
    expect(closeButton).toBeInTheDocument()
    await user.click(closeButton!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes dialog when escape key is pressed', async () => {
    const user = userEvent.setup()

    render(
      <Dialog>
        <DialogTrigger data-testid='dialog-trigger'>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Test description</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByTestId('dialog-trigger'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
