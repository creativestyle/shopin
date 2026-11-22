import { useRef, useState } from 'react'
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useFocusRestore } from '../use-focus-restore'

// jsdom keeps focus on a disabled control; browsers move it to body.
function moveFocusToBody() {
  const temp = document.body.appendChild(document.createElement('input'))
  temp.focus()
  temp.remove()
}

interface HarnessProps {
  withRef?: boolean
  disableOnOpen?: boolean
  onOpenAutoFocus?: (event: Event) => void
  onCloseAutoFocus?: (event: Event) => void
}

function Harness({
  withRef = true,
  disableOnOpen = false,
  onOpenAutoFocus,
  onCloseAutoFocus,
}: HarnessProps) {
  const [open, setOpen] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [mounted, setMounted] = useState(true)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      {mounted && (
        <button
          ref={triggerRef}
          disabled={disabled}
          onClick={() => {
            if (disableOnOpen) {
              setDisabled(true)
              moveFocusToBody()
            }
            setOpen(true)
          }}
        >
          Open
        </button>
      )}
      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent
          aria-describedby={undefined}
          restoreFocusRef={withRef ? triggerRef : undefined}
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <SheetTitle>Sheet</SheetTitle>
          <button onClick={() => setDisabled(false)}>Enable trigger</button>
          <button onClick={() => setMounted(false)}>Remove trigger</button>
        </SheetContent>
      </Sheet>
    </>
  )
}

function ControlledHarness({ open }: { open: boolean }) {
  return (
    <>
      <button>Other</button>
      <Sheet open={open}>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle>Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    </>
  )
}

describe('useFocusRestore with Sheet', () => {
  it('returns focus to restoreFocusRef after it was disabled and re-enabled', async () => {
    const user = userEvent.setup()
    render(<Harness disableOnOpen />)
    const trigger = screen.getByRole('button', { name: 'Open' })

    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Enable trigger' }))
    await user.keyboard('{Escape}')

    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('falls back to the element focused at open when no ref is given', async () => {
    const user = userEvent.setup()
    render(<Harness withRef={false} />)
    const trigger = screen.getByRole('button', { name: 'Open' })

    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('does not restore to a previously focused element when nothing is focused at open', async () => {
    const { rerender } = render(<ControlledHarness open={false} />)
    const other = screen.getByRole('button', { name: 'Other' })

    act(() => other.focus())
    act(() => other.blur())
    rerender(<ControlledHarness open />)
    await screen.findByRole('dialog')
    rerender(<ControlledHarness open={false} />)

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(other).not.toHaveFocus()
  })

  it('does not throw when the opener is unmounted before close', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Open' })

    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Remove trigger' }))
    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(trigger).not.toBeInTheDocument()
  })

  it('skips the restore when the consumer prevents onCloseAutoFocus', async () => {
    const user = userEvent.setup()
    render(<Harness onCloseAutoFocus={(event) => event.preventDefault()} />)
    const trigger = screen.getByRole('button', { name: 'Open' })

    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(trigger).not.toHaveFocus()
  })

  it('still restores when the consumer prevents onOpenAutoFocus', async () => {
    const onOpenAutoFocus = jest.fn((event: Event) => event.preventDefault())
    const user = userEvent.setup()
    render(<Harness onOpenAutoFocus={onOpenAutoFocus} />)
    const trigger = screen.getByRole('button', { name: 'Open' })

    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Enable trigger' }))
    await user.keyboard('{Escape}')

    expect(onOpenAutoFocus).toHaveBeenCalled()
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})

describe('useFocusRestore handlers', () => {
  const autoFocusEvent = () => new Event('autofocus', { cancelable: true })

  it('cancels the default restore once focus lands on the opener', () => {
    const button = document.body.appendChild(document.createElement('button'))
    const { result } = renderHook(() => useFocusRestore({ current: button }))

    result.current.onOpenAutoFocus(autoFocusEvent())
    const closeEvent = autoFocusEvent()
    result.current.onCloseAutoFocus(closeEvent)

    expect(button).toHaveFocus()
    expect(closeEvent.defaultPrevented).toBe(true)
    button.remove()
  })

  it('keeps the default restore when the opener cannot take focus', () => {
    const button = document.body.appendChild(document.createElement('button'))
    const { result } = renderHook(() => useFocusRestore({ current: button }))

    result.current.onOpenAutoFocus(autoFocusEvent())
    button.disabled = true
    const closeEvent = autoFocusEvent()
    result.current.onCloseAutoFocus(closeEvent)

    expect(button).not.toHaveFocus()
    expect(closeEvent.defaultPrevented).toBe(false)
    button.remove()
  })

  it('keeps the default restore when the opener is detached', () => {
    const button = document.body.appendChild(document.createElement('button'))
    const { result } = renderHook(() => useFocusRestore({ current: button }))

    result.current.onOpenAutoFocus(autoFocusEvent())
    button.remove()
    const closeEvent = autoFocusEvent()
    result.current.onCloseAutoFocus(closeEvent)

    expect(closeEvent.defaultPrevented).toBe(false)
  })
})
