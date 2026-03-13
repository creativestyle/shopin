import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '../sheet'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'common.close': 'Close',
      'common.homepage': 'Home',
      'common.search': 'Search',
    }
    return translations[key] || key
  },
}))

describe('Sheet', () => {
  it('renders sheet trigger', () => {
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
      </Sheet>
    )

    expect(
      screen.getByRole('button', { name: 'Open Sheet' })
    ).toBeInTheDocument()
  })

  it('opens sheet when trigger is clicked', async () => {
    const user = userEvent.setup()

    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Test Sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByRole('button', { name: 'Open Sheet' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Sheet')).toBeInTheDocument()
  })

  it('renders sheet content with all components', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Test Title</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <SheetDescription>Test Description</SheetDescription>
            <p>Test content</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
    expect(screen.getByText(/./, { selector: '.sr-only' })).toBeInTheDocument()
  })

  it('renders close button by default', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Test Sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByText(/./, { selector: '.sr-only' })).toBeInTheDocument()
  })

  it('does not render close button when showCloseButton is false', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent showCloseButton={false}>
          <SheetTitle>Test Sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    expect(
      screen.queryByText(/./, { selector: '.sr-only' })
    ).not.toBeInTheDocument()
  })

  it('closes sheet when close button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <Sheet>
        <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Test Sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByTestId('sheet-trigger'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const closeButton = screen
      .getByText(/./, { selector: '.sr-only' })
      .closest('button')
    expect(closeButton).toBeInTheDocument()
    await user.click(closeButton!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes sheet when escape key is pressed', async () => {
    const user = userEvent.setup()

    render(
      <Sheet>
        <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Test Sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByTestId('sheet-trigger'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders sheet with different side positions', () => {
    const { rerender } = render(
      <Sheet defaultOpen>
        <SheetContent side='right'>
          <SheetTitle>Right Sheet</SheetTitle>
          <SheetDescription>Right side sheet</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Right Sheet')).toBeInTheDocument()

    rerender(
      <Sheet defaultOpen>
        <SheetContent side='left'>
          <SheetTitle>Left Sheet</SheetTitle>
          <SheetDescription>Left side sheet</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByText('Left Sheet')).toBeInTheDocument()
  })
})
