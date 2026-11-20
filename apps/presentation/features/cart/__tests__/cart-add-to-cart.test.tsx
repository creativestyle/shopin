import { useState, type RefObject } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { AddToCart } from '../cart-add-to-cart'
import {
  AddToCartModalProvider,
  useAddToCartModal,
} from '../cart-add-to-cart-modal-provider'

jest.mock('next/navigation', () => ({ useSearchParams: () => null }))

jest.mock('../hooks/use-add-to-cart', () => ({
  useAddToCart: () => useMockAddToCart(),
}))

// Stand-in for the cart-backed modal; keeps the real Sheet and restore ref.
jest.mock('../components/add-to-cart-modal', () => ({
  AddToCartModal: (props: MockModalProps) => mockAddToCartModal(props),
}))

interface MockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restoreFocusRef?: RefObject<HTMLElement | null>
}

let resolveRequest: () => void
let resolveMutation: () => void

function useMockAddToCart() {
  const { setOpen } = useAddToCartModal()
  const [isPending, setIsPending] = useState(false)

  const handleAddToCart = async () => {
    setIsPending(true)
    await new Promise<void>((resolve) => (resolveRequest = resolve))
    // react-query runs onSuccess (which opens the sheet) before mutateAsync resolves.
    setOpen(true)
    await new Promise<void>((resolve) => (resolveMutation = resolve))
    setIsPending(false)
  }

  return { handleAddToCart, isPending }
}

function mockAddToCartModal({
  open,
  onOpenChange,
  restoreFocusRef,
}: MockModalProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        aria-describedby={undefined}
        restoreFocusRef={restoreFocusRef}
      >
        <SheetTitle>Added to basket</SheetTitle>
      </SheetContent>
    </Sheet>
  )
}

// jsdom keeps focus on a disabled control; browsers move it to body.
function moveFocusToBody() {
  const temp = document.body.appendChild(document.createElement('input'))
  temp.focus()
  temp.remove()
}

describe('AddToCart focus restore', () => {
  it('returns focus to the button after the add-to-cart sheet closes', async () => {
    const user = userEvent.setup()
    render(
      <AddToCartModalProvider>
        <AddToCart
          productId='product-1'
          variantId='variant-1'
        />
      </AddToCartModalProvider>
    )
    const button = screen.getByRole('button', {
      name: 'product.buyBox.addToBasket',
    })

    await user.click(button)
    await waitFor(() => expect(button).toBeDisabled())
    act(() => moveFocusToBody())

    await act(async () => resolveRequest())
    await screen.findByRole('dialog')
    await act(async () => resolveMutation())
    await waitFor(() => expect(button).toBeEnabled())

    await user.keyboard('{Escape}')

    await waitFor(() => expect(button).toHaveFocus())
  })
})
